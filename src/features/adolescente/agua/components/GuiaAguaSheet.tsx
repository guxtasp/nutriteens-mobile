// src/features/adolescente/components/GuiaAguaSheet.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  visivel: boolean;
  onFechar: () => void;
};

type Passo = {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
};

const PASSOS: Passo[] = [
  {
    icone: 'water',
    titulo: 'Sua meta diária',
    texto: 'Calculamos sua meta ideal de água com base no seu peso.',
  },
  {
    icone: 'add-circle',
    titulo: 'Registre aos poucos',
    texto: 'Escolha 100, 200 ou 300 ml e toque em "Registre aqui" cada vez que beber água.',
  },
  {
    icone: 'trending-up',
    titulo: 'Acompanhe seu progresso',
    texto: 'Veja sua média semanal e mensal logo abaixo da garrafa.',
  },
];

const DURACAO_AUTO_AVANCO = 5000;
const LARGURA_TELA = Dimensions.get('window').width;

export default function GuiaAguaSheet({ visivel, onFechar }: Props) {
  const [montado, setMontado] = useState(visivel);
  const [passoAtual, setPassoAtual] = useState(0);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;
  const conteudoTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      setMontado(true);
      setPassoAtual(0);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(400);

      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      ]).start();
    } else if (montado) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start(() => setMontado(false));
    }
  }, [visivel]);

  useEffect(() => {
    if (!visivel) return;

    conteudoTranslateX.setValue(LARGURA_TELA * 0.4);
    Animated.timing(conteudoTranslateX, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      avancarPasso();
    }, DURACAO_AUTO_AVANCO);

    return () => clearTimeout(timeout);
  }, [passoAtual, visivel]);

  function avancarPasso() {
    setPassoAtual((atual) => (atual + 1) % PASSOS.length);
  }

  function irParaPasso(indice: number) {
    if (indice === passoAtual) return;
    setPassoAtual(indice);
  }

  if (!montado) return null;

  const passo = PASSOS[passoAtual];

  return (
    <Modal visible transparent animationType="none" onRequestClose={onFechar}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onFechar}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: sheetTranslateY }] }]}>
        <Pressable style={styles.sheet} onPress={avancarPasso}>
          <View style={styles.puxador} />

          <View style={styles.cabecalho}>
            <AppText style={styles.titulo}>Como registrar?</AppText>
            <Pressable onPress={onFechar} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.primaryDark} />
            </Pressable>
          </View>

          <View style={styles.conteudoJanela}>
            <Animated.View
              style={[styles.conteudo, { transform: [{ translateX: conteudoTranslateX }] }]}
            >
              <View style={styles.iconeCirculo}>
                <Ionicons name={passo.icone} size={40} color="#fff" />
              </View>
              <AppText style={styles.passoTitulo}>{passo.titulo}</AppText>
              <AppText style={styles.passoTexto}>{passo.texto}</AppText>
            </Animated.View>
          </View>

          <View style={styles.dots}>
            {PASSOS.map((_, indice) => (
              <Pressable key={indice} onPress={() => irParaPasso(indice)} hitSlop={8}>
                <View style={[styles.dot, indice === passoAtual && styles.dotAtivo]} />
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: {
    backgroundColor: colors.white ?? '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9E2E8', alignSelf: 'center', marginBottom: 16 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  conteudoJanela: { overflow: 'hidden' },
  conteudo: { alignItems: 'center', paddingVertical: 20 },
  iconeCirculo: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#8BC34A',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  passoTitulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark, marginBottom: 6, textAlign: 'center' },
  passoTexto: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', textAlign: 'center', paddingHorizontal: 12 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#D9E2E8' },
  dotAtivo: { width: 18, backgroundColor: '#8BC34A' },
});