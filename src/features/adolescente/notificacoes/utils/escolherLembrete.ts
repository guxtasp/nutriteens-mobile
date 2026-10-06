// src/features/adolescente/notificacoes/utils/escolherLembrete.ts
//
// Lógica PURA (sem React Native, sem Supabase) que decide QUAIS lembretes
// agendar e QUANDO. Tudo que é regra anti-spam mora aqui, testado em
// __tests__/escolherLembrete.test.ts.
//
// Regras:
//  - Orçamento diário: 1 lembrete por dia (2 só se a pessoa pedir). Os cinco
//    tipos disputam a mesma vaga; nenhum ganha notificação própria todo dia.
//  - Hoje só entra o que ainda está PENDENTE (água não bateu a meta etc.).
//    Se está tudo feito, hoje fica sem lembrete.
//  - Horário orgânico: mediana dos horários em que a pessoa costuma abrir o
//    app (últimos 30 dias), limitada a uma janela razoável (11h–20h30, fora
//    de aula e de hora de dormir). Sem histórico, usa 17h30.
//  - Se a pessoa abriu o app há menos de 3h do horário previsto, hoje não manda.
//  - Freio: 3 lembretes seguidos sem resposta → cai pra ~2 por semana.
//  - Saudade: sem abrir o app, no máximo 1 a cada 3 dias (dias 3 e 6) e para.
import { TIPOS_REGULARES, TipoLembrete, TipoRegular } from '../data/mensagensLembrete';

export const HORA_PADRAO = 17.5;
export const HORA_MIN = 11;
export const HORA_MAX = 20.5;
export const HORAS_SEM_LEMBRETE_APOS_ABERTURA = 3;
export const JANELA_RESPOSTA_HORAS = 3;
export const IGNORADAS_PARA_FREAR = 3;
export const MIN_ABERTURAS_PARA_HORARIO_ORGANICO = 3;

const HORA_MS = 3600 * 1000;
const DIA_MS = 24 * HORA_MS;

export type ConfigLembretes = {
  ativado: boolean;
  tipos: Record<TipoRegular, boolean>;
  porDia: 1 | 2;
};

export const CONFIG_PADRAO: ConfigLembretes = {
  ativado: true,
  tipos: { agua: true, alimentacao: true, trilha: true, missao: true, atividade: true },
  porDia: 1,
};

/** true = ainda está pendente hoje (vale lembrar). */
export type PendentesHoje = Record<TipoRegular, boolean>;

export type LembretePlanejado = { quando: Date; tipo: TipoLembrete };

export type EntradaPlano = {
  agora: Date;
  config: ConfigLembretes;
  pendentes: PendentesHoje;
  aberturas: number[]; // timestamps (ms) das aberturas do app
  ignoradasSeguidas: number;
  ultimoPorTipo: Partial<Record<TipoRegular, number>>; // quando cada tipo foi lembrado por último
  ultimaAbertura?: number;
};

export function horaDoDia(timestamp: number): number {
  const d = new Date(timestamp);
  return d.getHours() + d.getMinutes() / 60;
}

function limitar(valor: number, min: number, max: number): number {
  return Math.min(Math.max(valor, min), max);
}

/** Mediana dos horários de abertura recentes, limitada à janela; senão o padrão. */
export function horaOrganica(aberturas: number[], agora: number): number {
  const recentes = aberturas.filter((t) => agora - t <= 30 * DIA_MS);
  if (recentes.length < MIN_ABERTURAS_PARA_HORARIO_ORGANICO) return HORA_PADRAO;

  const horas = recentes.map(horaDoDia).sort((a, b) => a - b);
  const meio = Math.floor(horas.length / 2);
  const mediana = horas.length % 2 === 0 ? (horas[meio - 1] + horas[meio]) / 2 : horas[meio];

  // arredonda pra múltiplos de 5 minutos
  return limitar(Math.round(mediana * 12) / 12, HORA_MIN, HORA_MAX);
}

/** Segundo horário do dia (só quando a pessoa pede 2 por dia): ~4h30 de distância do primeiro. */
export function segundaHora(primeira: number): number | null {
  const candidata = primeira >= 15 ? primeira - 4.5 : primeira + 4.5;
  const hora = limitar(candidata, HORA_MIN, HORA_MAX);
  return Math.abs(hora - primeira) >= 3 ? hora : null;
}

export function dataComHora(base: Date, offsetDias: number, hora: number): Date {
  const horas = Math.floor(hora);
  const minutos = Math.round((hora - horas) * 60);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offsetDias, horas, minutos, 0, 0);
}

/**
 * Escolhe o tipo do lembrete: entre os candidatos, o lembrado há mais tempo
 * (nunca lembrado ganha de todos); empate → ordem de prioridade de TIPOS_REGULARES
 * (missão > alimentação > atividade > água > trilha).
 */
