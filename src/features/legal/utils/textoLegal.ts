// src/features/legal/utils/textoLegal.ts
//
// Regras puras dos documentos legais e do reaceite (testadas em __tests__/textoLegal.test.ts).
// Ficam fora das telas para que o destaque de pendências e a decisão de mostrar o reaceite
// possam ser conferidos sem React.

export type TrechoLegal = { texto: string; pendente: boolean };

/**
 * Parte um parágrafo em trechos normais e trechos `[ENTRE COLCHETES]` (o que só a UFV pode
 * confirmar). Os colchetes ficam no trecho pendente, para a pessoa ver exatamente o que falta.
 * Colchete sem par é tratado como texto normal (não some nada do parágrafo).
 */
export function partirPendencias(texto: string): TrechoLegal[] {
  const trechos: TrechoLegal[] = [];
  const regex = /\[[^\[\]]*\]/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(texto)) !== null) {
    if (m.index > ultimo) trechos.push({ texto: texto.slice(ultimo, m.index), pendente: false });
    trechos.push({ texto: m[0], pendente: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) trechos.push({ texto: texto.slice(ultimo), pendente: false });
  return trechos;
}

/** "3. Pra que usamos" → { numero: '3', titulo: 'Pra que usamos' }. Sem número, `numero` é null. */
export function separarNumeroSecao(titulo: string): { numero: string | null; titulo: string } {
  const m = /^\s*(\d+)\.\s+(.*)$/.exec(titulo);
  return m ? { numero: m[1], titulo: m[2] } : { numero: null, titulo };
}

/**
 * Telas "calmas" onde o reaceite pode aparecer: nunca no meio de lição, registro ou triagem.
 * Os documentos legais ficam de fora para o modal sumir enquanto a pessoa lê e voltar depois.
 */
export const ROTAS_PARA_REACEITE: ReadonlySet<string> = new Set([
  'Home',
  'Trilha',
  'Alimentacao',
  'Missoes',
  'Social',
  'Mais',
]);

export function deveMostrarReaceite(params: {
  precisaReaceite: boolean;
  dispensadoNaSessao: boolean;
  rotaAtiva: string | undefined;
}): boolean {
  const { precisaReaceite, dispensadoNaSessao, rotaAtiva } = params;
  return precisaReaceite && !dispensadoNaSessao && !!rotaAtiva && ROTAS_PARA_REACEITE.has(rotaAtiva);
}
