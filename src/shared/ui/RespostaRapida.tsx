// src/shared/ui/RespostaRapida.tsx
//
// Pílula de resposta rápida (conversa com o Bróxis): alinhada à direita, como a fala de quem
// responde, com o mesmo relevo dos botões do app.
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface RespostaRapidaProps {
  rotulo: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function RespostaRapida({ rotulo, onPress, disabled, style }: RespostaRapidaProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [styles.pilula, pressed && styles.pressionada, style]}
    >
      <AppText style={styles.texto}>{rotulo}</AppText>
      <Ionicons name="arrow-forward" size={16} color={colors.destaqueTexto} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pilula: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    borderRadius: 23,
  },
  pressionada: { backgroundColor: colors.exercicioAcertoFundo },
  texto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
});
