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
      {/* balanço bem leve (só sobe e desce, sem pulsar o tamanho). A medalha do Super Broxis
          fica DENTRO do mesmo MotiView: antes ela era fixa e o mascote se mexia por baixo,
          então os dois "escorregavam" um em relação ao outro. */}
      <MotiView
        key={fase}
        from={{ translateY: 0 }}
        animate={{ translateY: -4 }}
        transition={{ type: 'timing', duration: fase === 'filhote' ? 1100 : 1700, loop: true, repeatReverse: true }}
        style={styles.conjunto}
      >
        <Image source={ARTE[fase]} style={{ width: lado, height: lado }} resizeMode="contain" />
        {fase === 'adulto' && (
          <View pointerEvents="none" style={styles.coroaWrap}>
            <Ionicons name="ribbon" size={size * 0.2} color={colors.warning} />
          </View>
        )}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  palco: { alignItems: 'center', justifyContent: 'center' },
  aura: { position: 'absolute', backgroundColor: '#E2F3D3' },
  conjunto: { alignItems: 'center', justifyContent: 'center' },
  // a medalha acompanha o mascote; zIndex/elevation para ficar por cima da imagem
  coroaWrap: { position: 'absolute', top: -2, alignSelf: 'center', zIndex: 10, elevation: 10 },
});
