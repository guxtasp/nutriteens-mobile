// src/features/adolescente/tour/TourTelaCheia.tsx
//
// Abertura e fim do tour: continuação visual das boas-vindas (BoasVindasModal) — degradê com
// bolhas, Bróxis em círculo com ondas, balão, cartão branco que sobe. No fim há confete.
// Respeita "reduzir movimento": tudo aparece pronto, sem loops nem confete.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AppButton } from '../../../shared/ui/AppButton';
import { AppText } from '../../../shared/ui/AppText';
import ChuvaDeConfete from '../../../shared/ui/ChuvaDeConfete';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import type { PassoTour } from './tourPassos';
import { feedbackCelebracao, feedbackLeve } from '../../../shared/audio/feedback';
import { tocarSom } from '../../../shared/audio/sons';
import { AVATARES_TOUR, modoImagem } from './tourAvatares';

type Props = {
  passo: PassoTour;
  variante: 'abertura' | 'fim';
  animar: boolean;
  ocupado: boolean;
  onPrimario: () => void;
  onSecundario: () => void;
};

const CORES_CONFETE = [colors.primary, '#FFD54A', '#E9578F', '#6ACAF0', '#FFFFFF', '#F5A623'] as const;

const BOLHAS = [
  { x: 0.08, tamanho: 46, duracao: 9000, atraso: 0 },
  { x: 0.3, tamanho: 22, duracao: 7000, atraso: 1500 },
  { x: 0.5, tamanho: 60, duracao: 11000, atraso: 600 },
  { x: 0.72, tamanho: 30, duracao: 8000, atraso: 2400 },
  { x: 0.92, tamanho: 48, duracao: 10000, atraso: 300 },
] as const;

