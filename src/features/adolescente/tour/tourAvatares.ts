// src/features/adolescente/tour/tourAvatares.ts
//
// Expressão do Bróxis -> imagem. Fica separado do roteiro para o roteiro continuar testável
// sem carregar imagens.
import type { ImageSourcePropType } from 'react-native';
import type { ExpressaoBroxis } from './tourPassos';

export const AVATARES_TOUR: Record<ExpressaoBroxis, ImageSourcePropType> = {
  acolhedor: require('../../../../assets/img/feedback/acolhedor.png'),
  aceno: require('../../../../assets/img/mascot/broxis-aceno.png'),
  apresentando: require('../../../../assets/img/mascot/broxis-apresentando.png'),
  curioso: require('../../../../assets/img/feedback/curioso.png'),
  orgulhoso: require('../../../../assets/img/feedback/orgulhoso.png'),
  incentivando: require('../../../../assets/img/feedback/incentivando.png'),
  energizado: require('../../../../assets/img/feedback/energizado.png'),
  comemorando: require('../../../../assets/img/feedback/comemorando.png'),
  supercontente: require('../../../../assets/img/feedback/supercontente.png'),
  surpreso: require('../../../../assets/img/feedback/surpreso-positivamente.png'),
  pensando: require('../../../../assets/img/mascot/broxis-pensando.png'),
  radiante: require('../../../../assets/img/mascot/broxis-radiante.png'),
  'bebendo-agua': require('../../../../assets/img/feedback/bebendo-agua.png'),
  'com-fome': require('../../../../assets/img/feedback/com-fome.png'),
  calmo: require('../../../../assets/img/feedback/calmo.png'),
};

/** só o "acolhedor" é um rosto já enquadrado; os demais são o corpo e precisam de `contain` */
export function modoImagem(expressao: ExpressaoBroxis): 'cover' | 'contain' {
  return expressao === 'acolhedor' ? 'cover' : 'contain';
}
