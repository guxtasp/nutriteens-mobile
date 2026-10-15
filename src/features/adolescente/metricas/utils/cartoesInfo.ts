// src/features/adolescente/metricas/utils/cartoesInfo.ts
//
// "O que está sendo mostrado": título e descrição fixos de cada cartão.
// A interpretação (o que os dados significam) vem do feedback do Broxis.
export type CartaoId = 'resumo' | 'alimentacao' | 'diversidade' | 'agua' | 'atividade' | 'engajamento' | 'conquistas';

export const CARTOES_INFO: Record<CartaoId, { titulo: string; oQueMostra: string }> = {
  resumo: { titulo: 'Seu período em resumo', oQueMostra: 'Dias em que você registrou algo (refeição, água ou atividade) ou concluiu uma lição.' },
  alimentacao: { titulo: 'Registros de refeições', oQueMostra: 'Em quantos dias você registrou o que comeu e quantas refeições foram.' },
  diversidade: { titulo: 'Variedade no prato', oQueMostra: 'Quantos alimentos e grupos alimentares diferentes apareceram nas refeições que você registrou.' },
  agua: { titulo: 'Água', oQueMostra: 'Dias em que você registrou água e, quando há meta, em quantos dias chegou nela.' },
  atividade: { titulo: 'Atividade física', oQueMostra: 'Dias em que você registrou atividades e o total de minutos.' },
  engajamento: { titulo: 'Missões e trilha', oQueMostra: 'Missões do dia concluídas e lições da trilha que você terminou.' },
  conquistas: { titulo: 'Conquistas', oQueMostra: 'Insígnias e cartas que você ganhou.' },
};
