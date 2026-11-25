// src/shared/ui/BackButton.tsx
// Botão de voltar (48×48, acima do alvo mínimo de 44). Usado pelo ScreenHeader e por cabeçalhos
// próprios de fluxos (lição, EBIA, jogos).
import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  /** rótulo para leitor de tela; padrão "Voltar" */
  rotulo?: string;
}

export function BackButton({ onPress, style, rotulo = 'Voltar' }: BackButtonProps) {
  return (
    <Pressable
      style={[styles.backButton, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      hitSlop={6}
    >
      <Feather name="arrow-left" size={22} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
