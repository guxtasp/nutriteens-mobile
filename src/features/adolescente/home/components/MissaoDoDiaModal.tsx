// src/features/adolescente/home/components/MissaoDoDiaModal.tsx
//
// Tela "Missão do dia": aparece uma vez por dia, na primeira abertura da Home (quem decide
// QUANDO é o hook useMissaoDoDiaTela; aqui só a apresentação), no mesmo espírito da celebração
// da sequência, mas apresentando o que a pessoa pode fazer HOJE em vez de comemorar o que já fez:
//  - fundo em degradê com bolhas, e o Bróxis incentivando com um balão "Bora?";
//  - um cartão de "ficha de missão": etiqueta + data, o emoji da missão num selo, título, descrição
//    e a recompensa em pontos (+ a sequência atual, quando existe, como motivo para não perdê-la);
//  - botão principal leva direto para onde a missão se cumpre; "Agora não" fecha.
// Sem confete: nada foi conquistado ainda. Respeita "reduzir movimento": sem loops.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import { ARTE_POSE } from '../../../../shared/ui/BroxisPose';
import { IconeMissao } from '../../../../shared/ui/IconeMissao';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackLeve, feedbackToque } from '../../../../shared/audio/feedback';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import type { MissaoDoDia } from '../services/missaoService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { respiroInferior, respiroSuperior } from '../../../../shared/utils/areaSegura';
import {
  montarConteudoMissaoTela,
  rotuloDataExtenso,
  textoSequenciaChip,
  type ConteudoMissaoTela,
} from '../utils/missaoDoDiaTela';

type Props = {
  visivel: boolean;
  missao: MissaoDoDia | null;
  /** dia local de hoje, AAAA-MM-DD */
  hojeISO: string | null;
  sequenciaAtual: number;
  /** o botão principal: recebe o conteúdo (com o destino) para a Home navegar */
  onAceitar: (conteudo: ConteudoMissaoTela) => void;
  onFechar: () => void;
};

