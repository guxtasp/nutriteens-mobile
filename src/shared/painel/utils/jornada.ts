// src/shared/painel/utils/jornada.ts
//
// Regras puras dos gráficos de jornada (uso progressivo do app) e dos INSIGHTS: frases curtas
// geradas a partir dos números, para a equipe não precisar interpretar cada gráfico sozinha.
// Tom: descritivo, sem julgar o adolescente (a frase fala do uso do app, nunca de "falha").
// Só usam dados de USO; nada de alimentação ou saúde.
import type {
  AdocaoRecurso, AnalyticsJornada, ChaveMarco, Coorte, DiaCalendario, JornadaParticipante, Recurso, SemanaEstagios,
} from '../services/jornadaService';

export const ROTULO_RECURSO: Record<Recurso, string> = {
  registro: 'Registros do dia',
  trilha: 'Trilhas',
  desafio: 'Desafios',
  receita: 'Receitas',
  social: 'Social',
  scanner: 'Scanner',
  trocas: 'Trocas',
};

export const ROTULO_MARCO: Record<ChaveMarco, string> = {
  cadastro: 'Cadastro',
  onboarding: 'Apresentação concluída',
  triagem: 'Triagem concluída',
  primeiro_registro: 'Primeiro registro',
  primeira_licao: 'Primeira lição',
  primeiro_desafio: 'Primeiro desafio concluído',
  primeira_trilha: 'Primeira trilha concluída',
  primeira_amizade: 'Primeira amizade',
};

/** Estágios em ordem de engajamento (do mais alto ao mais baixo), mais "novos" à parte. */
export const ESTAGIOS = ['frequentes', 'ocasionais', 'pausa', 'inativos'] as const;
export type Estagio = (typeof ESTAGIOS)[number] | 'novos';
export const ROTULO_ESTAGIO: Record<Estagio, string> = {
  novos: 'Novos',
  frequentes: 'Frequentes (3+ dias)',
  ocasionais: 'Ocasionais (1–2 dias)',
  pausa: 'Em pausa',
  inativos: 'Inativos',
};
export const AJUDA_ESTAGIO: Record<Estagio, string> = {
  novos: 'Conta criada nesta semana.',
  frequentes: 'Usou o app em 3 ou mais dias da semana.',
  ocasionais: 'Usou o app em 1 ou 2 dias da semana.',
  pausa: 'Não usou nesta semana, mas usou em alguma das 3 anteriores.',
  inativos: 'Sem uso nesta semana nem nas 3 anteriores.',
};

export const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const FAIXAS_HORARIO = ['0–3h', '3–6h', '6–9h', '9–12h', '12–15h', '15–18h', '18–21h', '21–24h'];
const NOME_DIA = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

export type Insight = { tom: 'positivo' | 'atencao' | 'neutro'; titulo: string; texto: string };

