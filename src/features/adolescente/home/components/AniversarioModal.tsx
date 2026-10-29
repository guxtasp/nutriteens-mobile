// src/features/adolescente/home/components/AniversarioModal.tsx
//
// Mensagem de feliz aniversário do Bróxis, mostrada na Home no dia (ou até 3 dias depois).
// É vínculo, não meta: sem XP, sem comida, sem idade. Quem decide QUANDO mostrar é o hook
// useAniversario; aqui só a apresentação (mascote "supercontente", confete, vibração).
// Visual no mesmo padrão do CelebracaoSequenciaModal (fundo de raios + texto claro).
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackAniversario } from '../../../../shared/audio/feedback';
import type { MensagemAniversario } from '../utils/aniversario';
import type { RetrospectivaAno } from '../../metricas/utils/retrospectivaSlides';
import RetrospectivaSlides from './RetrospectivaSlides';

type Props = {
  visivel: boolean;
  mensagem: MensagemAniversario | null;
  /** "Seu ano com o Bróxis"; null = sem dados (o modal só mostra a mensagem e fecha) */
  retrospectiva?: RetrospectivaAno | null;
  onFechar: () => void;
};

export default function AniversarioModal({ visivel, mensagem, retrospectiva = null, onFechar }: Props) {
  const { width, height } = useWindowDimensions();
  const [reduzirMovimento, setReduzirMovimento] = useState(false);
  const [etapa, setEtapa] = useState<'mensagem' | 'retrospectiva'>('mensagem');

  const mascoteScale = useRef(new Animated.Value(0.6)).current;
  const mascoteOpacity = useRef(new Animated.Value(0)).current;
  const textoOpacity = useRef(new Animated.Value(0)).current;
  const textoTranslateY = useRef(new Animated.Value(16)).current;
  const botaoOpacity = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduzirMovimento)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!visivel) return;

    setEtapa('mensagem');
    mascoteScale.setValue(0.6);
    mascoteOpacity.setValue(0);
    textoOpacity.setValue(0);
    textoTranslateY.setValue(16);
    botaoOpacity.setValue(0);
    sparkleRotate.setValue(0);

    // jingle de festa + vibração de sucesso (o som respeita a preferência "sons ligados")
    feedbackAniversario();

    const entrada = Animated.sequence([
      Animated.parallel([
        Animated.timing(mascoteOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(mascoteScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textoOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(textoTranslateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(botaoOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]);
    entrada.start();

    const brilho = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleRotate, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sparkleRotate, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    if (!reduzirMovimento) brilho.start();

    return () => {
      entrada.stop();
      brilho.stop();
    };
  }, [visivel]);

  if (!visivel || !mensagem) return null;

  const giroSparkle = sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });

  return (
    <Modal visible={visivel} transparent animationType="fade" statusBarTranslucent onRequestClose={onFechar}>
      <View style={styles.container}>
        {/* fundo: mesma imagem de raios da celebração da sequência, preenchendo a tela inteira */}
        <View style={[StyleSheet.absoluteFill, styles.fundo]}>
          <Image
            source={require('../../../../../assets/img/celebracao/fundo-raios.png')}
            style={{ width, height, position: 'absolute' }}
            resizeMode="cover"
          />
        </View>

        {etapa === 'mensagem' || !retrospectiva ? (
        <View style={styles.conteudo}>
          <Animated.View
            style={[styles.mascoteArea, { opacity: mascoteOpacity, transform: [{ scale: mascoteScale }] }]}
            accessible
            accessibilityLabel="Bróxis comemorando"
          >
            <Animated.View style={[styles.sparkleTopLeft, { transform: [{ rotate: giroSparkle }] }]}>
              <Ionicons name="sparkles" size={24} color="#FFF3C4" />
            </Animated.View>
            <Animated.View style={[styles.sparkleBottomRight, { transform: [{ rotate: giroSparkle }] }]}>
              <Ionicons name="sparkles" size={18} color="#FFF3C4" />
            </Animated.View>
            <Image
              source={require('../../../../../assets/img/feedback/supercontente.png')}
              style={styles.mascoteImagem}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View style={{ opacity: textoOpacity, transform: [{ translateY: textoTranslateY }] }}>
            <AppText style={styles.titulo} accessibilityRole="header">
              {mensagem.titulo}
            </AppText>
            <AppText style={styles.corpo}>{mensagem.corpo}</AppText>
          </Animated.View>
        </View>
        ) : (
          // etapa 2: "Seu ano com o Bróxis", em slides (tem os próprios botões)
          <RetrospectivaSlides retrospectiva={retrospectiva} reduzirMovimento={reduzirMovimento} onFechar={onFechar} />
        )}

        {(etapa === 'mensagem' || !retrospectiva) && (
          <Animated.View style={[styles.botaoContainer, { opacity: botaoOpacity }]}>
            {retrospectiva ? (
              <AppButton label="Ver meu ano com o Bróxis" onPress={() => setEtapa('retrospectiva')} />
            ) : (
              <AppButton label="Valeu, Bróxis!" onPress={onFechar} />
            )}
          </Animated.View>
        )}

        {!reduzirMovimento && (
          <ConfettiCannon
            count={110}
            origin={{ x: width / 2, y: height * 0.32 }}
            autoStart
            fadeOut
            explosionSpeed={380}
            fallSpeed={2800}
            colors={[colors.primary, '#FFD54A', '#FFFFFF', '#E9578F', '#FFF3C4']}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 72,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  fundo: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  conteudo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascoteArea: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  mascoteImagem: {
    width: 190,
    height: 190,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 6,
    left: 0,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 10,
    right: 2,
  },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 10,
  },
  corpo: {
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  botaoContainer: {
    width: '100%',
  },
});
