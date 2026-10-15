// src/features/adolescente/metricas/ui/tokens.ts
//
// Cores do módulo. Parte do tema existente; as variações de matiz por categoria são
// locais a este módulo para os cartões se diferenciarem de relance.
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import type { CartaoId } from '../utils/cartoesInfo';

export type IconeNome = ComponentProps<typeof Ionicons>['name'];

/** Mesmo fundo das telas secundárias (Missões). */
export const FUNDO = '#F3F8EE';
export const TRILHO = '#E7ECE8';
export const TEXTO_SUAVE = colors.trilhaChipTexto; // #4B4B4B: contraste ok sobre branco

export const ACENTOS: Record<CartaoId, { cor: string; suave: string; icone: IconeNome }> = {
  resumo: { cor: colors.primaryDark, suave: '#E2F3D3', icone: 'sparkles' },
  alimentacao: { cor: colors.primaryShadow, suave: '#E2F3D3', icone: 'restaurant' },
  diversidade: { cor: '#B83280', suave: '#FBE4F0', icone: 'leaf' },
  agua: { cor: '#1D6FD8', suave: '#DCEBFE', icone: 'water' },
  atividade: { cor: '#0F766E', suave: '#D5F3EE', icone: 'walk' },
  engajamento: { cor: '#5B4BC4', suave: '#E8E4FB', icone: 'flag' },
  conquistas: { cor: colors.warningShadow, suave: '#FDEBC8', icone: 'trophy' },
};
