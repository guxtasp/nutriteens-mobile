// src/shared/theme/layout.ts
//
// Medidas de layout compartilhadas pelas abas do adolescente (Início, Trilha,
// Social, Comer, Mais). Antes cada tela usava o seu número (16, 20, 40...) e
// o topo começava em alturas diferentes; agora todas leem daqui.
export const layout = {
  // margem lateral de tudo que fica "solto" na tela: cabeçalho, cartões, faixas
  margemH: 16,
  // margem lateral das telas de FLUXO (recordatório, EBIA, passos da trilha):
  // telas cheias, sem barra de abas
  margemFluxoH: 24,
  // distância do botão principal até a borda de baixo nessas telas
  // (a mesma do botão CONTINUAR do recordatório)
  rodapeBotaoMargemInferior: 70,
  // cabeçalho de aba (título ou saudação + estatísticas)
  cabecalhoPaddingTop: 12,
  cabecalhoPaddingBottom: 16,
  // espaço vertical entre cartões/blocos empilhados
  gapEntreBlocos: 12,
} as const;
