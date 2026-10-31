// src/shared/painel/ajuda.ts
// Ajuda de cada widget do painel em 3 linhas: o que é · como ler · de onde vem o dado.
// `ajuda` aceita um texto livre (telas de edição) ou o objeto de 3 linhas (widgets de dados).
export type AjudaWidget = string | { oque: string; como: string; origem: string };

/** Texto único para o InfoSheet; o objeto vira 3 parágrafos rotulados. */
export function textoAjuda(ajuda: AjudaWidget): string {
  if (typeof ajuda === 'string') return ajuda;
  return `O que é: ${ajuda.oque}\n\nComo ler: ${ajuda.como}\n\nDe onde vem: ${ajuda.origem}`;
}
