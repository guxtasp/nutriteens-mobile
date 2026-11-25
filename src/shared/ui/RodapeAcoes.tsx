// src/shared/ui/RodapeAcoes.tsx
//
// Área de botões presa embaixo da tela. Fica NO FLUXO (não é position: absolute): assim o
// conteúdo rolável acima termina exatamente onde o rodapé começa e o último item nunca fica
// escondido. Protege a barra do sistema com paddingBottom = max(insets.bottom, mínimo).
// Use dentro da TelaBase (prop `rodape`) ou como último filho de uma coluna flex: 1.
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

type Props = {
  children: React.ReactNode;
  /** sem a linha de cima (quando o rodapé já está sobre um bloco de cor própria) */
  semDivisoria?: boolean;
  /** cor de fundo; padrão branco */
  fundo?: string;
  /** espaço mínimo embaixo em aparelhos sem barra do sistema (padrão layout.rodapeEspacoMin) */
  espacoMin?: number;
  style?: StyleProp<ViewStyle>;
};

export function RodapeAcoes({ children, semDivisoria, fundo = colors.white, espacoMin = layout.rodapeEspacoMin, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.rodape,
        { backgroundColor: fundo, paddingBottom: Math.max(insets.bottom, espacoMin) },
        !semDivisoria && styles.divisoria,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rodape: {
    paddingHorizontal: layout.cabecalhoTelaPaddingH,
    paddingTop: layout.rodapePaddingTop,
    gap: 8,
  },
  divisoria: { borderTopWidth: 1, borderTopColor: colors.divisoriaLista },
});
