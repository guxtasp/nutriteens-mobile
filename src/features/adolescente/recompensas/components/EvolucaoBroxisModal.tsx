// src/features/adolescente/recompensas/components/EvolucaoBroxisModal.tsx
//
// Celebração de EVOLUÇÃO do Broxis (subiu de fase por XP). É a maior comemoração do app,
// então tem uma "cena" em três atos, como evolução de jogo:
//   1. suspense: o Broxis da fase anterior aparece e treme cada vez mais rápido, com a aura
//      crescendo ("Ué... tem alguma coisa acontecendo");
//   2. clarão: a tela fica branca por um instante e, por trás do branco, a arte troca;
//   3. revelação: o Broxis novo pula para a tela, com um halo dourado "respirando",
//      estrelinhas piscando, confete, vibração e fanfarra. Entram o selo da fase, o título,
//      a trilha das fases (✓ nas que passaram, a nova em destaque, a próxima como silhueta),
//      o nome, uma frase curta e a próxima meta.
// Layout pensado para Android: respeita a área segura (barra de status e de navegação/gestos)
// e encolhe o palco do Broxis em telas baixas, pra nada sobrepor os botões.
// Com "reduzir movimento" ligado, pula direto para o ato 3 sem tremer, piscar nem confete.
// Só usa Animated com driver nativo (como os outros modais de recompensa).
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from '../../../../shared/audio/haptics';
import { tocarSom } from '../../../../shared/audio/sons';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { ARTE_FASE, FRASE_EVOLUCAO } from '../../perfil/data/broxisFasesArte';
import type { FaseMascote } from '../../perfil/utils/fasesMascote';

type Props = {
  fase: FaseMascote;
  anterior: FaseMascote | null;
  proxima: FaseMascote | null;
  trilha: FaseMascote[];
  posicao: number;
  total: number;
  restantes: number;
  onContinuar: () => void;
  onVerPerfil: () => void;
  onPularTudo: () => void;
};

/** fundo da cena: verde do app no centro, escurecendo para as bordas */
const FUNDO_CENTRO = colors.primaryDark;
const FUNDO_BORDA = '#0B2219';
const DOURADO = '#FFD54A';

/** tremidas do suspense: cada uma mais curta (mais rápida) e mais forte que a anterior */
const TREMIDAS = [
  { ms: 220, graus: 3 },
  { ms: 190, graus: 4 },
  { ms: 160, graus: 5 },
  { ms: 130, graus: 6 },
  { ms: 110, graus: 7 },
  { ms: 90, graus: 8 },
  { ms: 75, graus: 9 },
  { ms: 65, graus: 10 },
  { ms: 55, graus: 10 },
  { ms: 55, graus: 10 },
];
/** estrelinhas em volta do Broxis: posição em % do palco, tamanho e atraso */
const ESTRELAS = [
  { x: 0.08, y: 0.2, tam: 16 },
  { x: 0.86, y: 0.12, tam: 12 },
  { x: 0.93, y: 0.56, tam: 16 },
  { x: 0.03, y: 0.62, tam: 12 },
  { x: 0.74, y: 0.86, tam: 14 },
  { x: 0.2, y: 0.88, tam: 11 },
  { x: 0.5, y: 0.0, tam: 12 },
];
const CORES_CONFETE = [colors.primary, DOURADO, '#FFFFFF', '#6ACAF0', '#FFF3C4'];

/**
 * Espaço que sobra para o Broxis, conforme a altura útil da tela. O resto (selo, título,
 * trilha, textos, botões) tem altura quase fixa; quem cede em tela baixa é o palco.
 */
function tamanhoPalco(alturaUtil: number): number {
  const ocupadoPeloResto = 430;
  return Math.max(130, Math.min(230, alturaUtil - ocupadoPeloResto));
}