function Bolha({ x, tamanho, duracao, atraso, altura, largura, animar }: (typeof BOLHAS)[number] & {
  altura: number;
  largura: number;
  animar: boolean;
}) {
  const progresso = useRef(new Animated.Value(animar ? 0 : 0.5)).current;
  useEffect(() => {
    if (!animar) return;
    const loop = Animated.loop(
      Animated.timing(progresso, { toValue: 1, duration: duracao, delay: atraso, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [animar, duracao, atraso, progresso]);
  const translateY = progresso.interpolate({ inputRange: [0, 1], outputRange: [altura + tamanho, -tamanho * 2] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x * largura - tamanho / 2,
        top: 0,
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        backgroundColor: 'rgba(255,255,255,0.10)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.18)',
        transform: [{ translateY }],
      }}
    />
  );
}

function Onda({ tamanho, defasagem, animar }: { tamanho: number; defasagem: number; animar: boolean }) {
  const progresso = useRef(new Animated.Value(animar ? 0 : 0.5)).current;
  useEffect(() => {
    if (!animar) return;
    const loop = Animated.loop(
      Animated.timing(progresso, { toValue: 1, duration: 2800, delay: defasagem, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [animar, defasagem, progresso]);
  const scale = progresso.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.35] });
  const opacity = progresso.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.4, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        backgroundColor: colors.primary,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export default function TourTelaCheia({ passo, variante, animar, ocupado, onPrimario, onSecundario }: Props) {
  const { width, height } = useWindowDimensions();
  const diametro = Math.min(height * 0.28, 220, width * 0.58);

  const broxisScale = useRef(new Animated.Value(animar ? 0.6 : 1)).current;
  const broxisOpacity = useRef(new Animated.Value(animar ? 0 : 1)).current;
  const giro = useRef(new Animated.Value(0)).current;
  const balaoScale = useRef(new Animated.Value(animar ? 0 : 1)).current;
  const cartaoY = useRef(new Animated.Value(animar ? 380 : 0)).current;
  const conteudo = useRef(new Animated.Value(animar ? 0 : 1)).current;
  const chips = useRef(Array.from({ length: 4 }, () => new Animated.Value(animar ? 0 : 1))).current;
  const botaoPulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animar) return;
    const pop = (v: Animated.Value) => Animated.spring(v, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true });
    const entrada = Animated.sequence([
      Animated.parallel([
        Animated.timing(broxisOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(broxisScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.spring(balaoScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      Animated.spring(cartaoY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(conteudo, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.stagger(110, chips.map(pop)),
    ]);
    entrada.start();

    const balanco = Animated.loop(
      Animated.sequence([
        Animated.timing(giro, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(giro, { toValue: -1, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    balanco.start();

    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(botaoPulso, { toValue: 1.04, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(botaoPulso, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => pulso.start(), 2400);

    return () => {
      entrada.stop();
      balanco.stop();
      pulso.stop();
      clearTimeout(t);
    };
  }, [animar, broxisOpacity, broxisScale, balaoScale, cartaoY, conteudo, chips, giro, botaoPulso]);

  // abertura: "pop" animado (a fanfarra das boas-vindas acabou de tocar); fim: comemoração
  useEffect(() => {
    if (variante === 'fim') {
      feedbackCelebracao();
    } else {
      tocarSom('tour');
      feedbackLeve();
    }
  }, [variante]);

  const rotate = giro.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });
  const modo = modoImagem(passo.avatar);
  const itens = passo.roteiro ?? [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0B2F25', colors.background, '#2A8A5B']} style={StyleSheet.absoluteFill} />
      {BOLHAS.map((b, i) => (
        <Bolha key={i} {...b} altura={height} largura={width} animar={animar} />
      ))}

      <View style={styles.palco}>
        <View style={{ width: diametro, height: diametro, alignItems: 'center', justifyContent: 'center' }}>
          <View style={styles.ondas} pointerEvents="none">
            <Onda tamanho={diametro * 1.3} defasagem={0} animar={animar} />
            <Onda tamanho={diametro * 1.3} defasagem={1400} animar={animar} />
          </View>

          <Animated.View
            accessible
            accessibilityLabel="Bróxis"
            style={{ opacity: broxisOpacity, transform: [{ scale: broxisScale }, { rotate }] }}
          >
            <View
              style={{
                width: diametro,
                height: diametro,
                borderRadius: diametro / 2,
                borderWidth: 5,
                borderColor: colors.white,
                backgroundColor: '#EAF6D9',
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={AVATARES_TOUR[passo.avatar]}
                style={modo === 'cover' ? { width: diametro, height: diametro } : { width: diametro * 0.86, height: diametro * 0.86 }}
                resizeMode={modo}
              />
            </View>
          </Animated.View>

          {!!passo.balao && (
            <Animated.View style={[styles.balao, { transform: [{ scale: balaoScale }, { rotate: '-5deg' }] }]}>
              <AppText style={styles.balaoTexto} numberOfLines={1}>
                {passo.balao}
              </AppText>
              <View style={styles.balaoCauda} />
            </Animated.View>
          )}
        </View>
      </View>

      <Animated.View style={[styles.cartao, { transform: [{ translateY: cartaoY }] }]}>
        <AppText style={styles.titulo} accessibilityRole="header">
          {passo.titulo}
        </AppText>

        <Animated.View style={{ opacity: conteudo }}>
          <AppText style={styles.corpo}>{passo.texto}</AppText>
        </Animated.View>

        {itens.length > 0 && (
          <View style={styles.chips}>
            {itens.map((item, i) => (
              <Animated.View
                key={item.rotulo}
                style={[
                  styles.chip,
                  { opacity: chips[i] ?? 1, transform: [{ scale: chips[i] ? chips[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) : 1 }] },
                ]}
              >
                <View style={styles.chipIcone}>
                  <Ionicons name={item.icone as keyof typeof Ionicons.glyphMap} size={18} color={colors.primaryDark} />
                </View>
                <AppText style={styles.chipTexto}>{item.rotulo}</AppText>
              </Animated.View>
            ))}
          </View>
        )}

        <Animated.View style={{ opacity: conteudo, transform: [{ scale: botaoPulso }] }}>
          <AppButton label={passo.rotuloPrincipal ?? 'Continuar'} onPress={onPrimario} disabled={ocupado} />
        </Animated.View>

        {!!passo.rotuloPular && (
          <AppText style={styles.pular} onPress={ocupado ? undefined : onSecundario} accessibilityRole="button">
            {passo.rotuloPular}
          </AppText>
        )}
      </Animated.View>

      {animar && variante === 'fim' && (
        <>
          <ChuvaDeConfete cores={CORES_CONFETE} />
          <ConfettiCannon count={70} origin={{ x: -10, y: height }} autoStart fadeOut explosionSpeed={520} fallSpeed={3000} colors={[...CORES_CONFETE]} />
          <ConfettiCannon count={70} origin={{ x: width + 10, y: height }} autoStart fadeOut explosionSpeed={520} fallSpeed={3000} colors={[...CORES_CONFETE]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  palco: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  ondas: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  balao: {
    position: 'absolute',
    top: -8,
    right: -42,
    maxWidth: 170,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  balaoTexto: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  balaoCauda: {
    position: 'absolute',
    left: 16,
    bottom: -7,
    width: 16,
    height: 16,
    backgroundColor: colors.white,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  cartao: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  titulo: { fontFamily: typography.bold, fontSize: 26, lineHeight: 32, color: colors.primaryDark, textAlign: 'center', marginBottom: 8 },
  corpo: { fontFamily: typography.regular, fontSize: 15, lineHeight: 21, color: colors.exercicioBorda, textAlign: 'center', marginBottom: 18 },
  chips: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  chip: { flex: 1, alignItems: 'center', backgroundColor: colors.exercicioAcertoFundo, borderRadius: 18, paddingVertical: 12 },
  chipIcone: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  chipTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  pular: { fontFamily: typography.semiBold, fontSize: 14, color: colors.placeholder, textAlign: 'center', paddingTop: 16, paddingBottom: 4 },
});
