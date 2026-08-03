import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface OptionButtonProps {
  label: string;
  ativo: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function OptionButton({ label, ativo, onPress, style }: OptionButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.botao, ativo && styles.botaoAtivo, style]}>
      <AppText style={[styles.texto, ativo && styles.textoAtivo]}>{label.toUpperCase()}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botaoAtivo: {
    borderColor: colors.primaryDark,
    backgroundColor: '#E3F5D4',
  },
  texto: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: '#8A8A8A',
  },
  textoAtivo: {
    color: colors.primaryDark,
  },
});