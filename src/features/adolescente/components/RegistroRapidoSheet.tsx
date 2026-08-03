// src/features/adolescente/components/RegistroRapidoSheet.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, TextInput, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

type Props = {
  visivel: boolean;
  onFechar: () => void;
  onAdicionar: (nome: string, duracaoMinutos: number) => void;
};

export default function RegistroRapidoSheet({ visivel, onFechar, onAdicionar }: Props) {
  const [nome, setNome] = useState('');
  const [duracao, setDuracao] = useState('');
  const [montado, setMontado] = useState(visivel);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visivel) {
      setMontado(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(400);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          friction: 9,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (montado) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setMontado(false));
    }
  }, [visivel]);

  const valido = nome.trim().length > 0 && Number(duracao) > 0;

  function handleAdicionar() {
    if (!valido) return;
    onAdicionar(nome.trim(), Number(duracao));
    setNome('');
    setDuracao('');
    onFechar();
  }

  if (!montado) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onFechar}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onFechar}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View
        style={[
          styles.sheetWrapper,
          { transform: [{ translateY: sheetTranslateY }] },
        ]}
      >
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.puxador} />

          <View style={styles.cabecalho}>
            <Pressable onPress={onFechar} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.primaryDark} />
            </Pressable>
            <AppText style={styles.titulo}>Registro rápido</AppText>
            <View style={{ width: 20 }} />
          </View>

          <AppText style={styles.rotulo}>Nome da Atividade</AppText>
          <TextInput
            style={styles.input}
            placeholder="Ex: Futebol"
            placeholderTextColor="#9AA5A0"
            value={nome}
            onChangeText={setNome}
          />

          <AppText style={styles.rotulo}>Duração</AppText>
          <View style={styles.inputComSufixo}>
            <TextInput
              style={styles.inputFlex}
              placeholder="Ex: 30"
              placeholderTextColor="#9AA5A0"
              keyboardType="numeric"
              value={duracao}
              onChangeText={setDuracao}
            />
            <AppText style={styles.sufixo}>min.</AppText>
          </View>

          <Pressable
            style={[styles.botao, valido ? styles.botaoAtivo : styles.botaoInativo]}
            onPress={handleAdicionar}
            disabled={!valido}
          >
            <AppText style={styles.botaoTexto}>ADICIONAR ATIVIDADE</AppText>
          </Pressable>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: colors.white ?? '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9E2E8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  rotulo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: 16,
  },
  inputComSufixo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
  },
  sufixo: { fontFamily: typography.regular, fontSize: 13, color: '#9AA5A0' },
  botao: { borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  botaoAtivo: { backgroundColor: colors.primary },
  botaoInativo: { backgroundColor: '#D9E2E8' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: '#fff' },
});