export function EvolucaoBroxisModal({
  fase,
  anterior,
  proxima,
  trilha,
  posicao,
  total,
  restantes,
  onContinuar,
  onVerPerfil,
  onPularTudo,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const alturaUtil = height - insets.top - insets.bottom;
  const palco = tamanhoPalco(alturaUtil);
  const compacto = alturaUtil < 640;

  // sem fase anterior (não deveria acontecer), começa direto na revelação
  const [revelado, setRevelado] = useState(!anterior);
  const [confete, setConfete] = useState(false);

  const fundo = useRef(new Animated.Value(0)).current;
  const entrada = useRef(new Animated.Value(0)).current; // Broxis antigo aparecendo
  const tremor = useRef(new Animated.Value(0)).current; // -10..10 graus
  const aura = useRef(new Animated.Value(0)).current; // cresce no suspense
  const clarao = useRef(new Animated.Value(0)).current;
  const novo = useRef(new Animated.Value(0)).current; // Broxis novo pulando
  const halo = useRef(new Animated.Value(0)).current; // respiração do halo dourado
  const estrelas = useRef(ESTRELAS.map(() => new Animated.Value(0))).current;
  const topo = useRef(new Animated.Value(0)).current;
  const trilhaAnim = useRef(new Animated.Value(0)).current;
  const noAtual = useRef(new Animated.Value(0)).current;
  const rodape = useRef(new Animated.Value(0)).current;
  const flutuar = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: Animated.CompositeAnimation[] = [];
    const depois = (ms: number, fn: () => void) => timers.push(setTimeout(() => !cancelado && fn(), ms));
    const loop = (a: Animated.CompositeAnimation) => {
      const l = Animated.loop(a);
      loops.push(l);
      return l;
    };

    const revelar = (comMovimento: boolean) => {
      setRevelado(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      tocarSom('fanfarra');
      if (!comMovimento) {
        [novo, topo, trilhaAnim, noAtual, rodape, halo].forEach((v) => v.setValue(1));
        return;
      }
      setConfete(true);
      Animated.spring(novo, { toValue: 1, friction: 3.2, tension: 90, useNativeDriver: true }).start();

      // halo dourado respirando + estrelinhas piscando, cada uma no seu tempo
      loop(
        Animated.sequence([
          Animated.timing(halo, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(halo, { toValue: 0.4, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
      estrelas.forEach((v, i) => {
        const l = loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.delay(900),
          ]),
        );
        depois(200 + i * 310, () => l.start());
      });

      // textos entram em cascata: selo/título com quique, trilha, a bolinha nova "pulsa", rodapé
      depois(300, () => Animated.spring(topo, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start());
      depois(500, () => Animated.timing(trilhaAnim, { toValue: 1, duration: 380, useNativeDriver: true }).start());
      depois(750, () => Animated.spring(noAtual, { toValue: 1, friction: 3.5, tension: 120, useNativeDriver: true }).start());
      depois(650, () => Animated.spring(rodape, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start());
      depois(900, () =>
        loop(
          Animated.sequence([
            Animated.timing(flutuar, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(flutuar, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ]),
        ).start(),
      );
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduzir) => {
        if (cancelado) return;
        if (reduzir || !anterior) {
          fundo.setValue(1);
          revelar(false);
          return;
        }

        // ato 1: suspense
        Animated.timing(fundo, { toValue: 1, duration: 260, useNativeDriver: true }).start();
        Animated.spring(entrada, { toValue: 1, friction: 6, tension: 60, delay: 150, useNativeDriver: true }).start();
        tocarSom('estrela');

        const tremidas = Animated.sequence(
          TREMIDAS.flatMap(({ ms, graus }) => [
            Animated.timing(tremor, { toValue: graus, duration: ms / 2, useNativeDriver: true }),
            Animated.timing(tremor, { toValue: -graus, duration: ms / 2, useNativeDriver: true }),
          ]).concat(Animated.timing(tremor, { toValue: 0, duration: 60, useNativeDriver: true })),
        );
        const duracaoTremor = TREMIDAS.reduce((t, x) => t + x.ms, 0) + 60;
        depois(900, () => {
          tremidas.start();
          Animated.timing(aura, { toValue: 1, duration: duracaoTremor, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
          // vibração acompanhando a tremedeira, cada vez mais perto
          let t = 0;
          TREMIDAS.forEach(({ ms }, i) => {
            t += ms;
            if (i % 2 === 1) depois(t, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}));
          });
        });

        // ato 2: clarão (a arte troca enquanto a tela está branca)
        depois(900 + duracaoTremor, () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
          Animated.timing(clarao, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
            if (cancelado) return;
            revelar(true);
            Animated.timing(clarao, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
          });
        });
      });

    return () => {
      cancelado = true;
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, [anterior, fundo, entrada, tremor, aura, clarao, novo, halo, estrelas, topo, trilhaAnim, noAtual, rodape, flutuar]);

  const ultimaFase = posicao === total;
  const selo = ultimaFase ? 'FASE MÁXIMA' : `NOVA FASE · ${posicao} DE ${total}`;
  const meta = proxima ? `Próxima: ${proxima.titulo} em ${proxima.xpMinimo.toLocaleString('pt-BR')} XP` : 'Você chegou ao topo!';
  const arte = palco * 0.9;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onContinuar}>
      <View style={styles.raiz}>
        {/* fundo em gradiente radial (verde do app no centro, mais escuro nas bordas) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fundo }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="fundoEvolucao" cx="50%" cy="38%" rx="75%" ry="60%">
                <Stop offset="0" stopColor={FUNDO_CENTRO} />
                <Stop offset="0.45" stopColor={FUNDO_CENTRO} />
                <Stop offset="1" stopColor={FUNDO_BORDA} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#fundoEvolucao)" />
          </Svg>
        </Animated.View>

        <View
          style={[styles.conteudo, { paddingTop: insets.top + (compacto ? 12 : 24), paddingBottom: insets.bottom + (compacto ? 10 : 18) }]}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={revelado ? `Você evoluiu! Agora seu mascote é o ${fase.titulo}.` : 'Seu mascote está evoluindo'}
        >
          {/* topo: suspense, depois selo + título */}
          <View style={[styles.topo, compacto && styles.topoCompacto]}>
            {revelado ? (
              <Animated.View
                style={{
                  alignItems: 'center',
                  opacity: topo,
                  transform: [
                    { translateY: topo.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
                    { scale: topo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                }}
              >
                <View style={styles.selo}>
                  {ultimaFase && <Ionicons name="star" size={11} color={colors.primaryDark} />}
                  <AppText style={styles.seloTexto}>{selo}</AppText>
                </View>
                <AppText style={[styles.titulo, compacto && styles.tituloCompacto]}>Você evoluiu!</AppText>
              </Animated.View>
            ) : (
              <Animated.View style={{ opacity: entrada }}>
                <AppText style={styles.suspense}>Ué... tem alguma coisa acontecendo</AppText>
              </Animated.View>
            )}
          </View>

          {/* palco do Broxis: encolhe em tela baixa */}
          <View style={{ width: palco + 40, height: palco, alignItems: 'center', justifyContent: 'center' }}>
            {/* aura do suspense */}
            {!revelado && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.aura,
                  {
                    width: palco,
                    height: palco,
                    borderRadius: palco / 2,
                    opacity: aura.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.9] }),
                    transform: [{ scale: aura.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.25] }) }],
                  },
                ]}
              />
            )}

            {/* halo dourado + estrelinhas (só depois da revelação) */}
            {revelado && (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
                    transform: [{ scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] }) }],
                  }}
                >
                  <Svg width={palco * 1.15} height={palco * 1.15}>
                    <Defs>
                      <RadialGradient id="haloEvolucao" cx="50%" cy="50%" r="50%">
                        <Stop offset="0" stopColor={DOURADO} stopOpacity={0.32} />
                        <Stop offset="1" stopColor={DOURADO} stopOpacity={0} />
                      </RadialGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill="url(#haloEvolucao)" />
                  </Svg>
                </Animated.View>
                {ESTRELAS.map((e, i) => (
                  <Animated.View
                    key={i}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: e.x * (palco + 40) - e.tam / 2,
                      top: e.y * palco - e.tam / 2,
                      opacity: estrelas[i],
                      transform: [{ scale: estrelas[i].interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
                    }}
                  >
                    <Ionicons name="sparkles" size={e.tam} color={DOURADO} />
                  </Animated.View>
                ))}
              </>
            )}

            {revelado ? (
              <Animated.View
                style={{
                  transform: [
                    { translateY: flutuar.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                    { scale: novo.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) },
                  ],
                }}
              >
                <Image source={ARTE_FASE[fase.fase]} style={{ width: arte, height: arte }} resizeMode="contain" accessibilityIgnoresInvertColors />
              </Animated.View>
            ) : (
              anterior && (
                <Animated.View
                  style={{
                    opacity: entrada,
                    transform: [
                      { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
                      { rotate: tremor.interpolate({ inputRange: [-10, 10], outputRange: ['-10deg', '10deg'] }) },
                    ],
                  }}
                >
                  <Image source={ARTE_FASE[anterior.fase]} style={{ width: arte, height: arte }} resizeMode="contain" accessibilityIgnoresInvertColors />
                </Animated.View>
              )
            )}
          </View>

          {/* trilha das fases */}
          <Animated.View
            style={[
              styles.trilha,
              { opacity: trilhaAnim, transform: [{ translateY: trilhaAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
            ]}
            accessible
            accessibilityLabel={`Fase ${posicao} de ${total}`}
          >
            {trilha.map((f, i) => {
              const iAtual = posicao - 1;
              const feito = i < iAtual;
              const atual = i === iAtual;
              const tam = atual ? (compacto ? 48 : 56) : compacto ? 38 : 44;
              const no = (
                <View
                  style={[
                    styles.no,
                    { width: tam, height: tam, borderRadius: tam / 2 },
                    feito && styles.noFeito,
                    atual && styles.noAtual,
                    !feito && !atual && styles.noTrancado,
                  ]}
                >
                  <Image
                    source={ARTE_FASE[f.fase]}
                    style={[{ width: tam - 8, height: tam - 8 }, !feito && !atual && styles.silhueta]}
                    resizeMode="contain"
                  />
                  {feito && (
                    <View style={styles.ok}>
                      <Ionicons name="checkmark" size={11} color={colors.primaryDark} />
                    </View>
                  )}
                </View>
              );
              return (
                <React.Fragment key={f.fase}>
                  {i > 0 && <View style={[styles.linha, i <= iAtual && styles.linhaCheia]} />}
                  {atual ? (
                    <Animated.View style={{ transform: [{ scale: noAtual.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }}>
                      {no}
                    </Animated.View>
                  ) : (
                    no
                  )}
                </React.Fragment>
              );
            })}
          </Animated.View>

          {/* nome, frase, meta e botões */}
          <Animated.View
            style={[
              styles.rodape,
              { opacity: rodape, transform: [{ translateY: rodape.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] },
            ]}
            pointerEvents={revelado ? 'auto' : 'none'}
          >
            <AppText style={styles.nome}>
              Agora ele é o <AppText style={styles.nomeDestaque}>{fase.titulo}</AppText>
            </AppText>
            <AppText style={styles.frase}>{FRASE_EVOLUCAO[fase.fase]}</AppText>
            <View style={styles.meta}>
              <AppText style={styles.metaTexto}>{meta}</AppText>
            </View>

            <View style={[styles.botoes, compacto && { marginTop: 10 }]}>
              <AppButton
                label="Ver meu Broxis"
                onPress={onVerPerfil}
                backgroundColor={colors.warning}
                textColor={colors.primaryDark}
                shadowColor={colors.warningShadow}
              />
              <Pressable
                onPress={onContinuar}
                style={styles.continuar}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={restantes > 0 ? `Próxima recompensa, mais ${restantes}` : 'Continuar'}
              >
                <AppText style={styles.continuarTexto}>{restantes > 0 ? `Próxima (+${restantes})` : 'Continuar'}</AppText>
              </Pressable>
              {restantes > 0 && (
                <Pressable onPress={onPularTudo} hitSlop={10} accessibilityRole="button" accessibilityLabel="Pular as outras recompensas">
                  <AppText style={styles.pular}>Pular tudo</AppText>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </View>

        {confete && (
          <ConfettiCannon
            count={110}
            origin={{ x: width / 2, y: insets.top + height * 0.3 }}
            autoStart
            fadeOut
            explosionSpeed={400}
            fallSpeed={3000}
            colors={CORES_CONFETE}
          />
        )}

        {/* clarão branco: cobre a troca da arte */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clarao, { opacity: clarao }]} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: 'transparent' },
  conteudo: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22 },
  clarao: { backgroundColor: '#FFFFFF' },
  topo: { minHeight: 82, justifyContent: 'flex-end', alignItems: 'center' },
  topoCompacto: { minHeight: 66 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    shadowColor: colors.warningShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  seloTexto: { fontSize: 11, letterSpacing: 1.5, fontFamily: typography.bold, color: colors.primaryDark },
  titulo: { fontSize: 32, lineHeight: 38, fontFamily: typography.bold, color: '#FFFFFF', textAlign: 'center' },
  tituloCompacto: { fontSize: 27, lineHeight: 32 },
  suspense: { fontSize: 17, fontFamily: typography.semiBold, color: colors.textOnDarkMuted, textAlign: 'center' },
  aura: { position: 'absolute', backgroundColor: 'rgba(176, 232, 110, 0.35)' },
  trilha: { flexDirection: 'row', alignItems: 'center' },
  no: { alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  noFeito: { backgroundColor: colors.exercicioAcertoFundo, borderColor: colors.primary },
  noAtual: { backgroundColor: '#FFF4D6', borderColor: colors.warning, borderWidth: 3 },
  noTrancado: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.25)' },
  silhueta: { tintColor: 'rgba(0,0,0,0.45)' },
  ok: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha: { width: 26, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  linhaCheia: { backgroundColor: colors.primary },
  rodape: { alignSelf: 'stretch', alignItems: 'center' },
  nome: { fontSize: 14, fontFamily: typography.semiBold, color: '#CFE6D5', textAlign: 'center' },
  nomeDestaque: { fontSize: 22, fontFamily: typography.bold, color: DOURADO },
  frase: { fontSize: 13, lineHeight: 19, fontFamily: typography.regular, color: '#E2EFE6', textAlign: 'center', marginTop: 2, maxWidth: 280 },
  meta: { marginTop: 8, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  metaTexto: { fontSize: 11, fontFamily: typography.semiBold, color: colors.exercicioAcertoFundo },
  botoes: { alignSelf: 'stretch', marginTop: 16, alignItems: 'stretch' },
  continuar: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  continuarTexto: { fontSize: 15, fontFamily: typography.bold, color: '#FFFFFF', textDecorationLine: 'underline' },
  pular: { fontSize: 13, fontFamily: typography.semiBold, color: colors.textOnDarkMuted, textDecorationLine: 'underline', textAlign: 'center' },
});
