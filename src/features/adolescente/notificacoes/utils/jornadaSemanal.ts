// src/features/adolescente/notificacoes/utils/jornadaSemanal.ts
//
// Lembrete SEMANAL "sua jornada está pronta". Lógica pura, separada do planejamento diário
// (escolherLembrete.ts) para não mexer nas regras já testadas. Regras:
//  - 1 por semana, no domingo, no horário orgânico da pessoa (mesma janela 11h–20h30);
//  - ocupa a vaga do dia em que cai: some qualquer outro lembrete daquele dia (nunca soma);
//  - só para quem tem usado o app (>= 2 aberturas nos últimos 14 dias): sem uso, o resumo seria oco;
//  - respeita o freio: com lembretes seguidos ignorados, não manda;
//  - desligável (config.jornadaSemanal === false) e dependente da chave geral.
import type { ConfigLembretes, LembretePlanejado } from './escolherLembrete';
import { dataComHora, IGNORADAS_PARA_FREAR } from './escolherLembrete';

export const DIA_DA_SEMANA_JORNADA = 0; // 0 = domingo
export const MIN_ABERTURAS_PARA_JORNADA = 2;
export const JANELA_USO_DIAS = 14;
const MARGEM_MS = 5 * 60 * 1000;
const HORA_MS = 3600 * 1000;
const DIA_MS = 24 * HORA_MS;
const HORAS_SEM_LEMBRETE_APOS_ABERTURA = 3;

export type EntradaJornada = {
  agora: Date;
  config: ConfigLembretes;
  aberturas: number[];
  ignoradasSeguidas: number;
  /** hora do dia em decimal (ex.: 17.5), já limitada à janela razoável */
  hora: number;
  ultimaAbertura?: number;
};

/** Próximo domingo na `hora` dada, sempre depois de agora + 5 min (e depois da folga da última abertura). */
export function proximaJornada(agora: Date, hora: number, ultimaAbertura?: number): Date {
  const agoraMs = agora.getTime();
  const ate = (dias: number) => dataComHora(agora, dias, hora);
  const faltam = (DIA_DA_SEMANA_JORNADA - agora.getDay() + 7) % 7;
  for (let semana = 0; semana < 2; semana++) {
    const quando = ate(faltam + 7 * semana);
    const ms = quando.getTime();
    if (ms <= agoraMs + MARGEM_MS) continue;
    if (ultimaAbertura !== undefined && ms - ultimaAbertura < HORAS_SEM_LEMBRETE_APOS_ABERTURA * HORA_MS) continue;
    return quando;
  }
  return ate(faltam + 14);
}

export function planejarJornadaSemanal(e: EntradaJornada): LembretePlanejado | null {
  if (!e.config.ativado || e.config.jornadaSemanal === false) return null;
  if (e.ignoradasSeguidas >= IGNORADAS_PARA_FREAR) return null;

  const agoraMs = e.agora.getTime();
  const recentes = e.aberturas.filter((t) => agoraMs - t <= JANELA_USO_DIAS * DIA_MS);
  if (recentes.length < MIN_ABERTURAS_PARA_JORNADA) return null;

  return { quando: proximaJornada(e.agora, e.hora, e.ultimaAbertura), tipo: 'jornada' };
}

const mesmoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Junta o plano diário com o resumo semanal: o resumo toma o lugar de tudo que cair no mesmo dia. */
export function combinarComJornada(plano: LembretePlanejado[], jornada: LembretePlanejado | null): LembretePlanejado[] {
  if (!jornada) return plano;
  return [...plano.filter((p) => !mesmoDia(p.quando, jornada.quando)), jornada].sort(
    (a, b) => a.quando.getTime() - b.quando.getTime(),
  );
}
