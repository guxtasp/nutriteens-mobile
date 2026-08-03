import React from 'react';
import { Image, StyleSheet, View, ImageSourcePropType } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

type BroxisPose = 'aceno' | 'apresentando' | 'pensando';

interface BroxisMascotProps {
  size?: number;
  pose?: BroxisPose;
  entrance?: 'pulo' | 'fade' | 'nenhuma';
  showParticles?: boolean;
}

// Troque pelos PNGs reais quando estiverem exportados em assets/mascot/.
// Mantendo um source por pose facilita trocar a arte sem mexer na animação.
const BROXIS_SOURCES: Record<BroxisPose, ImageSourcePropType> = {
  aceno: require('../../../assets/img/mascot/broxis-aceno.png'),
  apresentando: require('../../../assets/img/mascot/broxis-apresentando.png'),
  pensando: require('../../../assets/img/mascot/broxis-pensando.png'),
};

// Partícula decorativa simples (bolinha) usada para dar sensação de leveza
// ao redor do personagem quando ele entra em cena.
function Particle({ delay, left, top, size }: { delay: number; left: number; top: number; size: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], translateY: -30, scale: 1 }}
      transition={{ type: 'timing', duration: 1800, delay, loop: true, easing: Easing.out(Easing.ease) }}
      style={[
        styles.particle,
        { left, top, width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );
}

export function BroxisMascot({
  size = 240,
  pose = 'aceno',
  entrance = 'pulo',
  showParticles = true,
}: BroxisMascotProps) {
  const entranceAnimation =
    entrance === 'pulo'
      ? {
          from: { opacity: 0, translateY: 60, scale: 0.7 },
          animate: { opacity: 1, translateY: 0, scale: 1 },
          transition: { type: 'spring' as const, damping: 9, stiffness: 120, mass: 0.9 },
        }
      : entrance === 'fade'
      ? {
          from: { opacity: 0, translateY: 12 },
          animate: { opacity: 1, translateY: 0 },
          transition: { type: 'timing' as const, duration: 400 },
        }
      : { from: {}, animate: {}, transition: {} };

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {showParticles && (
        <>
          <Particle delay={0} left={size * 0.1} top={size * 0.15} size={8} />
          <Particle delay={400} left={size * 0.75} top={size * 0.05} size={6} />
          <Particle delay={800} left={size * 0.85} top={size * 0.6} size={10} />
        </>
      )}
      <MotiView {...entranceAnimation} style={styles.imageWrapper}>
        <Image
          source={BROXIS_SOURCES[pose]}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#8FD14F',
  },
});