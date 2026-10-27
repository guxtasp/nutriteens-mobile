// src/features/adolescente/metricas/utils/abas.ts
//
// Abas de "Minha jornada": dividem os cartões em grupos curtos, para a tela não virar
// uma rolagem longa. O visual (cor e ícone) de cada aba reaproveita o de um cartão.
import type { CartaoId } from './cartoesInfo';

export type AbaId = 'resumo' | 'comida' | 'habitos' | 'conquistas';

export const ABAS: { id: AbaId; rotulo: string; /** cartão cujo ícone e cor a aba usa */ cartao: CartaoId }[] = [
  { id: 'resumo', rotulo: 'Resumo', cartao: 'resumo' },
  { id: 'comida', rotulo: 'Comida', cartao: 'alimentacao' },
  { id: 'habitos', rotulo: 'Hábitos', cartao: 'agua' },
  { id: 'conquistas', rotulo: 'Conquistas', cartao: 'conquistas' },
];

export const ABA_INICIAL: AbaId = 'resumo';
