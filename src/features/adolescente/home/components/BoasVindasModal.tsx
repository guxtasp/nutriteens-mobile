// src/features/adolescente/home/components/BoasVindasModal.tsx
//
// Boas-vindas do PRIMEIRO acesso. Quem decide QUANDO mostrar é o hook useBoasVindas; aqui só
// a apresentação. Propositalmente diferente da celebração de sequência e do aniversário
// (que usam fundo de raios + mascote central + canhão de confete):
//  - fundo em degradê com bolhas flutuantes;
//  - o Bróxis "acolhedor" (rosto em círculo, grande) entra com mola, com ondas pulsando atrás e
//    um balão "Oi, {nome}!" encostado nele;
//  - confete em CHUVA contínua + dois canhões laterais, nos cantos de baixo;
//  - um cartão branco sobe e o título aparece palavra por palavra;
//  - três "passos" (missões, trilha, sequência) surgem em sequência e o botão pulsa de leve.
// Sem XP: é acolhimento, não meta. Respeita "reduzir movimento": sem loops nem confete.
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import ChuvaDeConfete from '../../../../shared/ui/ChuvaDeConfete';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackBoasVindas, feedbackLeve } from '../../../../shared/audio/feedback';
import type { MensagemBoasVindas } from '../utils/boasVindas';

type Props = {
  visivel: boolean;
  mensagem: MensagemBoasVindas | null;
  onFechar: () => void;
};

const CORES_CONFETE = [colors.primary, '#FFD54A', '#E9578F', '#6ACAF0', '#FFFFFF', '#F5A623'] as const;

// bolhas translúcidas que sobem devagar: posição (fração da largura), tamanho e ritmo fixos
const BOLHAS = [
  { x: 0.08, tamanho: 46, duracao: 9000, atraso: 0 },
  { x: 0.28, tamanho: 22, duracao: 7000, atraso: 1500 },
  { x: 0.46, tamanho: 64, duracao: 11000, atraso: 600 },
  { x: 0.66, tamanho: 30, duracao: 8000, atraso: 2400 },
  { x: 0.82, tamanho: 52, duracao: 10000, atraso: 300 },
  { x: 0.94, tamanho: 20, duracao: 6500, atraso: 1800 },
] as const;

