// src/features/auth/components/SairDoCadastroModal.tsx
//
// Confirmação ao sair do cadastro com dados já preenchidos.
import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';

interface SairDoCadastroModalProps {
  visible: boolean;
  onContinuar: () => void;
  onSair: () => void;
}

export function SairDoCadastroModal({ visible, onContinuar, onSair }: SairDoCadastroModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onContinuar} // botão voltar do Android com o modal aberto = continuar preenchendo
    >
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <Image
            source={require('../../../../assets/img/cadastro/curioso.png')}
            style={styles.mascote}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
          <AppText style={styles.titulo} accessibilityRole="header">
            Sair do cadastro?
          </AppText>
          <AppText style={styles.texto}>Se você sair agora, vai perder o que já preencheu.</AppText>

          <AppButton
            label="CONTINUAR PREENCHENDO"
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor="#123024"
            fullWidth
            onPress={onContinuar}
          />

          <Pressable
            onPress={onSair}
            style={styles.secundario}
            accessibilityRole="button"
            accessibilityLabel="Sair e perder o que foi preenchido"
          >
            <AppText style={styles.secundarioTexto}>Sair e perder</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(8, 36, 27, 0.92)',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    alignItems: 'center',
  },
  mascote: { width: 84, height: 84, marginBottom: 14 },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 22,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  texto: {
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 23,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 22,
  },
  secundario: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.exercicioBorda,
  },
  secundarioTexto: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.error,
  },
});
