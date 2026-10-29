// src/features/adolescente/metricas/components/graficos/MiniBarraMistura.tsx
//
// Versão pequena e estática da barra de mistura (Home). Sem toque, sem número, sem animação.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COR_MISTURA } from '../../ui/tokens';
import { CLASSES_MISTURA, type ClasseMistura } from '../../utils/misturaNova';

export function MiniBarraMistura({ valores }: { valores: Record<ClasseMistura, number> }) {
  const presentes = CLASSES_MISTURA.filter((c) => valores[c] > 0);
  if (presentes.length === 0) return null;
  return (
    <View style={styles.barra}>
      {presentes.map((c) => (
        <View key={c} style={{ flex: valores[c], backgroundColor: COR_MISTURA[c] }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
});
