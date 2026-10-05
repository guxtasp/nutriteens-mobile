// src/features/adolescente/trilha/components/exercicios/BarraProgresso.tsx
import React, { useState } from 'react';
import { LayoutChangeEvent, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../../../../shared/theme/colors';

type Props = {
  atual: number; // 1-based (questão 2 de 5 → atual=2)
  total: number;
};

/**
 * Barra de progresso da sequência de exercícios dentro de uma lição.
 * O preenchimento cresce com animação suave a cada passo (mede a largura
 * do trilho e anima em pixels).
 */
export default function BarraProgresso({ atual, total }: Props) {
  const [larguraTrilho, setLarguraTrilho] = useState(0);
  const proporcao = total > 0 ? Math.min(1, atual / total) : 0;

  function handleLayout(e: LayoutChangeEvent) {
    setLarguraTrilho(e.nativeEvent.layout.width);
  }

  return (
    <View style={styles.trilho} onLayout={handleLayout}>
      <MotiView
        animate={{ width: larguraTrilho * proporcao }}
        transition={{ type: 'timing', duration: 450 }}
        style={styles.preenchido}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  trilho: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    overflow: 'hidden',
  },
  preenchido: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: colors.primaryDark,
  },
});