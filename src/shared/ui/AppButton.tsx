// src/shared/ui/AppButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet, TouchableOpacityProps } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';

interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  backgroundColor?: string;
  textColor?: string;
  outlineColor?: string;   // borda fina em volta (só pra botão tipo outline)
  shadowColor?: string;    // cor do relevo embaixo (só pra botão preenchido)
  selected?: boolean;
  fullWidth?: boolean;
  borderWidth?: number;
}

export function AppButton({
  label,
  backgroundColor = colors.primary,
  textColor = colors.background,
  outlineColor,
  shadowColor = colors.primaryShadow,
  selected,
  fullWidth = true,
  borderWidth,
  style,
  ...props
}: AppButtonProps) {
  const isDeselected = selected === false;
  // Se o botão estiver marcado como "outline" (outlineColor definido) 
  // ou se estiver desmarcado (selected === false), 
  // ele será renderizado como um botão outline, caso contrário, 
  // será renderizado como um botão preenchido com relevo embaixo.
  const isOutline = !!outlineColor || isDeselected;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        isOutline
          ? {
              // botão outline: borda fina em todos os lados, sem relevo
              backgroundColor: 'transparent',
              borderWidth: borderWidth ?? 1,
              // Se outlineColor não for definido, usa a cor primária como padrão
              borderColor: outlineColor ?? colors.primary,
              borderBottomColor: shadowColor,
              borderBottomWidth: 4,

            }
          : {
              // botão preenchido: sem borda nos lados, só relevo embaixo
              backgroundColor,
              borderBottomWidth: 4,
              borderBottomColor: shadowColor,
            },
        style,
      ]}
      {...props}
    >
      <AppText style={[styles.text, { color: isOutline ? (outlineColor ?? colors.primary) : textColor }]}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: typography.bold,
    fontSize: 16,
  },
});