// src/features/adolescente/perfil/data/broxisFasesArte.ts
//
// Arte e textos de cada fase do Broxis, num lugar só: o perfil (BroxisEvolucao) e a
// celebração de evolução (EvolucaoBroxisModal) usam os mesmos PNGs.
// As imagens são de corpo inteiro, com fundo transparente e o mesmo enquadramento
// (quadradas, personagem apoiado na base), por isso podem trocar uma pela outra sem pular.
import type { ImageSourcePropType } from 'react-native';
import type { FaseId } from '../utils/fasesMascote';

export const ARTE_FASE: Record<FaseId, ImageSourcePropType> = {
  filhote: require('../../../../../assets/img/mascot/broxis-filhote.png'),
  jovem: require('../../../../../assets/img/mascot/broxis-jovem.png'),
  adulto: require('../../../../../assets/img/mascot/broxis-adulto.png'),
};

/** Frase curta da tela de evolução (sem conteúdo nutricional: fala do progresso, não de comida). */
export const FRASE_EVOLUCAO: Record<FaseId, string> = {
  filhote: 'O Broxinho chegou! Ele vai crescer junto com você.',
  jovem: 'Seu Broxinho cresceu e já vestiu o jaleco!',
  adulto: 'Capa, estrela no peito e muita energia. Mandou bem!',
};