function Bolha({ x, tamanho, duracao, atraso, altura, largura, animar }: (typeof BOLHAS)[number] & {
  altura: number;
  largura: number;
  animar: boolean;
}) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animar) return;
    const loop = Animated.loop(
      Animated.timing(progresso, {
        toValue: 1,
        duration: duracao,
        delay: atraso,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
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

/** Onda que nasce atrás do Bróxis, cresce e some; `defasagem` separa as duas ondas. */
function Onda({ tamanho, defasagem, animar }: { tamanho: number; defasagem: number; animar: boolean }) {
  const progresso = useRef(new Animated.Value(animar ? 0 : 0.5)).current;

  useEffect(() => {
    if (!animar) return;
    const loop = Animated.loop(
      Animated.timing(progresso, {
        toValue: 1,
        duration: 2800,
        delay: defasagem,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
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

export default function BoasVindasModal({ visivel, mensagem, onFechar }: Props) {
  const { width, height } = useWindowDimensions();
  // null = ainda não sabemos a preferência do sistema (a animação espera, pra não piscar)
  const [reduzirMovimento, setReduzirMovimento] = useState<boolean | null>(null);

  // o rosto do Bróxis é um círculo: um diâmetro só define o tamanho dele, das ondas e do balão
  const diametro = Math.min(height * 0.3, 230, width * 0.6);

  const palavras = useMemo(() => (mensagem ? mensagem.titulo.split(' ') : []), [mensagem]);

  const broxisY = useRef(new Animated.Value(120)).current;
  const broxisOpacity = useRef(new Animated.Value(0)).current;
  const broxisScale = useRef(new Animated.Value(0.8)).current;
  const acenoGiro = useRef(new Animated.Value(0)).current;
  const balaoScale = useRef(new Animated.Value(0)).current;
  const cartaoY = useRef(new Animated.Value(420)).current;
  const corpoOpacity = useRef(new Animated.Value(0)).current;
  const botaoOpacity = useRef(new Animated.Value(0)).current;
  const botaoPulso = useRef(new Animated.Value(1)).current;
  // uma "pop" por palavra do título e por passo (arrays de Animated.Value, criados uma vez)
  const palavraAnim = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const passoAnim = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduzirMovimento)
      .catch(() => setReduzirMovimento(false));
  }, []);

  useEffect(() => {
    if (!visivel || reduzirMovimento === null) return;

    const finalizados = () => {
      broxisY.setValue(0);
      broxisOpacity.setValue(1);
      broxisScale.setValue(1);
      balaoScale.setValue(1);
      cartaoY.setValue(0);
      corpoOpacity.setValue(1);
      botaoOpacity.setValue(1);
      palavraAnim.forEach((v) => v.setValue(1));
      passoAnim.forEach((v) => v.setValue(1));
    };

    feedbackBoasVindas();

    if (reduzirMovimento) {
      finalizados();
      return;
    }

    broxisY.setValue(120);
    broxisOpacity.setValue(0);
    broxisScale.setValue(0.8);
    acenoGiro.setValue(0);
    balaoScale.setValue(0);
    cartaoY.setValue(420);
    corpoOpacity.setValue(0);
    botaoOpacity.setValue(0);
    botaoPulso.setValue(1);
    palavraAnim.forEach((v) => v.setValue(0));
    passoAnim.forEach((v) => v.setValue(0));

    const pop = (v: Animated.Value) => Animated.spring(v, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true });

    const entrada = Animated.sequence([
      // 1) o Bróxis sobe de baixo, com mola
      Animated.parallel([
        Animated.timing(broxisOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(broxisY, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
        Animated.spring(broxisScale, { toValue: 1, friction: 6, tension: 70, useNativeDriver: true }),
      ]),
      // 2) o balão "Oi, {nome}!" estoura ao lado dele
      Animated.spring(balaoScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      // 3) o cartão branco sobe
      Animated.spring(cartaoY, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
      // 4) título, palavra por palavra
      Animated.stagger(
        90,
        palavraAnim.slice(0, Math.max(palavras.length, 1)).map(pop),
      ),
      Animated.timing(corpoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      // 5) passos, um de cada vez
      Animated.stagger(130, passoAnim.map(pop)),
      Animated.timing(botaoOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]);
    entrada.start();

    // o Bróxis balança de leve enquanto a tela estiver aberta
    const aceno = Animated.loop(
      Animated.sequence([
        Animated.timing(acenoGiro, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(acenoGiro, { toValue: -1, duration: 520, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    aceno.start();

    // botão com um respiro leve, chamando pro toque
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(botaoPulso, { toValue: 1.04, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(botaoPulso, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const iniciarPulso = setTimeout(() => pulso.start(), 2600);

    return () => {
      entrada.stop();
      aceno.stop();
      pulso.stop();
      clearTimeout(iniciarPulso);
    };
  }, [visivel, reduzirMovimento, palavras.length]);

  if (!visivel || !mensagem) return null;

  const animar = reduzirMovimento === false;
  const giro = acenoGiro.interpolate({ inputRange: [-1, 1], outputRange: ['-4deg', '4deg'] });

  return (
    <Modal visible={visivel} transparent animationType="fade" statusBarTranslucent onRequestClose={onFechar}>
      <View style={styles.container}>
        <LinearGradient colors={['#0B2F25', colors.background, '#2A8A5B']} style={StyleSheet.absoluteFill} />

        {BOLHAS.map((b, i) => (
          <Bolha key={i} {...b} altura={height} largura={width} animar={animar} />
        ))}

        {/* palco: ondas + Bróxis + balão encostado nele */}
        <View style={styles.palco}>
          <View style={{ width: diametro, height: diametro, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.ondas} pointerEvents="none">
              <Onda tamanho={diametro * 1.3} defasagem={0} animar={animar} />
              <Onda tamanho={diametro * 1.3} defasagem={1400} animar={animar} />
            </View>

            <Animated.View
              accessible
              accessibilityLabel="Bróxis dando oi"
              style={{
                opacity: broxisOpacity,
                transform: [{ translateY: broxisY }, { scale: broxisScale }, { rotate: giro }],
              }}
            >
              <Image
                source={require('../../../../../assets/img/feedback/acolhedor.png')}
                style={{ width: diametro, height: diametro, borderRadius: diametro / 2, borderWidth: 5, borderColor: colors.white }}
                resizeMode="cover"
              />
            </Animated.View>

            {/* o balão nasce na borda do círculo (canto superior direito), não solto na tela */}
            <Animated.View style={[styles.balao, { transform: [{ scale: balaoScale }, { rotate: '-5deg' }] }]}>
              <AppText style={styles.balaoTexto} numberOfLines={1}>
                {mensagem.saudacao}
              </AppText>
              <View style={styles.balaoCauda} />
            </Animated.View>
          </View>
        </View>

        {/* cartão branco */}
        <Animated.View style={[styles.cartao, { transform: [{ translateY: cartaoY }] }]}>
          <View style={styles.titulo} accessible accessibilityRole="header" accessibilityLabel={mensagem.titulo}>
            {palavras.map((palavra, i) => (
              <Animated.View
                key={i}
                style={{
                  opacity: palavraAnim[i] ?? 1,
                  transform: [
                    { scale: palavraAnim[i] ? palavraAnim[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) : 1 },
                    { translateY: palavraAnim[i] ? palavraAnim[i].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) : 0 },
                  ],
                }}
              >
                <AppText style={styles.tituloPalavra}>{palavra} </AppText>
              </Animated.View>
            ))}
          </View>

          <Animated.View style={{ opacity: corpoOpacity }}>
            <AppText style={styles.corpo}>{mensagem.corpo}</AppText>
          </Animated.View>

          <View style={styles.passos}>
            {mensagem.passos.map((passo, i) => (
              <Animated.View
                key={passo.titulo}
                style={[
                  styles.passo,
                  {
                    opacity: passoAnim[i],
                    transform: [{ scale: passoAnim[i].interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
                  },
                ]}
              >
                <View style={styles.passoIcone}>
                  <Ionicons name={passo.icone} size={20} color={colors.primaryDark} />
                </View>
                <AppText style={styles.passoTitulo}>{passo.titulo}</AppText>
                <AppText style={styles.passoLegenda}>{passo.legenda}</AppText>
              </Animated.View>
            ))}
          </View>

          <Animated.View style={{ opacity: botaoOpacity, transform: [{ scale: botaoPulso }] }}>
            <AppButton
              label={mensagem.textoBotao}
              onPress={() => {
                feedbackLeve();
                onFechar();
              }}
            />
          </Animated.View>
        </Animated.View>

        {animar && (
          <>
            <ChuvaDeConfete cores={CORES_CONFETE} />
            {/* dois canhões nos cantos de baixo, disparando pra cima e pro centro */}
            <ConfettiCannon
              count={70}
              origin={{ x: -10, y: height }}
              autoStart
              fadeOut
              explosionSpeed={520}
              fallSpeed={3000}
              colors={[...CORES_CONFETE]}
            />
            <ConfettiCannon
              count={70}
              origin={{ x: width + 10, y: height }}
              autoStart
              fadeOut
              explosionSpeed={520}
              fallSpeed={3000}
              colors={[...CORES_CONFETE]}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  palco: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  ondas: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  balaoTexto: {
    fontFamily: typography.bold,
    fontSize: 17,
    color: colors.primaryDark,
  },
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
  titulo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tituloPalavra: {
    fontFamily: typography.bold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  corpo: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.exercicioBorda,
    textAlign: 'center',
    marginBottom: 20,
  },
  passos: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  passo: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  passoIcone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  passoTitulo: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  passoLegenda: {
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 2,
  },
});
