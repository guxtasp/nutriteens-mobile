// Tokens visuais do módulo de vitaminas (derivados do tema do app; nada de cor solta nas telas).
import { colors } from '../../../../shared/theme/colors';

export const vit = {
  textoSuave: '#5A6B63',      // texto secundário (contraste ~5,6:1 no branco; o antigo #7A8B94 ficava ~3,5:1)
  borda: '#D9E2E8',
  fundoSuave: '#F0F5F1',
  fundoDestaque: '#E2F3D3',
  destaque: colors.primary,
  texto: colors.primaryDark,
} as const;
