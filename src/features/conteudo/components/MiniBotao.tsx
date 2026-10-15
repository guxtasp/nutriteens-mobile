// src/features/conteudo/components/MiniBotao.tsx
// Botão pequeno de ação (↑ ↓ ✕ EXCLUIR) para listas editáveis do painel. Área de toque >= 44 px.
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';

export function MiniBotao({ label, onPress, desativado, perigo, acessibilidade }: { label: string; onPress: () => void; desativado?: boolean; perigo?: boolean; acessibilidade?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={acessibilidade ?? label}
      style={[styles.mini, perigo && styles.perigo, desativado && { opacity: 0.35 }]}
    >
      <AppText style={[styles.texto, perigo && { color: colors.error }]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mini: { minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: painel.cardBorda, alignItems: 'center', justifyContent: 'center', backgroundColor: painel.card },
  perigo: { borderColor: colors.error },
  texto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
});
