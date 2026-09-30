// src/features/adolescente/trilha/components/exercicios/BarraProgresso.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../../../../shared/theme/colors';

type Props = {
  atual: number; // 1-based (questão 2 de 5 → atual=2)
  total: number;
};

/** Barra de progresso da sequência de exercícios dentro de uma lição de quiz. */
export default function BarraProgresso({ atual, total }: Props) {
  const proporcao = total > 0 ? Math.min(1, atual / total) : 0;
  return (
    <View style={styles.trilho}>
      <View style={[styles.preenchido, { width: `${proporcao * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  trilho: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E2E8DD',
    overflow: 'hidden',
  },
  preenchido: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: colors.primaryDark,
  },
});
