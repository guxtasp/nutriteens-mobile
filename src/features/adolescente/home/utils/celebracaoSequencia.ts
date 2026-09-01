// src/features/adolescente/home/utils/celebracaoSequencia.ts
//
// Conteúdo dinâmico da tela de celebração de sequência. O headline (número +
// rótulo "dia/dias de sequência") é fixo e calculado no próprio componente —
// aqui só o que varia com o número: elogio, desafio, texto do botão e o XP
// de marco (se o dia de hoje bater um marco).
export type ConteudoCelebracao = {
  elogio: string;
  desafio: string;
  textoBotao: string;
  xpGanho: number;
};

// Marcos de sequência que concedem XP bônus. O dia 1 fica de fora de
// propósito — é só o pontapé inicial (bate com a imagem sem badge que você
// mandou), não um marco de verdade.
const MARCOS_XP: Record<number, number> = {
  3: 5,
  7: 10,
  14: 20,
  30: 50,
  60: 100,
  100: 200,
};

export function obterConteudoCelebracao(sequenciaAtual: number): ConteudoCelebracao {
  const xpGanho = MARCOS_XP[sequenciaAtual] ?? 0;

  if (sequenciaAtual === 1) {
    return {
      elogio: 'Primeiro dia registrado!',
      desafio: 'Volte amanhã pra manter o foguinho aceso e começar sua sequência.',
      textoBotao: 'Vamos lá!',
      xpGanho,
    };
  }

  if (xpGanho > 0) {
    return {
      elogio: `Uau, ${sequenciaAtual} dias seguidos!`,
      desafio: 'Você alcançou um marco da sequência. Continue assim!',
      textoBotao: 'Continuar',
      xpGanho,
    };
  }

  return {
    elogio: 'Sequência mantida!',
    desafio: 'Continue registrando todos os dias pra fazer o foguinho crescer.',
    textoBotao: 'Continuar',
    xpGanho,
  };
}