function escolherTipo(candidatos: TipoRegular[], ultimoPorTipo: Partial<Record<TipoRegular, number>>): TipoRegular {
  return [...candidatos].sort((a, b) => {
    const diferenca = (ultimoPorTipo[a] ?? 0) - (ultimoPorTipo[b] ?? 0);
    if (diferenca !== 0) return diferenca;
    return TIPOS_REGULARES.indexOf(a) - TIPOS_REGULARES.indexOf(b);
  })[0];
}

type DiaDoPlano = { dia: number; tipo: 'regular' | 'saudade' };

export function planejarLembretes(entrada: EntradaPlano): LembretePlanejado[] {
  const { agora, config, pendentes, aberturas, ignoradasSeguidas } = entrada;
  if (!config.ativado) return [];

  const habilitados = TIPOS_REGULARES.filter((t) => config.tipos[t]);
  if (habilitados.length === 0) return []; // pessoa desligou todos os tipos: silêncio total

  const agoraMs = agora.getTime();
  const freando = ignoradasSeguidas >= IGNORADAS_PARA_FREAR;
  const porDia = freando ? 1 : config.porDia;

  const hora1 = horaOrganica(aberturas, agoraMs);
  const horas = [hora1];
  if (porDia === 2) {
    const hora2 = segundaHora(hora1);
    if (hora2 !== null) horas.push(hora2);
  }

  // Sem abrir o app, só os próximos dias já agendados valem: hoje/amanhã
  // (lembretes comuns) e depois só "saudade" nos dias 3 e 6. Cada abertura do
  // app reagenda tudo, então isso é o teto do que pode chegar sem resposta.
  const dias: DiaDoPlano[] = freando
    ? [{ dia: 2, tipo: 'regular' }, { dia: 5, tipo: 'saudade' }]
    : [{ dia: 0, tipo: 'regular' }, { dia: 1, tipo: 'regular' }, { dia: 3, tipo: 'saudade' }, { dia: 6, tipo: 'saudade' }];

  const ultimaAbertura = entrada.ultimaAbertura ?? agoraMs;
  const usado: Partial<Record<TipoRegular, number>> = { ...entrada.ultimoPorTipo };
  const plano: LembretePlanejado[] = [];

  for (const { dia, tipo } of dias) {
    const escolhidosNoDia: TipoRegular[] = [];
    const horasDoDia = tipo === 'saudade' ? [hora1] : horas;

    for (const hora of horasDoDia) {
      const quando = dataComHora(agora, dia, hora);
      const quandoMs = quando.getTime();

      if (quandoMs <= agoraMs + 5 * 60 * 1000) continue; // já passou (ou está colado)
      if (dia === 0 && quandoMs - ultimaAbertura < HORAS_SEM_LEMBRETE_APOS_ABERTURA * HORA_MS) continue;

      if (tipo === 'saudade') {
        plano.push({ quando, tipo: 'saudade' });
        continue;
      }

      const candidatos = habilitados.filter((t) => {
        if (escolhidosNoDia.includes(t)) return false;
        if (t === 'alimentacao' && hora < 12) return false; // cedo demais pra perguntar do prato
        if (dia === 0 && !pendentes[t]) return false; // hoje: só o que falta fazer
        return true;
      });
      if (candidatos.length === 0) continue;

      const escolhido = escolherTipo(candidatos, usado);
      escolhidosNoDia.push(escolhido);
      usado[escolhido] = quandoMs;
      plano.push({ quando, tipo: escolhido });
    }
  }

  return plano.sort((a, b) => a.quando.getTime() - b.quando.getTime());
}

// ---------------------------------------------------------------------
// Freio automático: contar lembretes que a pessoa não respondeu
// ---------------------------------------------------------------------

export type LembreteAgendado = { quando: number; tipo: TipoLembrete };

/**
 * Um lembrete foi "respondido" se o app foi aberto até 3h depois dele (tocando
 * na notificação ou não). Percorre em ordem: respondido zera a contagem,
 * ignorado soma. Lembretes ainda dentro da janela de resposta (e sem abertura)
 * ficam pra depois; os futuros são descartados porque o novo plano os substitui.
 */
export function atualizarIgnoradas<T extends LembreteAgendado>(params: {
  agendados: T[];
  aberturas: number[];
  agora: number;
  ignoradasAntes: number;
}): { ignoradasSeguidas: number; agendadosPendentes: T[] } {
  const { agendados, aberturas, agora } = params;
  const janela = JANELA_RESPOSTA_HORAS * HORA_MS;

  let ignoradas = params.ignoradasAntes;
  const aindaNaJanela: T[] = [];

  const disparados = agendados.filter((a) => a.quando <= agora).sort((a, b) => a.quando - b.quando);
  for (const lembrete of disparados) {
    const respondido = aberturas.some((t) => t >= lembrete.quando && t <= lembrete.quando + janela);
    if (respondido) ignoradas = 0;
    else if (agora >= lembrete.quando + janela) ignoradas += 1;
    else aindaNaJanela.push(lembrete);
  }

  return { ignoradasSeguidas: ignoradas, agendadosPendentes: aindaNaJanela };
}
