// src/features/conteudo/components/preview/QuadroCelular.tsx
// Moldura "tela de celular" para a prévia de uso: o conteúdo roda com os componentes reais do
// aplicativo do adolescente, numa área de tamanho fixo, sob um aviso de que nada é salvo.
import React, { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LarguraTelaProvider } from '../../../../shared/ui/LarguraTela';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

export const LARGURA_MAX_QUADRO = 400;
const BORDA_QUADRO = 3;

export function QuadroCelular({ children, altura = 680 }: { children: React.ReactNode; altura?: number }) {
  const { width: janela } = useWindowDimensions();
  // largura útil do quadro: a medida de verdade (onLayout), ou uma estimativa até medir
  const [medida, setMedida] = useState<number | null>(null);
  const estimada = Math.max(280, Math.min(LARGURA_MAX_QUADRO, janela - 32) - BORDA_QUADRO * 2);
  const largura = medida ?? estimada;
  return (
    <View style={styles.externo}>
      <View style={styles.aviso} accessibilityRole="alert">
        <AppText style={styles.avisoTexto}>PRÉVIA · como o adolescente vê. Nada é salvo e não gera XP.</AppText>
      </View>
      <View style={[styles.tela, { height: altura }]} onLayout={(e) => setMedida(Math.max(240, Math.round(e.nativeEvent.layout.width) - BORDA_QUADRO * 2))}>
        <LarguraTelaProvider largura={largura}>{children}</LarguraTelaProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  externo: { width: '100%', maxWidth: 400, alignSelf: 'center', gap: 8 },
  aviso: { backgroundColor: '#FFF4CC', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  avisoTexto: { fontFamily: typography.semiBold, fontSize: 12, color: '#7A5B00', textAlign: 'center' },
  tela: { borderWidth: 3, borderColor: '#D9D9D9', borderRadius: 28, overflow: 'hidden', backgroundColor: colors.white },
});
