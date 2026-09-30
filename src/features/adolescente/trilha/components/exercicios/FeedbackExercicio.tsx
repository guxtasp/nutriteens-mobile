// src/features/adolescente/trilha/components/exercicios/FeedbackExercicio.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../../shared/ui/AppText';
import { AppButton } from '../../../../../shared/ui/AppButton';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';

type Props = {
  acertou: boolean;
  // só usado (e só faz sentido mostrar) quando errou — quando acerta não
  // precisa de explicação, só o reforço positivo (ver Figma)
  explicacao?: string | null;
  onContinuar: () => void;
};

/**
 * Painel de feedback ancorado embaixo, mesmo padrão em todos os formatos.
 * Acerto: banner verde "Aeee! Muito bom!", sem explicação, botão "CONTINUAR".
 * Erro: banner vermelho "Putz... Incorreto!" + explicação, botão "ASSIM, OK!"
 * (rótulo mais leve de propósito — não é punitivo, só reconhece o engano).
 */
export default function FeedbackExercicio({ acertou, explicacao, onContinuar }: Props) {
  return (
    <View style={[styles.painel, acertou ? styles.painelCerto : styles.painelErrado]}>
      <View style={styles.cabecalho}>
        <Ionicons
          name={acertou ? 'checkmark-circle' : 'close-circle'}
          size={22}
          color={acertou ? colors.success : colors.error}
        />
        <AppText style={[styles.titulo, { color: acertou ? colors.success : colors.error }]}>
          {acertou ? 'Aeee! Muito bom!' : 'Putz... Incorreto!'}
        </AppText>
      </View>

      {!acertou && !!explicacao && (
        <AppText style={styles.explicacao}>{explicacao}</AppText>
      )}

      <AppButton
        label={acertou ? 'CONTINUAR' : 'ASSIM, OK!'}
        backgroundColor={acertou ? colors.primary : colors.error}
        textColor={colors.white}
        shadowColor={acertou ? colors.primaryShadow : '#8C2A1F'}
        fullWidth
        onPress={onContinuar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  painel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 12,
  },
  painelCerto: { backgroundColor: '#E8F8E0' },
  painelErrado: { backgroundColor: '#FFE2DE' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontFamily: typography.bold, fontSize: 18 },
  explicacao: {
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.error,
  },
});
