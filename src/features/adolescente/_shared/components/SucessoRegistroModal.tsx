import React, { useEffect, useRef } from 'react';
import { Modal, View, Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  visivel: boolean;
  quantidade: number;
  onFechar: () => void;
  mensagem?: string; // se não vier, usa a mensagem padrão de atividade física
};

const DURACAO_AUTO_FECHAR = 2200;

export default function SucessoRegistroModal({ visivel, quantidade, onFechar, mensagem }: Props) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const iconeScale = useRef(new Animated.Value(0)).current;
  const textoOpacity = useRef(new Animated.Value(0)).current;
  const textoTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!visivel) return;

    backdropOpacity.setValue(0);
    iconeScale.setValue(0);
    textoOpacity.setValue(0);
    textoTranslateY.setValue(12);

    Animated.timing(backdropOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.spring(iconeScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      delay: 100,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(textoOpacity, {
        toValue: 1,
        duration: 350,
        delay: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(textoTranslateY, {
        toValue: 0,
        duration: 350,
        delay: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(fechar, DURACAO_AUTO_FECHAR);
    return () => clearTimeout(timeout);
  }, [visivel]);

  function fechar() {
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onFechar());
  }

  if (!visivel) return null;

const mensagemFinal =
        mensagem ??
        (quantidade === 1
        ? 'Você registrou 1 atividade física hoje.'
        : `Você registrou ${quantidade} atividades físicas hoje.`);
  return (
    <Modal visible={visivel} transparent animationType="none" statusBarTranslucent>
      <Pressable style={styles.container} onPress={fechar}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        <View style={styles.conteudo}>
          <Animated.View style={[styles.iconeCirculo, { transform: [{ scale: iconeScale }] }]}>
            <Ionicons name="checkmark" size={56} color="#fff" />
          </Animated.View>
          <Animated.View style={{ opacity: textoOpacity, transform: [{ translateY: textoTranslateY }] }}>
            <AppText style={styles.titulo}>Parabéns! 🎉</AppText>
            <AppText style={styles.subtitulo}>{mensagemFinal}</AppText>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 28, 39, 0.55)',
  },
  conteudo: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconeCirculo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: '#EAF0EC',
    textAlign: 'center',
  },
});