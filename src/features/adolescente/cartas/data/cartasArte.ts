import type { ImageSourcePropType } from 'react-native';

/**
 * ARTE DAS CARTAS DOS 10 PASSOS.
 *
 * A arte vive aqui (no app), indexada por `cartas_guia.codigo`, e NÃO no banco:
 * nenhuma tela de admin consegue trocá-la (mesmo padrão de insigniasArte.ts).
 *
 * Cada PNG de arte já é a carta COMPLETA (moldura, número do passo e título), então
 * o app mostra a imagem pura, sem desenhar outra moldura ou título por cima.
 *
 * Cada carta tem duas versões em WebP, geradas por `scripts/otimizar-cartas.py` a
 * partir dos originais em `assets-fonte/cartas/` (que não vão no bundle):
 *  - `mini`  (360 px de largura): grade do álbum, carrega na hora;
 *  - `cheia` (720 px de largura): modal de detalhe e celebração.
 *
 * Arte nova: troque o PNG em assets-fonte/cartas/ e rode o script. Carta sem arte
 * cadastrada cai no placeholder (emoji + cor) em <CartaArte />.
 */
export type ArteCarta = { cheia: ImageSourcePropType; mini: ImageSourcePropType };

/** largura / altura da carta (todas as artes são normalizadas para essa proporção). */
export const PROPORCAO_CARTA = 0.6793;

/** Altura de uma carta que tem a largura dada. */
export function alturaDaCarta(largura: number): number {
  return Math.round(largura / PROPORCAO_CARTA);
}

export const ARTE_CARTAS: Record<string, ArteCarta | null> = {
  passo_01_comida_de_verdade: {
    cheia: require('../../../../../assets/img/cartas/passo_01_comida_de_verdade.webp'),
    mini: require('../../../../../assets/img/cartas/passo_01_comida_de_verdade_mini.webp'),
  },
  passo_02_tempero_na_medida: {
    cheia: require('../../../../../assets/img/cartas/passo_02_tempero_na_medida.webp'),
    mini: require('../../../../../assets/img/cartas/passo_02_tempero_na_medida_mini.webp'),
  },
  passo_03_calma_nos_processados: {
    cheia: require('../../../../../assets/img/cartas/passo_03_calma_nos_processados.webp'),
    mini: require('../../../../../assets/img/cartas/passo_03_calma_nos_processados_mini.webp'),
  },
  passo_04_fora_ultraprocessados: {
    cheia: require('../../../../../assets/img/cartas/passo_04_fora_ultraprocessados.webp'),
    mini: require('../../../../../assets/img/cartas/passo_04_fora_ultraprocessados_mini.webp'),
  },
  passo_05_com_calma_e_companhia: {
    cheia: require('../../../../../assets/img/cartas/passo_05_com_calma_e_companhia.webp'),
    mini: require('../../../../../assets/img/cartas/passo_05_com_calma_e_companhia_mini.webp'),
  },
  passo_06_compras_com_variedade: {
    cheia: require('../../../../../assets/img/cartas/passo_06_compras_com_variedade.webp'),
    mini: require('../../../../../assets/img/cartas/passo_06_compras_com_variedade_mini.webp'),
  },
  passo_07_mao_na_massa: {
    cheia: require('../../../../../assets/img/cartas/passo_07_mao_na_massa.webp'),
    mini: require('../../../../../assets/img/cartas/passo_07_mao_na_massa_mini.webp'),
  },
  passo_08_tempo_para_comer_bem: {
    cheia: require('../../../../../assets/img/cartas/passo_08_tempo_para_comer_bem.webp'),
    mini: require('../../../../../assets/img/cartas/passo_08_tempo_para_comer_bem_mini.webp'),
  },
  passo_09_fora_de_casa: {
    cheia: require('../../../../../assets/img/cartas/passo_09_fora_de_casa.webp'),
    mini: require('../../../../../assets/img/cartas/passo_09_fora_de_casa_mini.webp'),
  },
  passo_10_olho_na_propaganda: {
    cheia: require('../../../../../assets/img/cartas/passo_10_olho_na_propaganda.webp'),
    mini: require('../../../../../assets/img/cartas/passo_10_olho_na_propaganda_mini.webp'),
  },
};

/** Emoji exibido dentro do placeholder, só para dar identidade temporária. */
export const EMOJI_CARTA: Record<string, string> = {
  passo_01_comida_de_verdade: '🥦',
  passo_02_tempero_na_medida: '🧂',
  passo_03_calma_nos_processados: '🧀',
  passo_04_fora_ultraprocessados: '🚫',
  passo_05_com_calma_e_companhia: '🧑‍🤝‍🧑',
  passo_06_compras_com_variedade: '🛒',
  passo_07_mao_na_massa: '🍳',
  passo_08_tempo_para_comer_bem: '⏰',
  passo_09_fora_de_casa: '🍽️',
  passo_10_olho_na_propaganda: '🔍',
};

export const EMOJI_PADRAO = '🍽️';

export function emojiDaCarta(codigo: string): string {
  return EMOJI_CARTA[codigo] ?? EMOJI_PADRAO;
}

/** Cores do placeholder (fundo suave + contorno), repetidas em ciclo pelos passos. */
/** Cores das cartas — alinhadas à identidade visual das artes finais. */
export const PALETA_CARTAS: { fundo: string; borda: string }[] = [
  // 01 — Comida de Verdade
  {
    fundo: '#E5F4D8',
    borda: '#69B84F',
  },

  // 02 — Tempero na Medida
  {
    fundo: '#FFF1C2',
    borda: '#E5A51A',
  },

  // 03 — Calma nos Ultraprocessados
  {
    fundo: '#FFF0B5',
    borda: '#E5A20A',
  },

  // 04 — Ultraprocessados? Fora!
  {
    fundo: '#FBE0DC',
    borda: '#E8665B',
  },

  // 05 — Com Calma e Companhia
  // provisória — aguardando arte final
  {
    fundo: '#EDE4F8',
    borda: '#9A78C7',
  },

  // 06 — Compras com Variedade
  {
    fundo: '#D9F3EE',
    borda: '#25B7A5',
  },

  // 07 — Mão na Massa
  // provisória — aguardando arte final
  {
    fundo: '#FFE5D2',
    borda: '#ED8A45',
  },

  // 08 — Tempo para Comer Bem
  {
    fundo: '#D8F1EC',
    borda: '#168D87',
  },

  // 09 — Fora de Casa, Comida na Hora
  {
    fundo: '#FFE0CC',
    borda: '#F07835',
  },

  // 10 — De Olho na Propaganda
  {
    fundo: '#DCE7FA',
    borda: '#2859A6',
  },
];

export function corDoPasso(passo: number): { fundo: string; borda: string } {
  return PALETA_CARTAS[(Math.max(passo, 1) - 1) % PALETA_CARTAS.length];
}
