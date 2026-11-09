// src/features/adolescente/alimentacao/components/ProgressoCadastro.tsx
// Barrinha de passos do cadastro de alimento ("Passo 1 de 2"). Só desenho: quem usa diz em qual passo está.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../../shared/theme/colors';

export function ProgressoCadastro({ passo, total = 2 }: { passo: number; total?: number }) {
  return (
    <View style={styles.linha} accessibilityLabel={`Passo ${passo} de ${total}`}>
      {Array.from({ length: total }, (_, k) => (
        <View key={k} style={[styles.segmento, k < passo && styles.segmentoFeito]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 20 },
  segmento: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#DDE8D2' },
  segmentoFeito: { backgroundColor: colors.primary },
});
