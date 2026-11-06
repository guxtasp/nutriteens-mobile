// src/features/auth/components/CampoSelecao.tsx
//
// Campo de seleção: parece um input (borda + chevron) e, ao tocar, abre uma lista
// (bottom sheet) com as opções. Substitui os "radio/chips" de gênero e escola.
import React, { useState } from 'react';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';

export interface OpcaoSelecao {
  label: string;
  value: string;
}

interface CampoSelecaoProps {
  label: string;
  placeholder?: string;
  options: OpcaoSelecao[];
  value: string | null;
  onChange: (value: string) => void;
  hasError?: boolean;
}

export function CampoSelecao({
  label,
  placeholder = 'Selecione',
  options,
  value,
  onChange,
  hasError,
}: CampoSelecaoProps) {
  const insets = useSafeAreaInsets();
  const [aberto, setAberto] = useState(false);
  const selecionada = options.find((o) => o.value === value) ?? null;

  function abrir() {
    // com o teclado aberto o sheet ficaria por baixo/espremido: fecha o teclado antes
    Keyboard.dismiss();
    setAberto(true);
  }

  function escolher(novo: string) {
    onChange(novo);
    setAberto(false);
  }

  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>

      <Pressable
        onPress={abrir}
        style={[styles.campo, hasError && styles.campoErro]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selecionada ? selecionada.label : 'Nenhuma opção escolhida' }}
        accessibilityHint="Toque para escolher uma opção"
      >
        <AppText
          style={[styles.valor, !selecionada && styles.placeholder]}
          numberOfLines={1}
        >
          {selecionada ? selecionada.label : placeholder}
        </AppText>
        <Feather name="chevron-down" size={22} color={colors.primaryDark} />
      </Pressable>

      <Modal
        visible={aberto}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setAberto(false)}
      >
        <View style={styles.overlay}>
          {/* toque fora do sheet fecha sem alterar a escolha */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setAberto(false)}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          />
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]}>
            <View style={styles.alca} />
            <AppText style={styles.sheetTitulo} accessibilityRole="header">
              {label}
            </AppText>
            <ScrollView bounces={false}>
              {options.map((opcao) => {
                const marcada = opcao.value === value;
                return (
                  <Pressable
                    key={opcao.value}
                    onPress={() => escolher(opcao.value)}
                    style={[styles.opcao, marcada && styles.opcaoMarcada]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: marcada }}
                  >
                    <AppText style={[styles.opcaoTexto, marcada && styles.opcaoTextoMarcada]}>
                      {opcao.label}
                    </AppText>
                    {marcada && <Feather name="check" size={20} color={colors.primaryDark} />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },
  label: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: 6,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  campoErro: { borderColor: colors.error },
  valor: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
  },
  placeholder: { color: colors.placeholder },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '70%',
  },
  alca: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D6DCD9',
    marginBottom: 14,
  },
  sheetTitulo: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
    marginBottom: 8,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  opcaoMarcada: { backgroundColor: '#E2F3D3' },
  opcaoTexto: {
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 16,
    color: colors.primaryDark,
  },
  opcaoTextoMarcada: { fontFamily: typography.bold },
});
