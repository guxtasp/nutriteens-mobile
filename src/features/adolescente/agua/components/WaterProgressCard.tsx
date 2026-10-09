// src/features/adolescente/components/WaterProgressCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { layout } from '../../../../shared/theme/layout';
import { typography } from '../../../../shared/theme/typography';

type Props = { mlAtual: number; mlMeta: number; onAdicionar?: () => void };

export default function WaterProgressCard({ mlAtual, mlMeta, onAdicionar }: Props) {
  const progresso = Math.min(mlAtual / mlMeta, 1);

  return (
    <View style={styles.card}>
      <AppText style={styles.titulo}>Seu registro de consumo de água</AppText>
      <View style={styles.linha}>
        <View style={styles.iconeGota}>
          <Ionicons name="water" size={18} color={colors.primaryDark} />
          <View style={styles.badgeMais}>
            <Ionicons name="add" size={9} color="#fff" />
          </View>
        </View>

        <View style={styles.trilha}>
          <View style={[styles.preenchido, { flex: progresso || 0.001 }]} />
          {progresso < 1 && <View style={{ flex: 1 - progresso }} />}
        </View>

        <AppText style={styles.valor}>{mlAtual.toLocaleString('pt-BR')}ml</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#CDE7D6',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: layout.margemH,
    marginTop: layout.gapEntreBlocos,
    marginBottom: layout.gapEntreBlocos,
  },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: 12,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconeGota: { position: 'relative' },
  badgeMais: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trilha: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#A9CFB6',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  preenchido: { backgroundColor: colors.primaryDark },
  valor: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
});