const BOLHAS = [
  { x: 0.1, tamanho: 40, duracao: 9000, atraso: 0 },
  { x: 0.3, tamanho: 20, duracao: 7000, atraso: 1200 },
  { x: 0.52, tamanho: 58, duracao: 11000, atraso: 500 },
  { x: 0.74, tamanho: 28, duracao: 8000, atraso: 2200 },
  { x: 0.9, tamanho: 46, duracao: 10000, atraso: 300 },
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

export default function MissaoDoDiaModal({ visivel, missao, hojeISO, sequenciaAtual, onAceitar, onFechar }: Props) {
  // tela cheia por baixo das barras (edge-to-edge): topo e base somam as barras do sistema;
  // o tamanho do Bróxis e o palco dele continuam iguais
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduzir = useReduzirMovimento();
  const animar = !reduzir;

  const conteudo = useMemo(() => (missao ? montarConteudoMissaoTela(missao.tipo) : null), [missao]);
  const dataExtenso = useMemo(() => rotuloDataExtenso(hojeISO), [hojeISO]);
  const chipSequencia = textoSequenciaChip(sequenciaAtual);

  const broxisY = useRef(new Animated.Value(80)).current;
  const broxisOpacity = useRef(new Animated.Value(0)).current;
  const balaoScale = useRef(new Animated.Value(0)).current;
  const cartaoY = useRef(new Animated.Value(60)).current;
  const cartaoOpacity = useRef(new Animated.Value(0)).current;
  const seloScale = useRef(new Animated.Value(0)).current;
  const pontosScale = useRef(new Animated.Value(0)).current;
  const botoesOpacity = useRef(new Animated.Value(0)).current;
  const flutuar = useRef(new Animated.Value(0)).current;
  const botaoPulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visivel) return;

    if (reduzir) {
      broxisY.setValue(0);
      broxisOpacity.setValue(1);
      balaoScale.setValue(1);
      cartaoY.setValue(0);
      cartaoOpacity.setValue(1);
      seloScale.setValue(1);
      pontosScale.setValue(1);
      botoesOpacity.setValue(1);
      feedbackLeve();
      return;
    }

    broxisY.setValue(80);
    broxisOpacity.setValue(0);
    balaoScale.setValue(0);
    cartaoY.setValue(60);
    cartaoOpacity.setValue(0);
    seloScale.setValue(0);
    pontosScale.setValue(0);
    botoesOpacity.setValue(0);
    flutuar.setValue(0);
    botaoPulso.setValue(1);

    const mola = (v: Animated.Value, toValue: number, friction = 6, tension = 90) =>
      Animated.spring(v, { toValue, friction, tension, useNativeDriver: true });

    const entrada = Animated.sequence([
      Animated.parallel([
        Animated.timing(broxisOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        mola(broxisY, 0, 6, 70),
      ]),
      mola(balaoScale, 1, 4, 140),
      Animated.parallel([
        Animated.timing(cartaoOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        mola(cartaoY, 0, 8, 60),
      ]),
      mola(seloScale, 1, 4, 120),
      mola(pontosScale, 1, 5, 130),
      Animated.timing(botoesOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]);
    entrada.start();
    feedbackLeve();

    // o Bróxis flutua de leve; o botão principal "respira" chamando pro toque
    const flutuacao = Animated.loop(
      Animated.sequence([
        Animated.timing(flutuar, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(flutuar, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    flutuacao.start();
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(botaoPulso, { toValue: 1.04, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(botaoPulso, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const iniciarPulso = setTimeout(() => pulso.start(), 2200);

    return () => {
      entrada.stop();
      flutuacao.stop();
      pulso.stop();
      clearTimeout(iniciarPulso);
    };
  }, [visivel, reduzir]);

  if (!visivel || !missao || !conteudo) return null;

  const mascoteTamanho = Math.min(height * 0.22, 170);
  const sobe = flutuar.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <Modal visible={visivel} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onFechar}>
      <View style={styles.container}>
        <LinearGradient colors={['#0B2F25', colors.background, '#2A8A5B']} style={StyleSheet.absoluteFill} />
        {BOLHAS.map((b, i) => (
          <Bolha key={i} {...b} altura={height} largura={width} animar={animar} />
        ))}

        <View style={[styles.palco, { paddingTop: respiroSuperior(insets.top, 24), paddingBottom: respiroInferior(insets.bottom, 0) }]}>
          {/* Bróxis + balão */}
          <Animated.View
            style={{ opacity: broxisOpacity, transform: [{ translateY: Animated.add(broxisY, sobe) }] }}
            accessible
            accessibilityLabel="Bróxis incentivando"
          >
            <Image
              source={ARTE_POSE.determinado}
              style={{ width: mascoteTamanho, height: mascoteTamanho }}
              resizeMode="contain"
            />
            <Animated.View style={[styles.balao, { transform: [{ scale: balaoScale }, { rotate: '-5deg' }] }]}>
              <AppText style={styles.balaoTexto}>Bora?</AppText>
              <View style={styles.balaoCauda} />
            </Animated.View>
          </Animated.View>

          {/* ficha da missão */}
          <Animated.View style={[styles.cartao, { opacity: cartaoOpacity, transform: [{ translateY: cartaoY }] }]}>
            <View style={styles.cartaoTopo}>
              <View style={styles.etiqueta}>
                <Ionicons name="flag" size={12} color={colors.primaryDark} />
                <AppText style={styles.etiquetaTexto}>{conteudo.etiqueta}</AppText>
              </View>
              {!!dataExtenso && <AppText style={styles.data}>{dataExtenso}</AppText>}
            </View>

            <Animated.View style={[styles.selo, { transform: [{ scale: seloScale }] }]}>
              <View accessible={false}>
                <IconeMissao valor={missao.icone} tamanho={40} cor={colors.primaryDark} />
              </View>
            </Animated.View>

            <AppText style={styles.tituloGeral} accessibilityRole="header">
              {conteudo.titulo}
            </AppText>
            <AppText style={styles.titulo}>{missao.titulo}</AppText>
            <AppText style={styles.descricao}>{missao.descricao}</AppText>

            <Animated.View style={[styles.chips, { transform: [{ scale: pontosScale }] }]}>
              <View style={[styles.chip, styles.chipPontos]}>
                <Ionicons name="star" size={14} color="#B8770F" />
                <AppText style={styles.chipPontosTexto}>+{missao.pontosRecompensa} pontos</AppText>
              </View>
              {chipSequencia && (
                <View style={[styles.chip, styles.chipSequencia]}>
                  <Ionicons name="flame" size={14} color="#E9578F" />
                  <AppText style={styles.chipSequenciaTexto}>{chipSequencia}</AppText>
                </View>
              )}
            </Animated.View>

            <Animated.View style={{ opacity: botoesOpacity, marginTop: 20 }}>
              <Animated.View style={{ transform: [{ scale: botaoPulso }] }}>
                <AppButton
                  label={conteudo.rotuloPrincipal}
                  onPress={() => {
                    feedbackToque();
                    onAceitar(conteudo);
                  }}
                />
              </Animated.View>
              <Pressable
                onPress={() => {
                  feedbackToque();
                  onFechar();
                }}
                hitSlop={8}
                style={styles.secundario}
                accessibilityRole="button"
                accessibilityLabel={conteudo.rotuloSecundario}
              >
                <AppText style={styles.secundarioTexto}>{conteudo.rotuloSecundario}</AppText>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  palco: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  balao: {
    position: 'absolute',
    top: 4,
    right: -52,
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  balaoTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  balaoCauda: {
    position: 'absolute',
    left: 14,
    bottom: -6,
    width: 14,
    height: 14,
    backgroundColor: colors.white,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
  cartao: {
    alignSelf: 'stretch',
    maxWidth: 440,
    backgroundColor: colors.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    marginTop: 4,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etiqueta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  etiquetaTexto: { fontFamily: typography.bold, fontSize: 10, letterSpacing: 0.8, color: colors.primaryDark },
  data: { fontFamily: typography.semiBold, fontSize: 11, color: colors.exercicioBorda },
  selo: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.exercicioAcertoFundo,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 12,
  },
  tituloGeral: { fontFamily: typography.semiBold, fontSize: 13, color: colors.exercicioBorda, textAlign: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 22, lineHeight: 28, color: colors.primaryDark, textAlign: 'center', marginTop: 2 },
  descricao: {
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.exercicioBorda,
    textAlign: 'center',
    marginTop: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  chipPontos: { backgroundColor: '#FFF1CC' },
  chipPontosTexto: { fontFamily: typography.bold, fontSize: 13, color: '#8A5A0B' },
  chipSequencia: { backgroundColor: '#FDE6EF' },
  chipSequenciaTexto: { fontFamily: typography.bold, fontSize: 13, color: '#B3376A' },
  secundario: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16, marginTop: 4 },
  secundarioTexto: { fontFamily: typography.semiBold, fontSize: 14, color: colors.exercicioBorda },
});
