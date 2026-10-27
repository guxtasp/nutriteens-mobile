// src/features/conteudo/components/preview/QuadroCelular.tsx
// Moldura "tela de celular" para a prévia de uso: o conteúdo roda com os componentes reais do
// aplicativo do adolescente, numa área de tamanho fixo, sob um aviso de que nada é salvo.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

export function QuadroCelular({ children, altura = 680 }: { children: React.ReactNode; altura?: number }) {
  return (
    <View style={styles.externo}>
      <View style={styles.aviso} accessibilityRole="alert">
        <AppText style={styles.avisoTexto}>PRÉVIA · como o adolescente vê. Nada é salvo e não gera XP.</AppText>
      </View>
      <View style={[styles.tela, { height: altura }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  externo: { width: '100%', maxWidth: 400, alignSelf: 'center', gap: 8 },
  aviso: { backgroundColor: '#FFF4CC', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  avisoTexto: { fontFamily: typography.semiBold, fontSize: 12, color: '#7A5B00', textAlign: 'center' },
  tela: { borderWidth: 3, borderColor: '#D9D9D9', borderRadius: 28, overflow: 'hidden', backgroundColor: colors.white },
});
