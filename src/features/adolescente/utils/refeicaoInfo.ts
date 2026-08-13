// src/features/adolescente/utils/refeicaoInfo.ts
import { Ionicons } from '@expo/vector-icons';
import type { TipoRefeicao } from '../services/alimentacaoService';

export const ICONE_POR_TIPO_REFEICAO: Record<TipoRefeicao, keyof typeof Ionicons.glyphMap> = {
  CAFE_DA_MANHA: 'cafe',
  LANCHE_MANHA: 'nutrition',
  ALMOCO: 'restaurant',
  LANCHE_TARDE: 'ice-cream',
  JANTAR: 'moon',
  CEIA: 'bed',
};