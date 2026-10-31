// src/features/adolescente/home/components/BroxisTristeAnimado.tsx
//
// Bróxis triste com o ROSTO animado por cima do PNG (assets/img/mascot/broxis-triste.png,
// 148×148 px). Como a arte é uma imagem única, os efeitos são camadas desenhadas
// com Views sobre os olhos, nas coordenadas da arte original (convertidas pela escala):
//   - olhos marejados: um brilho que pulsa em cada olho
//   - piscadas: pálpebras na cor da pele que descem e voltam (pisca duas vezes, espera, repete)
//   - lágrimas: uma gota por olho que escorre pela bochecha, alternadas
// Tudo com driver nativo, só opacidade/escala/translação. Se a arte for trocada por uma
// com outro enquadramento, ajuste as constantes de posição abaixo.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

const ARTE = 148; // lado do PNG original, em px
const PELE = '#FFD65C'; // amarelo da pele/fundo ao redor dos olhos
const TRACO = '#2F3340'; // cor dos olhos/pálpebra fechada
const LAGRIMA = '#7EC8F5';

// posições na arte original (px)
const OLHOS = [
  { cx: 62.5, cy: 96.5 }, // esquerdo
  { cx: 82.5, cy: 96.5 }, // direito
];
const OLHO_L = 16; // caixa da pálpebra (cobre o olho com folga)
const OLHO_A = 14;

type Props = { tamanho: number; ativo: boolean };

export function BroxisTristeAnimado({ tamanho, ativo }: Props) {
  const k = tamanho / ARTE;
  const piscar = useRef(new Animated.Value(0)).current; // 0 aberto -> 1 fechado
  const brilho = useRef(new Animated.Value(0)).current;
  const lagrimaE = useRef(new Animated.Value(0)).current;
  const lagrimaD = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ativo) return;
    piscar.setValue(0);
    brilho.setValue(0);
    lagrimaE.setValue(0);
    lagrimaD.setValue(0);

    const fechar = () => Animated.timing(piscar, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true });
    const abrir = () => Animated.timing(piscar, { toValue: 0, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true });

    const loops = [
      // pisca duas vezes seguidas, descansa, repete
      Animated.loop(
        Animated.sequence([
          Animated.delay(1800),
          fechar(), Animated.delay(40), abrir(),
          Animated.delay(260),
          fechar(), Animated.delay(40), abrir(),
          Animated.delay(2400),
        ])
      ),
      // olhos marejados: o brilho respira
      Animated.loop(
        Animated.sequence([
          Animated.timing(brilho, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(brilho, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ),
      // lágrimas alternadas
      Animated.loop(Animated.timing(lagrimaE, { toValue: 1, duration: 1900, delay: 400, easing: Easing.in(Easing.quad), useNativeDriver: true })),
      Animated.loop(Animated.timing(lagrimaD, { toValue: 1, duration: 1900, delay: 1350, easing: Easing.in(Easing.quad), useNativeDriver: true })),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [ativo, piscar, brilho, lagrimaE, lagrimaD]);

  const lagrima = (valor: Animated.Value, x: number) => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.lagrima,
        {
          left: (x - 3.5) * k,
          top: 101 * k,
          width: 7 * k,
          height: 7 * k,
          borderRadius: 3.5 * k,
          borderTopRightRadius: 0,
          opacity: valor.interpolate({ inputRange: [0, 0.12, 0.8, 1], outputRange: [0, 1, 0.9, 0] }),
          transform: [
            { translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [0, 24 * k] }) },
            { scale: valor.interpolate({ inputRange: [0, 0.2], outputRange: [0.2, 1], extrapolate: 'clamp' }) },
            { rotate: '-45deg' },
          ],
        },
      ]}
    />
  );

  return (
    <View style={{ width: tamanho, height: tamanho }}>
      <Image
        source={require('../../../../../assets/img/mascot/broxis-triste.png')}
        style={{ width: tamanho, height: tamanho }}
        resizeMode="contain"
        accessibilityLabel="Bróxis triste"
      />

      {ativo &&
        OLHOS.map((o, i) => (
          <React.Fragment key={i}>
            {/* brilho de olho marejado */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.brilho,
                {
                  left: (o.cx - 5.5) * k,
                  top: (o.cy - 2) * k,
                  width: 3 * k,
                  height: 3 * k,
                  borderRadius: 1.5 * k,
                  opacity: brilho.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                  transform: [{ scale: brilho.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }],
                },
              ]}
            />
            {/* pálpebra: desce do topo do olho */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (o.cx - OLHO_L / 2) * k,
                top: (o.cy - OLHO_A / 2) * k,
                width: OLHO_L * k,
                height: OLHO_A * k,
                borderRadius: 4 * k,
                backgroundColor: PELE,
                opacity: piscar.interpolate({ inputRange: [0, 0.05], outputRange: [0, 1], extrapolate: 'clamp' }),
                transform: [
                  { translateY: piscar.interpolate({ inputRange: [0, 1], outputRange: [(-OLHO_A / 2) * k, 0] }) },
                  { scaleY: piscar.interpolate({ inputRange: [0, 1], outputRange: [0.01, 1] }) },
                ],
              }}
            />
            {/* traço do olho fechado */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: (o.cx - 6) * k,
                top: (o.cy + 2.5) * k,
                width: 12 * k,
                height: 2.2 * k,
                borderRadius: 1.1 * k,
                backgroundColor: TRACO,
                opacity: piscar.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
              }}
            />
          </React.Fragment>
        ))}

      {ativo && lagrima(lagrimaE, OLHOS[0].cx - 1.5)}
      {ativo && lagrima(lagrimaD, OLHOS[1].cx + 1.5)}
    </View>
  );
}

const styles = StyleSheet.create({
  brilho: { position: 'absolute', backgroundColor: '#FFFFFF' },
  lagrima: { position: 'absolute', backgroundColor: LAGRIMA },
});
