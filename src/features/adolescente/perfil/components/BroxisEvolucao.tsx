import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import type { FaseId } from '../utils/fasesMascote';

// TODO(arte): trocar por PNGs próprios de cada fase (ex.: assets/img/mascot/broxis-filhote.png).
// Enquanto não existem, reaproveita as poses atuais com tamanho/acessórios diferentes.
const ARTE: Record<FaseId, ImageSourcePropType> = {
  filhote: require('../../../../../assets/img/feedback/curioso.png'),
  jovem: require('../../../../../assets/img/feedback/supercontente.png'),
  adulto: require('../../../../../assets/img/feedback/orgulhoso.png'),
};

// bebê é visivelmente menor; cresce a cada fase
const ESCALA: Record<FaseId, number> = { filhote: 0.62, jovem: 0.82, adulto: 1 };

type Props = { fase: FaseId; size?: number };

export function BroxisEvolucao({ fase, size = 190 }: Props) {
  const lado = size * ESCALA[fase];
  return (
    <View style={[styles.palco, { width: size, height: size }]}>
      <View style={[styles.aura, { width: size, height: size, borderRadius: size / 2 }]} />
      {/* respiração leve; o bebê balança mais rápido */}
      <MotiView
        key={fase}
        from={{ translateY: 0, scale: 0.9 }}
        animate={{ translateY: -6, scale: 1 }}
        transition={{ type: 'timing', duration: fase === 'filhote' ? 900 : 1400, loop: true, repeatReverse: true }}
      >
        <Image source={ARTE[fase]} style={{ width: lado, height: lado }} resizeMode="contain" />
      </MotiView>
      {/* depois da imagem na árvore + zIndex/elevation: se vier antes, o mascote
          (que anima com transform) passa por cima e a medalha some atrás dele */}
      {fase === 'adulto' && (
        <View pointerEvents="none" style={styles.coroaWrap}>
          <Ionicons name="ribbon" size={size * 0.2} color={colors.warning} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  palco: { alignItems: 'center', justifyContent: 'center' },
  aura: { position: 'absolute', backgroundColor: '#E2F3D3' },
  coroaWrap: { position: 'absolute', top: -2, alignSelf: 'center', zIndex: 10, elevation: 10 },
});