/** Data "AAAA-MM-DD" → "dd/mm". */
export function diaMes(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function totalSemana(s: SemanaEstagios): number {
  return s.novos + s.frequentes + s.ocasionais + s.pausa + s.inativos;
}

/** Índice 0..(passos-1) de um valor numa escala de 0 a max (0 fica de fora: é "sem uso"). */
export function nivel(valor: number, max: number, passos = 4): number {
  if (valor <= 0 || max <= 0) return -1;
  return Math.min(passos - 1, Math.floor((valor / max) * passos - 1e-9));
}

/** Retenção média de uma semana N entre as turmas que já têm número (null se nenhuma). */
export function retencaoMedia(coortes: Coorte[], semana: number): number | null {
  const v = coortes.map((c) => c.retencao[semana]).filter((x): x is number => typeof x === 'number');
  return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : null;
}

/** % de adoção de um recurso até a semana N de conta (null se poucos dados). */
export function adocaoNa(a: AdocaoRecurso, semana: number): number | null {
  return a.pontos.find((p) => p.semana === semana)?.pct ?? null;
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// ---------------------------------------------------------------- insights gerais

export function insightsGerais(j: AnalyticsJornada): Insight[] {
  const out: Insight[] = [];
  const est = j.estagios.filter((s) => totalSemana(s) > 0);

  // 1. tendência dos frequentes (última semana x 4 semanas antes)
  if (est.length >= 5) {
    const atual = est[est.length - 1];
    const antes = est[est.length - 5];
    const pctAtual = Math.round((100 * atual.frequentes) / Math.max(1, totalSemana(atual)));
    const pctAntes = Math.round((100 * antes.frequentes) / Math.max(1, totalSemana(antes)));
    const dif = pctAtual - pctAntes;
    if (Math.abs(dif) >= 5) {
      out.push({
        tom: dif > 0 ? 'positivo' : 'atencao',
        titulo: dif > 0 ? 'Mais adolescentes usando com frequência' : 'Menos adolescentes usando com frequência',
        texto: `Os frequentes (3+ dias por semana) passaram de ${pctAntes}% para ${pctAtual}% dos cadastrados em 4 semanas.`,
      });
    } else {
      out.push({ tom: 'neutro', titulo: 'Uso frequente estável', texto: `Cerca de ${pctAtual}% dos cadastrados usam o app 3 ou mais dias por semana.` });
    }
  }

  // 2. grupo em pausa (o mais fácil de reconquistar)
  const ultima = est[est.length - 1];
  if (ultima && ultima.pausa >= 1) {
    out.push({
      tom: 'atencao',
      titulo: `${plural(ultima.pausa, 'adolescente em pausa', 'adolescentes em pausa')}`,
      texto: 'Usaram o app nas últimas 3 semanas, mas não nesta. É o grupo mais fácil de trazer de volta com um lembrete ou conteúdo novo.',
    });
  }

  // 3. retenção na semana seguinte ao cadastro
  const r1 = retencaoMedia(j.coortes, 1);
  if (r1 !== null) {
    out.push({
      tom: r1 >= 50 ? 'positivo' : 'atencao',
      titulo: `${r1}% voltam na semana seguinte ao cadastro`,
      texto: r1 >= 50 ? 'A maioria das turmas continua usando depois da primeira semana.' : 'A primeira semana é o momento em que mais gente se perde. Vale reforçar o começo da jornada (boas-vindas, primeiras missões).',
    });
  }

  // 4. adoção dos recursos até a 4ª semana
  const comDado = j.adocao.map((a) => ({ a, pct: adocaoNa(a, 4) })).filter((x): x is { a: AdocaoRecurso; pct: number } => x.pct !== null);
  if (comDado.length >= 2) {
    const ord = [...comDado].sort((x, y) => y.pct - x.pct);
    const maior = ord[0];
    const menor = ord[ord.length - 1];
    out.push({
      tom: 'neutro',
      titulo: `${ROTULO_RECURSO[maior.a.recurso]} é o recurso mais adotado`,
      texto: `${maior.pct}% usam até a 4ª semana de conta; ${ROTULO_RECURSO[menor.a.recurso]} chega a ${menor.pct}%. Recursos pouco descobertos podem ganhar destaque no app.`,
    });
  }

  // 5. horário de pico
  const celulas = j.horarios.filter((h) => typeof h.pessoas === 'number') as { dia: number; faixa: number; pessoas: number }[];
  if (celulas.length) {
    const pico = celulas.reduce((m, c) => (c.pessoas > m.pessoas ? c : m));
    out.push({
      tom: 'neutro',
      titulo: `Pico de uso: ${NOME_DIA[pico.dia]}, ${FAIXAS_HORARIO[pico.faixa]}`,
      texto: `${plural(pico.pessoas, 'pessoa usou', 'pessoas usaram')} o app nesse horário no período. Bom momento para lembretes e novidades.`,
    });
  }

  // 6. trilhas
  const totalTri = j.progresso_trilhas.reduce((s, f) => s + f.pessoas, 0);
  const zero = j.progresso_trilhas.find((f) => f.faixa === '0')?.pessoas ?? 0;
  if (totalTri >= j.minimo_pessoas) {
    const pct = Math.round((100 * zero) / totalTri);
    out.push({
      tom: pct >= 50 ? 'atencao' : 'positivo',
      titulo: `${100 - pct}% já concluíram pelo menos uma lição`,
      texto: pct >= 50 ? `${pct}% ainda não concluíram nenhuma lição das trilhas.` : 'A maioria já começou a aprender pelas trilhas.',
    });
  }
  return out;
}

// ---------------------------------------------------------------- individual

/** Dias entre duas datas "AAAA-MM-DD" (b - a). */
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

export const usouNoDia = (d: DiaCalendario) => d.acoes > 0 || d.registro || d.licoes > 0;

/** Maior sequência de dias seguidos com uso no calendário. */
export function maiorSequencia(cal: DiaCalendario[]): number {
  let atual = 0;
  let max = 0;
  for (const d of cal) {
    atual = usouNoDia(d) ? atual + 1 : 0;
    max = Math.max(max, atual);
  }
  return max;
}

/** Agrupa o calendário em semanas (colunas) de 7 dias, segunda a domingo. */
export function semanasCalendario(cal: DiaCalendario[]): (DiaCalendario | null)[][] {
  if (!cal.length) return [];
  // dia da semana do 1º dia (0 = segunda)
  const dow = (new Date(`${cal[0].data}T12:00:00Z`).getUTCDay() + 6) % 7;
  const celulas: (DiaCalendario | null)[] = [...Array(dow).fill(null), ...cal];
  const out: (DiaCalendario | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) {
    const sem = celulas.slice(i, i + 7);
    while (sem.length < 7) sem.push(null);
    out.push(sem);
  }
  return out;
}

const PERIODO: Record<keyof JornadaParticipante['periodos'], string> = { madrugada: 'de madrugada', manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' };

export function insightsIndividuais(j: JornadaParticipante, hoje: string): Insight[] {
  const out: Insight[] = [];
  const cal = j.calendario.filter((d) => !d.antes_do_cadastro);
  const ultimas4 = cal.slice(-28).filter(usouNoDia).length;
  const anteriores4 = cal.slice(-56, -28).filter(usouNoDia).length;
  const temHistoricoAnterior = cal.length > 28;

  // 1. ritmo das últimas 4 semanas
  if (temHistoricoAnterior && (ultimas4 > 0 || anteriores4 > 0)) {
    const dif = ultimas4 - anteriores4;
    out.push({
      tom: dif > 0 ? 'positivo' : dif < 0 ? 'atencao' : 'neutro',
      titulo: dif > 0 ? 'Usando mais o app' : dif < 0 ? 'Usando menos o app' : 'Ritmo de uso estável',
      texto: `${plural(ultimas4, 'dia', 'dias')} com uso nas últimas 4 semanas (nas 4 anteriores: ${anteriores4}).`,
    });
  } else {
    out.push({ tom: 'neutro', titulo: 'Começo da jornada', texto: `${plural(ultimas4, 'dia', 'dias')} com uso desde o cadastro, nas últimas 4 semanas.` });
  }

  // 2. último uso
  const ultimoDia = [...cal].reverse().find(usouNoDia);
  if (!ultimoDia) {
    out.push({ tom: 'atencao', titulo: 'Sem uso nas últimas 12 semanas', texto: 'Ainda não há registros de uso do app neste período.' });
  } else {
    const dias = diasEntre(ultimoDia.data, hoje);
    if (dias >= 7) out.push({ tom: 'atencao', titulo: `Há ${dias} dias sem usar o app`, texto: `Último uso em ${diaMes(ultimoDia.data)}.` });
  }

  // 3. sequência
  const seq = maiorSequencia(cal);
  if (seq >= 3) out.push({ tom: 'positivo', titulo: `Sequência de ${seq} dias seguidos`, texto: 'Maior sequência de uso nas últimas 12 semanas.' });

  // 4. período do dia
  const per = Object.entries(j.periodos) as [keyof JornadaParticipante['periodos'], number][];
  const totalPer = per.reduce((s, [, n]) => s + n, 0);
  if (totalPer >= 10) {
    const [chave, n] = per.reduce((m, x) => (x[1] > m[1] ? x : m));
    out.push({ tom: 'neutro', titulo: `Costuma usar ${PERIODO[chave]}`, texto: `${Math.round((100 * n) / totalPer)}% das ações aconteceram nesse período.` });
  }

  // 5. recursos: o mais usado e os ainda não experimentados
  const usados = j.recursos.filter((r) => r.dias > 0).sort((a, b) => b.dias - a.dias);
  const nunca = j.recursos.filter((r) => r.dias === 0).map((r) => ROTULO_RECURSO[r.recurso]);
  if (usados.length) {
    out.push({
      tom: 'neutro',
      titulo: `Mais usado: ${ROTULO_RECURSO[usados[0].recurso]}`,
      texto: nunca.length ? `Ainda não experimentou: ${nunca.join(', ')}.` : 'Já experimentou todos os recursos do app.',
    });
  }

  // 6. tempo até o primeiro registro
  const reg = j.marcos.find((m) => m.chave === 'primeiro_registro')?.data;
  if (reg) {
    const d = diasEntre(j.cadastro, reg);
    out.push({ tom: 'neutro', titulo: d <= 1 ? 'Registrou logo no começo' : `Primeiro registro ${d} dias após o cadastro`, texto: `Primeiro registro em ${diaMes(reg)}.` });
  }
  return out;
}
