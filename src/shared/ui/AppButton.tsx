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
  // 'compact' = botão mais baixo, com fonte e relevo menores (usado nos exercícios)
  size?: 'normal' | 'compact';
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
  size = 'normal',
  style,
  ...props
}: AppButtonProps) {
  const isDeselected = selected === false;
  const compact = size === 'compact';
  const relevo = compact ? 3 : 4;
  // Se o botão estiver marcado como "outline" (outlineColor definido)
  // ou se estiver desmarcado (selected === false),
  // ele será renderizado como um botão outline, caso contrário,
  // será renderizado como um botão preenchido com relevo embaixo.
  const isOutline = !!outlineColor || isDeselected;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        compact && styles.baseCompact,
        fullWidth && styles.fullWidth,
        isOutline
          ? {
              // botão outline: borda fina em todos os lados, sem relevo
              backgroundColor: 'transparent',
              borderWidth: borderWidth ?? 1,
              // Se outlineColor não for definido, usa a cor primária como padrão
              borderColor: outlineColor ?? colors.primary,
              borderBottomColor: shadowColor,
              borderBottomWidth: relevo,
            }
          : {
              // botão preenchido: sem borda nos lados, só relevo embaixo
              backgroundColor,
              borderBottomWidth: relevo,
              borderBottomColor: shadowColor,
            },
        style,
      ]}
      {...props}
    >
      <AppText
        style={[
          styles.text,
          compact && styles.textCompact,
          { color: isOutline ? (outlineColor ?? colors.primary) : textColor },
        ]}
      >
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
  baseCompact: {
    borderRadius: 12,
    paddingVertical: 10,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontFamily: typography.bold,
    fontSize: 16,
  },
  textCompact: {
    fontSize: 14,
    letterSpacing: 0.4,
  },
});