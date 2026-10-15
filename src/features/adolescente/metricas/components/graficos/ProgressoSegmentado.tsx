// src/features/adolescente/metricas/components/graficos/ProgressoSegmentado.tsx
// Barra em segmentos (no máx. 12) para "X de Y concluídas".
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TRILHO } from '../../ui/tokens';

type Props = { total: number; feitos: number; cor: string; rotuloAcessivel: string };

export function ProgressoSegmentado({ total, feitos, cor, rotuloAcessivel }: Props) {
  if (total <= 0) return null;
  const segmentos = Math.min(total, 12);
  const cheios = Math.round((Math.min(feitos, total) / total) * segmentos);
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={rotuloAcessivel} accessibilityValue={{ min: 0, max: total, now: feitos }} style={styles.raiz}>
      {Array.from({ length: segmentos }, (_, i) => (
        <View key={i} style={[styles.seg, { backgroundColor: i < cheios ? cor : TRILHO }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 14, borderRadius: 7 },
});
