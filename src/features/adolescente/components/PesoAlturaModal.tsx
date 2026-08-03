// src/features/adolescente/components/PesoAlturaModal.tsx
import React, { useState } from 'react';
import { Modal, View, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

type Props = {
  visivel: boolean;
  onConfirmar: (pesoKg: number, alturaCm: number | null) => void;
};

export default function PesoAlturaModal({ visivel, onConfirmar }: Props) {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [erro, setErro] = useState('');

  function handleConfirmar() {
    const pesoNum = parseFloat(peso.replace(',', '.'));
    if (!pesoNum || pesoNum <= 0 || pesoNum > 200) {
      setErro('Digite um peso válido (em kg)');
      return;
    }
    const alturaNum = altura.trim() ? parseFloat(altura.replace(',', '.')) : null;
    onConfirmar(pesoNum, alturaNum);
  }

  return (
    <Modal visible={visivel} transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <AppText style={styles.titulo}>Só mais um dado 🙂</AppText>
          <AppText style={styles.subtitulo}>
            Pra calcular sua meta ideal de água, precisamos do seu peso.
          </AppText>

          <AppText style={styles.label}>Peso (kg)</AppText>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="Ex: 45.5"
            value={peso}
            onChangeText={setPeso}
          />

          <AppText style={styles.label}>Altura (cm) — opcional</AppText>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="Ex: 150"
            value={altura}
            onChangeText={setAltura}
          />

          {!!erro && <AppText style={styles.erro}>{erro}</AppText>}

          <AppButton label="Confirmar" onPress={handleConfirmar} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 28, 39, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
  },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginBottom: 6 },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', marginBottom: 20 },
  label: { fontFamily: typography.medium, fontSize: 13, color: colors.primaryDark, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: typography.regular,
    fontSize: 14,
    marginBottom: 16,
  },
  erro: { fontFamily: typography.regular, fontSize: 12, color: colors.error, marginBottom: 12 },
});