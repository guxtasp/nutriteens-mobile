// Lógica pura das fases do Broxis. Os limiares reais vêm da tabela
// `fases_mascote`; FASES_PADRAO é só fallback (offline / tabela ainda vazia).
export type FaseId = 'filhote' | 'jovem' | 'adulto';

export type FaseMascote = {
  fase: FaseId;
  titulo: string;
  xpMinimo: number;
};

export const FASES_PADRAO: FaseMascote[] = [
  { fase: 'filhote', titulo: 'Broxinho', xpMinimo: 0 },
  { fase: 'jovem', titulo: 'Broxis', xpMinimo: 500 },
  { fase: 'adulto', titulo: 'Super Broxis', xpMinimo: 1500 },
];

export type EstadoFase = {
  atual: FaseMascote;
  proxima: FaseMascote | null;
  /** 0..1 dentro da fase atual (1 quando já está na última) */
  progresso: number;
  xpFaltando: number;
};

export function calcularEstadoFase(xpTotal: number, fases: FaseMascote[] = FASES_PADRAO): EstadoFase {
  const xp = Math.max(0, Math.floor(xpTotal || 0));
  const ordenadas = [...fases].sort((a, b) => a.xpMinimo - b.xpMinimo);
  let indice = 0;
  ordenadas.forEach((f, i) => {
    if (xp >= f.xpMinimo) indice = i;
  });

  const atual = ordenadas[indice];
  const proxima = ordenadas[indice + 1] ?? null;
  if (!proxima) return { atual, proxima: null, progresso: 1, xpFaltando: 0 };

  const faixa = proxima.xpMinimo - atual.xpMinimo;
  return {
    atual,
    proxima,
    progresso: Math.min(1, (xp - atual.xpMinimo) / faixa),
    xpFaltando: proxima.xpMinimo - xp,
  };
}

/** Posição da fase na ordem de evolução (0 = filhote). -1 se não existir na lista. */
export function indiceFase(fase: FaseId, fases: FaseMascote[] = FASES_PADRAO): number {
  return [...fases].sort((a, b) => a.xpMinimo - b.xpMinimo).findIndex((f) => f.fase === fase);
}

/**
 * Decide se a evolução do Broxis merece a animação de "subiu de fase".
 * Só comemora quando a fase atual está À FRENTE da última que o aluno já viu.
 * Sem registro anterior (primeira vez neste aparelho), não comemora: quem já estava
 * numa fase alta antes desta versão não deve ver uma evolução "do nada".
 */
export function faseParaCelebrar(
  atual: FaseId,
  ultimaVista: FaseId | null,
  fases: FaseMascote[] = FASES_PADRAO,
): FaseId | null {
  if (!ultimaVista) return null;
  const iAtual = indiceFase(atual, fases);
  const iVista = indiceFase(ultimaVista, fases);
  if (iAtual < 0) return null;
  return iAtual > iVista ? atual : null;
}
