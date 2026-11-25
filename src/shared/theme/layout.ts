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

  // ---- área segura e partes fixas (ver docs/AUDITORIA_LAYOUT.md) ----
  // O app é edge-to-edge no Android: a tela vai por baixo da barra de status e da barra de
  // navegação (3 botões ≈ 48 dp, gestos ≈ 16–24 dp). Nada de número solto para "compensar" a
  // barra: o espaço vem sempre de useSafeAreaInsets() somado a estes respiros.
  // ScreenHeader: altura mínima da linha (voltar 48 + respiro), sem contar o recuo de cima
  cabecalhoAlturaMin: 64,
  cabecalhoTelaPaddingTop: 20,
  cabecalhoTelaPaddingBottom: 12,
  cabecalhoTelaPaddingH: 20,
  // menor fração da fonte que o título do cabeçalho pode encolher para caber (fonte grande)
  cabecalhoTituloEscalaMin: 0.8,
  // alvo de toque mínimo (acessibilidade)
  alvoToqueMin: 44,
  // espaço entre o último elemento e a barra do sistema (quando há barra)
  respiroAcimaDaBarra: 16,
  // RodapeAcoes: espaço mínimo embaixo quando o aparelho não tem barra (iPhone SE, Android sem inset)
  rodapeEspacoMin: 16,
  rodapePaddingTop: 12,
  // espaço extra no fim de uma lista rolável, para o último item não encostar no que vem depois
  folgaFinalRolagem: 24,
  // folhas (bottom sheets): respiro de baixo quando não há barra do sistema
  folhaPaddingInferior: 24,
} as const;
