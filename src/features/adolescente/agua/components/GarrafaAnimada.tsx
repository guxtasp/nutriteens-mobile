// src/features/adolescente/components/GarrafaAnimada.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../../../shared/theme/colors';

type Props = { progresso: number }; // 0 a 1

const LARGURA = 150;
const ALTURA = 320;

export default function GarrafaAnimada({ progresso }: Props) {
  const alturaAgua = useRef(new Animated.Value(progresso)).current;
  const bolha1 = useRef(new Animated.Value(0)).current;
  const bolha2 = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(alturaAgua, { toValue: progresso, friction: 7, tension: 40, useNativeDriver: false }).start();

    Animated.sequence([
      Animated.timing(bounce, { toValue: 1.06, duration: 150, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [progresso]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    function animarBolha(valorAnim: Animated.Value, atraso: number) {
      Animated.loop(
        Animated.sequence([
          Animated.delay(atraso),
          Animated.timing(valorAnim, { toValue: 1, duration: 2600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(valorAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    }
    animarBolha(bolha1, 0);
    animarBolha(bolha2, 1300);
  }, []);

  const alturaInterpolada = alturaAgua.interpolate({ inputRange: [0, 1], outputRange: ['4%', '92%'] });
  const shimmerTranslate = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-6, 6] });

  return (
    <Animated.View style={{ transform: [{ scale: bounce }] }}>
      <View style={styles.tampaSuporte}>
        <View style={styles.tampa} />
      </View>
      <View style={styles.corpo}>
        <Animated.View style={[styles.agua, { height: alturaInterpolada }]}>
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
    width: LARGURA, height: ALTURA, borderRadius: 32, backgroundColor: '#DCEFC4',
    overflow: 'hidden', justifyContent: 'flex-end', borderWidth: 3, borderColor: '#8BC34A',
  },
  agua: { width: '100%', backgroundColor: '#4A9DF5', position: 'relative', overflow: 'hidden' },
  brilhoAgua: {
    position: 'absolute', top: 0, left: -10, right: -10, height: 14,
    backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 8,
  },
  bolha: { position: 'absolute', bottom: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  bolhaEsquerda: { left: '30%' },
  bolhaDireita: { left: '60%' },
});