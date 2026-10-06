// Progresso de uma missão: quanto já foi feito, qual a meta e quanto FALTA.
// Lógica pura (sem Supabase) — testada em __tests__/progresso.test.ts.

export type Unidade = { singular: string; plural: string };

export const UNIDADES = {
  ml: { singular: 'ml', plural: 'ml' },
  min: { singular: 'min', plural: 'min' },
  porcao: { singular: 'porção', plural: 'porções' },
  refeicao: { singular: 'refeição', plural: 'refeições' },
  dia: { singular: 'dia', plural: 'dias' },
  licao: { singular: 'lição', plural: 'lições' },
  missao: { singular: 'missão', plural: 'missões' },
} as const satisfies Record<string, Unidade>;

export type Progresso = {
  atual: number;
  alvo: number;
  unidade: Unidade;
  faltam: number;
  /** 0 a 1, para a barra */
  fracao: number;
  concluida: boolean;
};

export function criarProgresso(atual: number, alvo: number, unidade: Unidade): Progresso {
  const a = Number.isFinite(atual) ? Math.max(atual, 0) : 0;
  const meta = Number.isFinite(alvo) ? Math.max(alvo, 0) : 0;
  return {
    atual: a,
    alvo: meta,
    unidade,
    faltam: Math.max(meta - a, 0),
    fracao: meta > 0 ? Math.min(a / meta, 1) : 0,
    concluida: meta > 0 && a >= meta,
  };
}

function nome(valor: number, u: Unidade): string {
  return valor === 1 ? u.singular : u.plural;
}

/** "Faltam 600 ml" / "Falta 1 refeição" / "Meta batida!" */
export function textoFalta(p: Progresso): string {
  if (p.concluida) return 'Meta batida!';
  const n = Math.ceil(p.faltam);
  return `${n === 1 ? 'Falta' : 'Faltam'} ${n} ${nome(n, p.unidade)}`;
}

/** "1400 de 2000 ml" */
export function textoAtual(p: Progresso): string {
  const atual = Math.round(p.atual);
  const alvo = Math.round(p.alvo);
  return `${atual} de ${alvo} ${nome(alvo, p.unidade)}`;
}

/** "700 / 2000" — texto curto para dentro da barra */
export function textoBarra(p: Progresso): string {
  return `${Math.round(p.atual)} / ${Math.round(p.alvo)}`;
}
