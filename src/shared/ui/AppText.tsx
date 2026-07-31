import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { typography } from '../theme/typography';

// Componente de texto personalizado que aplica a fonte padrão do aplicativo
// Ele aceita todas as props de um componente Text normal, além de permitir estilos adicionais via prop "style"
export function AppText({ style, ...props }: TextProps) {
  // Aplica o estilo padrão e permite sobrescrever com estilos personalizados
  return <Text style={[styles.default, style]} {...props} />;
}

const styles = StyleSheet.create({
  // Define o estilo padrão para o componente AppText, usando a fonte regular definida na tipografia do aplicativo
  default: {
    fontFamily: typography.regular,
  },
});