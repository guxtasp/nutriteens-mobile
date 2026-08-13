// src/features/adolescente/components/MissaoDoDiaCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import type { MissaoDoDia } from '../services/missaoService';

type Props = { missao: MissaoDoDia; concluida: boolean };

export default function MissaoDoDiaCard({ missao, concluida }: Props) {
  return (
    <View style={[styles.card, concluida && styles.cardConcluida]}>
      <AppText style={styles.icone}>{missao.icone ?? '🎯'}</AppText>
      <View style={{ flex: 1 }}>
        <AppText style={styles.titulo}>{missao.titulo}</AppText>
        <AppText style={styles.descricao} numberOfLines={2}>{missao.descricao}</AppText>
      </View>
      {concluida && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
  },
  cardConcluida: {
    backgroundColor: '#ECFDF5',
  },
  icone: { fontSize: 22 },
  titulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  descricao: { fontSize: 12, color: colors.textOnLight, marginTop: 1 },
});