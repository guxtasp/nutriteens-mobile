// src/features/adolescente/perfil/components/PesoAlturaModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  visivel: boolean;
  // pode ser assíncrona: se lançar erro, o modal mostra a mensagem e continua aberto
  onConfirmar: (pesoKg: number, alturaCm: number | null) => Promise<void> | void;
  // "Agora não" / botão voltar do Android. Sem isso o modal não tem saída.
  onFechar?: () => void;
};

export default function PesoAlturaModal({ visivel, onConfirmar, onFechar }: Props) {
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleConfirmar() {
    if (salvando) return;

    const pesoNum = parseFloat(peso.replace(',', '.'));
    if (!pesoNum || pesoNum <= 0 || pesoNum > 200) {
      setErro('Digite um peso válido (em kg)');
      return;
    }

    let alturaNum: number | null = null;
    if (altura.trim()) {
      alturaNum = parseFloat(altura.replace(',', '.'));
      if (!alturaNum || alturaNum < 50 || alturaNum > 250) {
        setErro('Digite uma altura válida (em cm), ou deixe em branco');
        return;
      }
    }

    // o teclado numérico do iPhone não tem tecla "OK": fecha aqui
    Keyboard.dismiss();
    setErro('');
    setSalvando(true);
    try {
      await onConfirmar(pesoNum, alturaNum);
    } catch (e) {
      console.error('Erro ao salvar peso/altura:', e);
      setErro('Não foi possível salvar agora. Tente de novo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onFechar}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* rola pra o botão nunca ficar escondido atrás do teclado */}
        <ScrollView
          contentContainerStyle={styles.scrollConteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* tocar fora dos campos fecha o teclado */}
          <Pressable style={styles.areaToque} onPress={Keyboard.dismiss}>
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
                placeholderTextColor="#9AA5A0"
                value={peso}
                onChangeText={setPeso}
              />

              <AppText style={styles.label}>Altura (cm) — opcional</AppText>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="Ex: 150"
                placeholderTextColor="#9AA5A0"
                value={altura}
                onChangeText={setAltura}
              />

              {!!erro && <AppText style={styles.erro}>{erro}</AppText>}

              <AppButton
                label={salvando ? 'Salvando...' : 'Confirmar'}
                onPress={handleConfirmar}
                disabled={salvando}
              />

              {!!onFechar && (
                <Pressable style={styles.agoraNao} onPress={onFechar} disabled={salvando}>
                  <AppText style={styles.agoraNaoTexto}>Agora não</AppText>
                </Pressable>
              )}
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(10, 28, 39, 0.55)',
  },
  scrollConteudo: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  areaToque: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
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
    color: colors.primaryDark,
    marginBottom: 16,
  },
  erro: { fontFamily: typography.regular, fontSize: 12, color: colors.error, marginBottom: 12 },
  agoraNao: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  agoraNaoTexto: { fontFamily: typography.semiBold, fontSize: 13, color: '#7A8B94' },
});