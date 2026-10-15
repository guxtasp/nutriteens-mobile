// src/features/adolescente/metricas/components/ConquistasLista.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import type { ConquistaObtida } from '../types/metricas';
import { formatarDiaMes } from '../utils/periodos';
import { ACENTOS } from '../ui/tokens';

export function ConquistasLista({ itens }: { itens: ConquistaObtida[] }) {
  const ac = ACENTOS.conquistas;
  return (
    <View style={{ gap: 8 }}>
      {itens.map((c, i) => (
        <View key={`${c.tipo}-${c.nome}-${i}`} style={[styles.linha, { backgroundColor: ac.suave }]}>
          <Ionicons name={c.tipo === 'carta' ? 'albums' : 'ribbon'} size={20} color={ac.cor} />
          <AppText style={styles.nome} numberOfLines={2}>{c.nome}</AppText>
          <AppText style={styles.data}>{formatarDiaMes(c.data)}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  nome: { flex: 1, fontFamily: typography.semiBold, fontSize: 13, color: '#1B4332' },
  data: { fontFamily: typography.medium, fontSize: 12, color: '#4B4B4B' },
});
