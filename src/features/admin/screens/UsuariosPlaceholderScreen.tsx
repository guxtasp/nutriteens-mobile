// src/features/admin/screens/UsuariosPlaceholderScreen.tsx e MetricasPlaceholderScreen.tsx
// (mesmo padrão simples — trocar só o texto até vocês definirem o que cada tela mostra)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

export default function MetricasPlaceholderScreen() {
  return (
    <View style={styles.root}>
      <AppText style={styles.texto}>Gestão de métricas e relatórios — em construção.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: 24 },
  texto: { fontFamily: typography.regular, fontSize: 14, color: '#8A8A8A', textAlign: 'center' },
});