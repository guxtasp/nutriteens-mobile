// Cálculos puros da evolução do participante (sem rede, fáceis de testar).

export type SemanaEvolucao = {
  inicio: string;            // segunda-feira da semana (YYYY-MM-DD)
  diasComRegistro: number;   // 0 a 7
  refeicoes: number;
  aguaMediaMl: number;       // média nos dias com água registrada
  atividadeMin: number;
  itens: number;             // alimentos registrados nas refeições realizadas
  itensUltra: number;
  itensInNatura: number;
};

export type Tendencia = { direcao: 'sobe' | 'desce' | 'estavel' | 'sem_dados'; anterior: number | null; recente: number | null };

const media = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);

/**
 * Compara as últimas `janela` semanas com as `janela` anteriores. Só entram semanas com dados (valor não nulo).
 * Variação menor que `limite` (10%) conta como estável.
 */
export function tendencia(valores: (number | null)[], janela = 4, limite = 0.1): Tendencia {
  const recentes = valores.slice(-janela).filter((x): x is number => x !== null);
  const antes = valores.slice(-2 * janela, -janela).filter((x): x is number => x !== null);
  const r = media(recentes);
  const a = media(antes);
  if (r === null || a === null) return { direcao: 'sem_dados', anterior: a, recente: r };
  const base = Math.max(Math.abs(a), 1e-9);
  const rel = (r - a) / base;
  const direcao = Math.abs(rel) < limite ? 'estavel' : rel > 0 ? 'sobe' : 'desce';
  return { direcao, anterior: Math.round(a * 10) / 10, recente: Math.round(r * 10) / 10 };
}

/** % de itens ultraprocessados da semana; null quando nada foi registrado (para não virar "0%"). */
export function pctUltra(s: Pick<SemanaEvolucao, 'itens' | 'itensUltra'>): number | null {
  return s.itens > 0 ? Math.round((100 * s.itensUltra) / s.itens) : null;
}

/** Série para o gráfico: semana sem dado vira 0 (o rótulo do cartão avisa). */
export const paraGrafico = (v: (number | null)[]): number[] => v.map((x) => x ?? 0);

export function textoTendencia(t: Tendencia, melhoraQuando: 'sobe' | 'desce'): { texto: string; tom: 'bom' | 'atencao' | 'neutro' } {
  if (t.direcao === 'sem_dados') return { texto: 'Ainda sem dados suficientes para comparar', tom: 'neutro' };
  if (t.direcao === 'estavel') return { texto: 'Estável nas últimas semanas', tom: 'neutro' };
  const bom = t.direcao === melhoraQuando;
  return { texto: t.direcao === 'sobe' ? 'Subiu nas últimas semanas' : 'Caiu nas últimas semanas', tom: bom ? 'bom' : 'atencao' };
}

/** Diferença entre duas avaliações consecutivas (+ = aumentou). null se faltar valor. */
export function variacao(atual: number | null | undefined, anterior: number | null | undefined): number | null {
  return typeof atual === 'number' && typeof anterior === 'number' ? Math.round((atual - anterior) * 10) / 10 : null;
}
