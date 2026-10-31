// src/features/adolescente/social/theme/turma.ts
//
// Identidade visual da aba Turma (rebranding do Social). Um só lugar para cores, raios e a "cor de cada tipo
// de novidade", para o Feed, a Faixa da turma, o Jardim e a Chama em Dupla parecerem uma família.
// Regra do app mantida: sem vermelho em nada que avalie o adolescente.
import { colors } from '../../../../shared/theme/colors';
import type { TipoEventoFeed } from '../utils/feed';

export const turma = {
  fundo: '#F6F9F5',
  cartao: colors.white,
  borda: '#E4EAE6',
  raioCartao: 22,
  raioPilula: 999,
  heroDe: '#155946',
  heroPara: '#2C8A63',
  textoSuave: '#5A6B64',
  textoMudo: '#7A8B94',
  chama: '#FF8A1F',
  chamaFundo: '#FFF1DC',
  agua: '#4AA3F0',
} as const;

/** Cor de cada atividade da Turma: o cartão de entrada, a tela e o selo usam a mesma, para virarem uma família. */
export const ATIVIDADE = {
  desafio: { cor: '#7A5BD6', fundo: '#F1ECFD' },
  jardim: { cor: '#3E8E2F', fundo: '#E3F2D3' },
  cartinha: { cor: '#D6568A', fundo: '#FCE6EF' },
  juntos: { cor: '#D9731A', fundo: '#FFE9D2' },
  chama: { cor: '#FF8A1F', fundo: '#FFF1DC' },
} as const;

/** Degraus do pódio. `relevo` é a borda de baixo (mesma linguagem dos botões do app). */
export const MEDALHA = {
  1: { cor: '#F2B705', relevo: '#C99700', nome: 'Ouro' },
  2: { cor: '#9AA7B0', relevo: '#7D8A93', nome: 'Prata' },
  3: { cor: '#C98A4B', relevo: '#A76F37', nome: 'Bronze' },
} as const;

/** Cor do ícone e do fundo do selo de cada tipo de novidade no feed. */
export const COR_EVENTO: Record<TipoEventoFeed, { icone: string; fundo: string }> = {
  INSIGNIA: { icone: '#B07A12', fundo: '#FFF1C9' },
  LICAO: { icone: '#2F7FC4', fundo: '#DCEEFE' },
  FASE: { icone: '#7A55C9', fundo: '#EBE3FF' },
  SEQUENCIA: { icone: '#D9731A', fundo: '#FFE9D2' },
  CHAMA_DUPLA: { icone: '#D9731A', fundo: '#FFE9D2' },
  RECEITA: { icone: '#3E8E2F', fundo: '#DDF1CF' },
};

/** Sombra leve e igual em todos os cartões (iOS, Android e web). */
export const sombraCartao = {
  shadowColor: '#1B4332',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
