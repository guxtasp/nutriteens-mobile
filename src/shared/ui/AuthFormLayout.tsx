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

 // src/shared/ui/AuthFormLayout.tsx

import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
  Platform,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type Props = {
  children: React.ReactNode;
  /** true só no web com janela larga (cartão centralizado). */
  desktop?: boolean;
  /** estilo do container no modo desktop. */
  desktopStyle?: StyleProp<ViewStyle>;
  /** cabeçalho de largura total. */
  header?: React.ReactNode;
  /** rodapé fixo, como o botão principal. */
  footer?: React.ReactNode;
};

const PADDING_VERTICAL_EXTRA = 24;

export function AuthFormLayout({
  children,
  desktop = false,
  desktopStyle,
  header,
  footer,
}: Props) {
  const insets = useSafeAreaInsets();

  // layout desktop
  if (desktop) {
    return (
      <View style={desktopStyle}>
        {header}

        {header ? (
          <View style={styles.corpo}>{children}</View>
        ) : (
          children
        )}

        {footer ? (
          <View style={styles.rodapeDesktop}>{footer}</View>
        ) : null}
      </View>
    );
  }

  // layout mobile
  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.fill}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[
            styles.conteudo,
            header ? styles.conteudoComHeader : null,
            !header && {
              paddingTop: insets.top + PADDING_VERTICAL_EXTRA,
            },
            {
              paddingBottom: footer
                ? 16
                : insets.bottom + PADDING_VERTICAL_EXTRA,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          {header}

          {header ? (
            <View style={styles.corpo}>{children}</View>
          ) : (
            children
          )}
        </ScrollView>

        {footer ? (
          <View
            style={[
              styles.rodape,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.white,
  },

  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  conteudoComHeader: {
    paddingHorizontal: 0,
  },

  corpo: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  rodape: {
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EC',
  },

  rodapeDesktop: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
});
