// src/shared/ui/AuthFormLayout.tsx
//
// Casca única para as telas de formulário de autenticação (login, esqueci a
// senha, redefinir senha). Resolve três problemas de uma vez no celular:
//   1. Conteúdo que não cabe na tela (telas curtas, fonte aumentada) agora ROLA,
//      em vez de cortar o botão principal.
//   2. O teclado empurra o conteúdo (KeyboardAvoidingView) e toques em botões
//      continuam funcionando com o teclado aberto (keyboardShouldPersistTaps).
//   3. Paddings superior/inferior vêm dos insets REAIS do aparelho (status bar,
//      recorte, barra de gestos/3 botões) — antes eram 60/70 fixos.
//
// No web desktop o visual de "cartão centralizado" é preservado exatamente como
// era: lá não há teclado virtual nem insets, então o container fixo continua.
import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  /** true só no web com janela larga (cartão centralizado). */
  desktop?: boolean;
  /** estilo do container no modo desktop (o mesmo que a tela já usava). */
  desktopStyle?: StyleProp<ViewStyle>;
  /** cabeçalho de largura total (ex.: topo verde). Rola junto com o conteúdo. */
  header?: React.ReactNode;
};

const PADDING_VERTICAL_EXTRA = 24;

export function AuthFormLayout({ children, desktop = false, desktopStyle, header }: Props) {
  const insets = useSafeAreaInsets();

  if (desktop) {
    return (
      <View style={desktopStyle}>
        {header}
        {header ? <View style={styles.corpo}>{children}</View> : children}
      </View>
    );
  }

  return (
    // 'padding' nos dois sistemas: com edge-to-edge ligado no Android
    // (app.json -> edgeToEdgeEnabled) a janela não é redimensionada pelo teclado,
    // então o ajuste precisa vir daqui. Validar em aparelho (ver roteiro de testes).
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScrollView
        style={styles.fill}
        contentContainerStyle={[
          styles.conteudo,
          header ? styles.conteudoComHeader : null,
          !header && { paddingTop: insets.top + PADDING_VERTICAL_EXTRA },
          { paddingBottom: insets.bottom + PADDING_VERTICAL_EXTRA },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {header}
        {header ? <View style={styles.corpo}>{children}</View> : children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.white },
  // flexGrow:1 mantém o rodapé (spacer + botão) colado embaixo quando o
  // conteúdo é curto, e deixa rolar quando é maior que a tela.
  conteudo: { flexGrow: 1, paddingHorizontal: 24 },
  // com cabeçalho de largura total: o padding lateral passa para o corpo
  conteudoComHeader: { paddingHorizontal: 0 },
  corpo: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24 },
});