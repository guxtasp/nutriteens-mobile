import type { ImageSourcePropType } from 'react-native';

/**
 * ARTE EXCLUSIVA DAS INSÍGNIAS — PLACEHOLDERS.
 *
 * Só insígnias têm arte própria; conquistas e marcos usam o componente padrão.
 * A arte vive aqui (no app), indexada por `insignias.codigo`, e NÃO no banco:
 * nenhuma tela de admin consegue alterá-la. Enquanto o design não entrega o PNG,
 * a chave fica `null` e o app mostra o placeholder (<InsigniaPlaceholder />).
 *
 * Quando a arte chegar: salve em assets/img/insignias/<codigo>.png e troque
 * `null` por `require('../../../../../assets/img/insignias/<codigo>.png')`.
 */
export const ARTE_INSIGNIAS: Record<string, ImageSourcePropType | null> = {
  explorador_alimentos: null, // 🥦
  mestre_movimento: null, // 🏃/🏆
  super_broxis: null, // ⭐
};

/** Emoji exibido dentro do placeholder, só para dar identidade temporária. */
export const EMOJI_PLACEHOLDER: Record<string, string> = {
  explorador_alimentos: '🥦',
  mestre_movimento: '🏆',
  super_broxis: '⭐',
};
