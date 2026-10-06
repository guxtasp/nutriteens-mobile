// src/features/adolescente/components/MissaoDoDiaCard.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { MissaoDoDia } from '../../home/services/missaoService';

type Props = { missao: MissaoDoDia; concluida: boolean; onPress?: () => void };

export default function MissaoDoDiaCard({ missao, concluida, onPress }: Props) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.card, concluida && styles.cardConcluida]}>
      <AppText style={styles.icone}>{missao.icone ?? '🎯'}</AppText>
      <View style={{ flex: 1 }}>
        <AppText style={styles.titulo}>{missao.titulo}</AppText>
        <AppText style={styles.descricao} numberOfLines={2}>{missao.descricao}</AppText>
        <AppText style={styles.pontos}>+{missao.pontosRecompensa} pontos</AppText>
      </View>
      {concluida ? (
        <Ionicons name="checkmark-circle" size={22} color={colors.success} />
      ) : (
        !!onPress && <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
      )}
    </Pressable>
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
  pontos: { fontFamily: typography.bold, fontSize: 11, color: colors.primary, marginTop: 4 },
});