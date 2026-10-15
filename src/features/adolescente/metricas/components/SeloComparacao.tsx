// src/features/adolescente/metricas/components/SeloComparacao.tsx
//
// Evolução em relação ao próprio período anterior. Sem rankings, sem vermelho:
// queda aparece como número neutro; sem base de comparação, nada aparece.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { Comparacao } from '../types/metricas';
import { rotuloComparacao } from '../utils/apresentacao';
import { TEXTO_SUAVE } from '../ui/tokens';

export function SeloComparacao({ comparacao }: { comparacao: Comparacao }) {
  const r = rotuloComparacao(comparacao);
  if (!r) return null;
  const positivo = r.tom === 'positivo';
  return (
    <View style={[styles.selo, positivo ? styles.positivo : styles.neutro]}>
      {positivo && <Ionicons name="arrow-up" size={12} color={colors.primaryDark} />}
      <AppText style={[styles.texto, { color: positivo ? colors.primaryDark : TEXTO_SUAVE }]}>{r.texto}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  positivo: { backgroundColor: '#E2F3D3' },
  neutro: { backgroundColor: '#EEF2EF' },
  texto: { fontFamily: typography.semiBold, fontSize: 12 },
});
