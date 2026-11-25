// src/shared/ui/TelaBase.tsx
//
// Esqueleto padrão de tela: fundo, área segura, barra de status, cabeçalho, conteúdo (rolável ou
// não) e rodapé. Existe porque o app é edge-to-edge no Android e cada tela tratava o "embaixo" de
// um jeito (ver docs/AUDITORIA_LAYOUT.md).
//
// Regra do espaço de baixo:
//  - com `rodape` (use RodapeAcoes): o rodapé protege a barra do sistema; o conteúdo termina nele;
//  - sem rodapé: o conteúdo ganha insets.bottom (+ folga no fim, se rolável);
//  - com algo flutuando por cima embaixo (barra de abas): passe `alturaSobreposta` (a altura total
//    dela, que já inclui o inset; ex.: useAlturaBarraAbas()).
// O topo, a esquerda e a direita vêm do SafeAreaView.
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBarraStatus } from '../hooks/useBarraStatus';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

type Props = {
  children: React.ReactNode;
  cabecalho?: React.ReactNode;
  rodape?: React.ReactNode;
  rolavel?: boolean;
  /** cor de fundo da tela; padrão branco */
  fundo?: string;
  /** 'escura' = ícones da barra de status escuros (fundo claro, padrão); 'clara' = fundo escuro */
  barraStatus?: 'escura' | 'clara';
  /** altura do que flutua por cima embaixo (barra de abas), já com o inset */
  alturaSobreposta?: number;
  /** estilo do conteúdo (no rolável, vai para o contentContainerStyle). O paddingBottom é da TelaBase. */
  conteudoStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  scrollRef?: React.Ref<ScrollView>;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  style?: StyleProp<ViewStyle>;
};

export function TelaBase({
  children,
  cabecalho,
  rodape,
  rolavel,
  fundo = colors.white,
  barraStatus = 'escura',
  alturaSobreposta,
  conteudoStyle,
  refreshControl,
  scrollRef,
  keyboardShouldPersistTaps = 'handled',
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  useBarraStatus(barraStatus);
  // com rodapé, ele mesmo protege a barra do sistema; sem rodapé, o conteúdo protege
  const baseInferior = rodape ? 0 : alturaSobreposta ?? insets.bottom;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.tela, { backgroundColor: fundo }, style]}>
      {cabecalho}
      {rolavel ? (
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[conteudoStyle, { paddingBottom: baseInferior + layout.folgaFinalRolagem }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, conteudoStyle, { paddingBottom: baseInferior }]}>{children}</View>
      )}
      {rodape}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  flex: { flex: 1 },
});
