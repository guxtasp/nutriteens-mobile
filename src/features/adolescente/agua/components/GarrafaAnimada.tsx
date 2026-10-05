// src/features/adolescente/agua/components/GarrafaAnimada.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../../../shared/theme/colors';

type Props = { progresso: number }; // 0 a 1

const LARGURA = 150;
const ALTURA = 320;
const BORDA = 3;
const ALTURA_INTERNA = ALTURA - BORDA * 2;
// nível da água: nunca totalmente vazia nem colada na tampa
const NIVEL_MIN = 0.04;
const NIVEL_MAX = 0.92;

/**
 * Garrafa de água. A água é um bloco de altura fixa que sobe e desce com
 * `translateY` (thread nativa) em vez de animar `height` (que recalculava o
 * layout a cada frame na thread do JS e engasgava junto com os loops).
 */
export default function GarrafaAnimada({ progresso }: Props) {
  const nivel = useRef(new Animated.Value(progresso)).current;
  const bolha1 = useRef(new Animated.Value(0)).current;
  const bolha2 = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(nivel, { toValue: progresso, friction: 8, tension: 40, useNativeDriver: true }).start();

    Animated.sequence([
      Animated.timing(bounce, { toValue: 1.06, duration: 150, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [progresso, nivel, bounce]);

  useEffect(() => {
    const loopShimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );

    function criarLoopBolha(valorAnim: Animated.Value, atraso: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(atraso),
          Animated.timing(valorAnim, { toValue: 1, duration: 2600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(valorAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    }
    const loopBolha1 = criarLoopBolha(bolha1, 0);
    const loopBolha2 = criarLoopBolha(bolha2, 1300);

    loopShimmer.start();
    loopBolha1.start();
    loopBolha2.start();

    // para os loops ao sair da tela
    return () => {
      loopShimmer.stop();
      loopBolha1.stop();
      loopBolha2.stop();
    };
  }, [shimmer, bolha1, bolha2]);

  // 0 → água quase embaixo; 1 → água quase na tampa
  const aguaTranslateY = nivel.interpolate({
    inputRange: [0, 1],
    outputRange: [ALTURA_INTERNA * (1 - NIVEL_MIN), ALTURA_INTERNA * (1 - NIVEL_MAX)],
    extrapolate: 'clamp',
  });
  const shimmerTranslate = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });

  return (
    <Animated.View style={{ transform: [{ scale: bounce }] }}>
      <View style={styles.tampaSuporte}>
        <View style={styles.tampa} />
      </View>
      <View style={styles.corpo}>
        <Animated.View style={[styles.agua, { transform: [{ translateY: aguaTranslateY }] }]}>
          <Animated.View style={[styles.brilhoAgua, { transform: [{ translateX: shimmerTranslate }] }]} />
          <Animated.View
            style={[
              styles.bolha,
              styles.bolhaEsquerda,
              {
                opacity: bolha1.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 0.8, 0] }),
                transform: [{ translateY: bolha1.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }) }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bolha,
              styles.bolhaDireita,
              {
                opacity: bolha2.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0, 0.7, 0] }),
                transform: [{ translateY: bolha2.interpolate({ inputRange: [0, 1], outputRange: [0, -160] }) }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tampaSuporte: { alignItems: 'center' },
  tampa: { width: 52, height: 30, borderRadius: 8, backgroundColor: colors.primaryDark, marginBottom: -4, zIndex: 2 },
  corpo: {
    width: LARGURA,
    height: ALTURA,
    borderRadius: 32,
    backgroundColor: '#DCEFC4',
    overflow: 'hidden',
    borderWidth: BORDA,
    borderColor: '#8BC34A',
  },
  // bloco de altura fixa, colado embaixo; o nível é só o deslocamento vertical
  agua: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: ALTURA_INTERNA,
    backgroundColor: '#4A9DF5',
    overflow: 'hidden',
  },
  brilhoAgua: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 8,
  },
  bolha: { position: 'absolute', bottom: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  bolhaEsquerda: { left: '30%' },
  bolhaDireita: { left: '60%' },
});