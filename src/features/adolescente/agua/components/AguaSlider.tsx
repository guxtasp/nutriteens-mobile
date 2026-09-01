// src/features/adolescente/components/AguaSlider.tsx
import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  min?: number;
  max?: number;
  step?: number;
  valor: number;
  onChange: (valor: number) => void;
};

const ITEM_WIDTH = 90;

export default function AguaSlider({ min = 0, max = 1000, step = 100, valor, onChange }: Props) {
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const jaCentralizou = useRef(false);

  // largura real do container (não da tela inteira) — o slider fica dentro
  // de um bloco com paddingHorizontal, então precisa medir o espaço de fato
  // disponível pra centralizar certo, em vez de assumir Dimensions.get('window')
  const [larguraContainer, setLarguraContainer] = useState(0);

  const valores: number[] = [];
  for (let v = min; v <= max; v += step) valores.push(v);

  function onLayoutWrapper(e: LayoutChangeEvent) {
    setLarguraContainer(e.nativeEvent.layout.width);
  }

  const paddingLateral = larguraContainer > 0 ? larguraContainer / 2 - ITEM_WIDTH / 2 : 0;

  useEffect(() => {
    if (jaCentralizou.current || larguraContainer === 0) return;
    const indice = valores.indexOf(valor);
    if (indice >= 0) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo?.({ x: indice * ITEM_WIDTH, animated: false });
      });
      jaCentralizou.current = true;
    }
  }, [larguraContainer]);

  function aoSoltarScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = e.nativeEvent.contentOffset.x;
    const indice = Math.round(offsetX / ITEM_WIDTH);
    const indiceClamp = Math.max(0, Math.min(valores.length - 1, indice));
    onChange(valores[indiceClamp]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.reguaWrapper} onLayout={onLayoutWrapper}>
        {larguraContainer > 0 && (
          <View
            pointerEvents="none"
            style={[styles.linhaCentral, { left: larguraContainer / 2 - 1 }]}
          />
        )}

        {larguraContainer > 0 && (
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={{ paddingHorizontal: paddingLateral }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            onMomentumScrollEnd={aoSoltarScroll}
          >
            {valores.map((v, indice) => {
              const inputRange = [
                (indice - 2) * ITEM_WIDTH,
                (indice - 1) * ITEM_WIDTH,
                indice * ITEM_WIDTH,
                (indice + 1) * ITEM_WIDTH,
                (indice + 2) * ITEM_WIDTH,
              ];
              const escala = scrollX.interpolate({
                inputRange,
                outputRange: [0.65, 0.85, 1.3, 0.85, 0.65],
                extrapolate: 'clamp',
              });
              const opacidade = scrollX.interpolate({
                inputRange,
                outputRange: [0.12, 0.4, 1, 0.4, 0.12],
                extrapolate: 'clamp',
              });

              return (
                <View key={v} style={styles.item} collapsable={false}>
                  <Animated.Text
                    style={[
                      styles.numero,
                      { transform: [{ scale: escala }], opacity: opacidade },
                    ]}
                  >
                    {v}
                  </Animated.Text>
                </View>
              );
            })}
          </Animated.ScrollView>
        )}
      </View>

      <AppText style={styles.rotuloMl}>ml</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginBottom: 12 },
  reguaWrapper: { width: '100%', height: 56, justifyContent: 'center' },
  linhaCentral: {
    position: 'absolute',
    top: 8,
    width: 1.5,
    height: 40,
    backgroundColor: '#D9E2E8',
  },
  item: { width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' },
  numero: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark },
  rotuloMl: { fontFamily: typography.regular, fontSize: 12, color: '#9AA5A0', marginTop: 2 },
});