// src/features/adolescente/home/components/CelebracaoSequenciaModal.tsx
//
// Tela de celebração exibida sempre que o "foguinho" é ativado (ver gate de
// uma-vez-por-dia em ../utils/celebracaoGate.ts, aplicado por quem chama
// este componente — HomeScreen). Conteúdo (headline/persuasão/botão/XP) vem
// de obterConteudoCelebracao, testável isoladamente.
//
// Sequência de entrada em duas fases:
//  1) "hero" — só o foguinho, centralizado na tela, sozinho: surge com
//     opacidade baixa, ganha destaque (fade+scale), dá um leve pulso e
//     minimiza até sumir.
//  2) revela a tela original (badge, número + rótulo fixo no lugar dele,
//     mascote, texto, semana e botão) — só depois que a fase 1 terminar.
import React, { useEffect, useMemo, useRef } from 'react';
import { Modal, View, Animated, Easing, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { IMAGENS_STATUS_DIA, DiaSemana } from '../types/statusDia';
import { obterConteudoCelebracao } from '../utils/celebracaoSequencia';
import { Dimensions } from 'react-native';

const CORES_STATUS_MANTIDO = new Set(['mantido', 'hoje_mantido']);
const ROSA_SEQUENCIA = '#E9578F';
const { width, height } = Dimensions.get('window');

type Props = {
  visivel: boolean;
  sequenciaAtual: number;
  dias: DiaSemana[];
  onFechar: () => void;
};

// Fundo agora é o PNG do sunburst (exportado do Figma) cobrindo a tela
// inteira com resizeMode="cover" — sem precisar medir layout (onLayout) nem
// desenhar raios em SVG: o Image se encarrega de preencher qualquer tamanho
// de tela sem sobrar faixa em branco, inclusive no Android.
function FundoRaiosDeSol() {
  return (
    <View style={[StyleSheet.absoluteFill, { 
      backgroundColor: colors.background,
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden' 
    }]}>
      <Image
        source={require('../../../../../assets/img/celebracao/fundo-raios.png')}
        style={{
          width: width,   // Tente usar 'tamanhoFundo' aqui se a imagem for um quadrado
          height: height, // Tente usar 'tamanhoFundo' aqui também
          position: 'absolute'
        }}
        resizeMode="cover" 
      />
    </View>
  );
}

export default function CelebracaoSequenciaModal({ visivel, sequenciaAtual, dias, onFechar }: Props) {
  const conteudo = useMemo(() => obterConteudoCelebracao(sequenciaAtual), [sequenciaAtual]);
  const rotuloDia = sequenciaAtual === 1 ? 'dia de sequência' : 'dias de sequência';

  // --- fase 1: foguinho "hero", sozinho no centro da tela ---
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.4)).current;

  // --- fase 2: resto da tela original (revelada só depois do hero) ---
  const conteudoOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const mascoteScale = useRef(new Animated.Value(0.7)).current;
  const textoOpacity = useRef(new Animated.Value(0)).current;
  const textoTranslateY = useRef(new Animated.Value(16)).current;
  const semanaOpacity = useRef(new Animated.Value(0)).current;
  const botaoOpacity = useRef(new Animated.Value(0)).current;
  const botaoTranslateY = useRef(new Animated.Value(16)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;
  // brilho pulsante atrás do foguinho pequeno (já no lugar dele) — sutil,
  // continua rodando em loop depois que a tela original é revelada
  const brilhoScale = useRef(new Animated.Value(1)).current;
  const brilhoOpacity = useRef(new Animated.Value(0.3)).current;
  const foguinhoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visivel) return;

    heroOpacity.setValue(0);
    heroScale.setValue(0.4);
    conteudoOpacity.setValue(0);
    badgeScale.setValue(0);
    mascoteScale.setValue(0.7);
    textoOpacity.setValue(0);
    textoTranslateY.setValue(16);
    semanaOpacity.setValue(0);
    botaoOpacity.setValue(0);
    botaoTranslateY.setValue(16);
    sparkleRotate.setValue(0);
    brilhoScale.setValue(1);
    brilhoOpacity.setValue(0.3);
    foguinhoScale.setValue(1);

    // 1. surge com opacidade baixa
    // 2. aumenta (fade + scale)
    // 3. leve destaque (pulse)
    // 4. minimiza até sumir rápido
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 0.5, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(heroScale, { toValue: 0.7, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(heroScale, { toValue: 1.3, duration: 380, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(heroScale, { toValue: 1.45, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(heroScale, { toValue: 1.25, duration: 150, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(heroOpacity, { toValue: 0, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(heroScale, { toValue: 0.5, duration: 220, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start(() => {
      // 5. retorna para a tela original — badge, "X dias de sequência"
      // (fixo no lugar dele), mascote, texto, semana e botão, revelados agora
      Animated.sequence([
        Animated.parallel([
          Animated.timing(conteudoOpacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.spring(badgeScale, { toValue: 1, friction: 6, tension: 100, useNativeDriver: true }),
          Animated.spring(mascoteScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(textoOpacity, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(textoTranslateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.timing(semanaOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(botaoOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(botaoTranslateY, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleRotate, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(sparkleRotate, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();

      // pulso do brilho + leve "respiração" do foguinho já no lugar dele —
      // roda em loop, discreto, só um destaque a mais (não é o hero de novo)
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(brilhoScale, { toValue: 1.35, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(brilhoOpacity, { toValue: 0.55, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(foguinhoScale, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(brilhoScale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(brilhoOpacity, { toValue: 0.3, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(foguinhoScale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ])
      ).start();
    });
  }, [visivel, sequenciaAtual]);

  if (!visivel) return null;

  const giroSparkle = sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '8deg'] });
  const heroGlowOpacity = heroOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  return (
    <Modal visible={visivel} transparent animationType="fade" statusBarTranslucent onRequestClose={onFechar}>
      <View style={styles.container}>
        <FundoRaiosDeSol />

        {/* --- fase 1: foguinho hero, sozinho e centralizado --- */}
        <View style={styles.heroContainer} pointerEvents="none">
          <Animated.View style={[styles.heroGlow, { opacity: heroGlowOpacity, transform: [{ scale: heroScale }] }]} />
          <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: heroScale }] }}>
            <Ionicons name="flame" size={96} color={colors.primary} />
          </Animated.View>
        </View>

        {/* --- fase 2: tela original --- */}
        <Animated.View style={[styles.conteudo, { opacity: conteudoOpacity }]}>
          {/* --- bloco do foguinho: XP em cima, ícone com brilho pulsante + número numa linha, rótulo (singular/plural) embaixo, sempre no mesmo lugar --- */}
          <View style={styles.blocoSequencia}>
            {conteudo.xpGanho > 0 && (
              <Animated.View style={[styles.badgeXp, { transform: [{ scale: badgeScale }] }]}>
                <AppText style={styles.badgeXpTexto}>+{conteudo.xpGanho} XP</AppText>
              </Animated.View>
            )}
            <View style={styles.linhaFoguinho}>
              <View style={styles.foguinhoWrap}>
                <Animated.View
                  style={[styles.brilhoFoguinho, { opacity: brilhoOpacity, transform: [{ scale: brilhoScale }] }]}
                  pointerEvents="none"
                />
                <Animated.View style={{ transform: [{ scale: foguinhoScale }] }}>
                  <Ionicons name="flame" size={54} color={colors.primary} />
                </Animated.View>
              </View>
              <AppText style={styles.numeroSequencia}>{sequenciaAtual}</AppText>
            </View>
            <AppText style={styles.rotuloSequencia}>{rotuloDia}</AppText>
          </View>

          {/* --- personagem: sem moldura/círculo, só a imagem com sparkles flutuando ao redor --- */}
          <Animated.View style={[styles.mascoteArea, { transform: [{ scale: mascoteScale }] }]}>
            <Animated.View style={[styles.sparkleTopLeft, { transform: [{ rotate: giroSparkle }] }]}>
              <Ionicons name="sparkles" size={20} color="#FFF3C4" />
            </Animated.View>
            <Animated.View style={[styles.sparkleBottomRight, { transform: [{ rotate: giroSparkle }] }]}>
              <Ionicons name="sparkles" size={15} color="#FFF3C4" />
            </Animated.View>
            <Image
              source={require('../../../../../assets/img/feedback/supercontente.png')}
              style={styles.mascoteImagem}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View style={{ opacity: textoOpacity, transform: [{ translateY: textoTranslateY }] }}>
            <AppText style={styles.elogio}>{conteudo.elogio}</AppText>
            <AppText style={styles.desafio}>{conteudo.desafio}</AppText>
          </Animated.View>

          {/* --- visualizador da semana: círculos maiores, contraste mais forte, dia atual com anel --- */}
          <Animated.View style={[styles.semanaLinha, { opacity: semanaOpacity }]}>
            {dias.map((dia) => {
              const mantido = CORES_STATUS_MANTIDO.has(dia.status);
              const ehHoje = dia.status === 'hoje_pendente' || dia.status === 'hoje_mantido';
              return (
                <View key={dia.data} style={styles.semanaColuna}>
                  <AppText style={[styles.semanaLabel, ehHoje && styles.semanaLabelHoje]}>
                    {dia.label.charAt(0)}
                  </AppText>
                  {mantido ? (
                    <View style={[styles.semanaCirculoMantido, ehHoje && styles.semanaCirculoHoje]}>
                      <Image
                        source={IMAGENS_STATUS_DIA[dia.status]}
                        style={styles.semanaImagem}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <View style={[styles.semanaCirculoVazio, ehHoje && styles.semanaCirculoHoje]} />
                  )}
                </View>
              );
            })}
          </Animated.View>

          <Animated.View style={{ opacity: semanaOpacity }}>
            <AppText style={styles.legenda}>
              Bom trabalho! Registre todo dia e mantenha a sequência para o autocuidado do Bróxis!
            </AppText>
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[styles.botaoContainer, { opacity: botaoOpacity, transform: [{ translateY: botaoTranslateY }] }]}
        >
          <AppButton label={conteudo.textoBotao} onPress={onFechar} />
        </Animated.View>
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
  heroContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
  },
  conteudo: {
    alignItems: 'center',
  },
  blocoSequencia: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeXp: {
    backgroundColor: '#FFF3C4',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeXpTexto: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: '#8A6D1A',
  },
  linhaFoguinho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foguinhoWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brilhoFoguinho: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
  },
  numeroSequencia: {
    fontFamily: typography.bold,
    fontSize: 52,
    color: colors.white,
    lineHeight: 58,
  },
  rotuloSequencia: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginTop: 2,
  },
  mascoteArea: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mascoteImagem: {
    width: 140,
    height: 140,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 4,
    left: 0,
  },
  sparkleBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 2,
  },
  elogio: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  desafio: {
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  semanaLinha: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  semanaColuna: {
    alignItems: 'center',
    gap: 6,
    width: 34,
  },
  semanaLabel: {
    fontFamily: typography.bold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  semanaLabelHoje: {
    color: colors.white,
  },
  semanaCirculoMantido: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ROSA_SEQUENCIA,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  semanaCirculoVazio: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  semanaCirculoHoje: {
    borderWidth: 2,
    borderColor: colors.white,
  },
  semanaImagem: {
    width: 36,
    height: 36,
  },
  legenda: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  botaoContainer: {
    width: '100%',
  },
});
