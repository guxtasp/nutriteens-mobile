import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}


// Esse componente é um botão de voltar, que recebe uma função onPress como prop. Ele utiliza o ícone "arrow-left" da biblioteca Feather e tem um estilo definido no arquivo de estilos.
export function BackButton({ onPress, style }: BackButtonProps) {
  return (
    <Pressable style={[styles.backButton, style]} onPress={onPress}>
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
