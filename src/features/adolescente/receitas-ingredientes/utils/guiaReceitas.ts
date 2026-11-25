// src/features/adolescente/receitas-ingredientes/utils/guiaReceitas.ts
//
// Textos que guiam a tela "Receitas com o que tenho". Quem chegava não entendia o que fazer: agora
// o Bróxis explica o 1º passo e, a cada ingrediente marcado, diz na hora quantas receitas já dá
// pra fazer, e o botão mostra esse número. Regras puras, testadas em __tests__/guiaReceitas.test.ts.

export type ContagemGuia = {
  /** ingredientes marcados */
  ingredientes: number;
  /** receitas que usam pelo menos 1 ingrediente marcado */
  combinam: number;
  /** receitas em que não falta nada */
  agora: number;
  /** não há nenhuma receita publicada */
  semReceitas: boolean;
};

/** Fala do Bróxis no topo do passo 1. */
export function falaGuiaReceitas(c: ContagemGuia): string {
  if (c.semReceitas) return 'Ainda não tem receita liberada, mas você já pode marcar o que tem em casa.';
  if (c.ingredientes === 0) return 'Me conta o que tem aí na sua casa que eu te mostro receitas que dá pra fazer!';
  if (c.agora > 0) return c.agora === 1 ? 'Boa! Com isso já dá pra fazer 1 receita agora.' : `Boa! Com isso já dá pra fazer ${c.agora} receitas agora.`;
  if (c.combinam > 0) return `Achei ${c.combinam} ${c.combinam === 1 ? 'receita que usa' : 'receitas que usam'} o que você tem. Marca mais pra completar!`;
  return 'Ainda não achei receita com isso. Marca mais alguns ingredientes!';
}

/** Rótulo do botão principal do passo 1. */
export function rotuloBotaoReceitas(c: Pick<ContagemGuia, 'ingredientes' | 'combinam'>): string {
  if (c.ingredientes === 0) return 'MARQUE PELO MENOS 1 INGREDIENTE';
  if (c.combinam === 0) return 'VER RECEITAS';
  return `VER ${c.combinam} ${c.combinam === 1 ? 'RECEITA' : 'RECEITAS'}`;
}
