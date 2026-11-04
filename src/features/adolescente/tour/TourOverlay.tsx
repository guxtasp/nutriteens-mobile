// src/features/adolescente/tour/TourOverlay.tsx
//
// Camada do tour: um Modal transparente com 3 modos.
//  - cheia:  passo sem alvo (abertura/fim) -> TourTelaCheia
//  - spot:   tela escurecida com um buraco no alvo (que "escorrega" de um alvo ao outro),
//            anel pulsando e cartão com o Bróxis, progresso e texto digitado
//  - centro: o alvo não apareceu mas o passo tem plano B -> mesmo cartão, no meio, sem buraco
// As medidas chegam em coordenadas da JANELA; aqui descontamos a origem do próprio overlay
// (no Android edge-to-edge o Modal nem sempre começa em 0,0).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { useTypewriter } from '../../../shared/hooks/useTyperwriter';
import { feedbackSelecao } from '../../../shared/audio/feedback';
import { tocarSom } from '../../../shared/audio/sons';
import type { PassoTour } from './tourPassos';
import { caminhoSpotlight, escolherLado, inflar, misturar, type Retangulo } from './tourGeometria';
import { AVATARES_TOUR, modoImagem } from './tourAvatares';
import TourTelaCheia from './TourTelaCheia';

type Props = {
  visivel: boolean;
  passo: PassoTour;
  rect: Retangulo | null;
  numero: number;
  total: number;
  variante: 'abertura' | 'fim';
  podeVoltar: boolean;
  /** true enquanto o próximo passo está sendo preparado: botões ignoram toques */
  ocupado: boolean;
  onProximo: () => void;
  onVoltar: () => void;
  onPular: () => void;
};

const COR_ESCURO = 'rgba(8,28,22,0.78)';
const MARGEM_ALVO = 8;
const RAIO_ALVO = 16;
const GAP_CARTAO = 18;
const LARGURA_AVATAR = 52;

export default function TourOverlay(props: Props) {
  const { visivel, passo, variante, ocupado, onProximo, onPular } = props;
  // null = ainda não sabemos a preferência do sistema
  const [reduzir, setReduzir] = useState<boolean | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduzir)
      .catch(() => setReduzir(false));
  }, []);

  if (!visivel) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onPular}>
      {!passo.alvo ? (
        <TourTelaCheia
          key={passo.id}
          passo={passo}
          variante={variante}
          animar={reduzir === false}
          ocupado={ocupado}
          onPrimario={onProximo}
          onSecundario={onPular}
        />
      ) : (
        <Destaque {...props} reduzir={reduzir !== false} />
      )}
    </Modal>
  );
}

function Destaque({ passo, rect, numero, total, podeVoltar, ocupado, onProximo, onVoltar, onPular, reduzir }: Props & { reduzir: boolean }) {
  const raiz = useRef<View>(null);
  const [tela, setTela] = useState({ largura: 0, altura: 0 });
  const [origem, setOrigem] = useState({ x: 0, y: 0 });

  const medirOrigem = () => raiz.current?.measureInWindow((x, y) => setOrigem({ x, y }));

  // alvo já no sistema de coordenadas do overlay, com folga em volta e dentro da tela
  const alvo = useMemo(() => {
    if (!rect || tela.largura === 0) return null;
    return inflar(
      { x: rect.x - origem.x, y: rect.y - origem.y, largura: rect.largura, altura: rect.altura },
      MARGEM_ALVO,
      tela,
    );
  }, [rect, origem, tela]);

  // --- buraco que escorrega do alvo antigo para o novo ---
  const [atual, setAtual] = useState<Retangulo | null>(alvo);
  const atualRef = useRef<Retangulo | null>(alvo);
  const progresso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const de = atualRef.current;
    const guardar = (r: Retangulo | null) => {
      atualRef.current = r;
      setAtual(r);
    };
    if (reduzir || !de || !alvo) {
      guardar(alvo);
      return;
    }
    progresso.setValue(0);
    const id = progresso.addListener(({ value }) => guardar(misturar(de, alvo, value)));
    const anim = Animated.timing(progresso, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    anim.start(({ finished }) => {
      if (finished) guardar(alvo);
    });
    return () => {
      anim.stop();
      progresso.removeListener(id);
    };
  }, [alvo, reduzir, progresso]);

  // --- anel pulsando ---
  const pulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduzir) return;
    const loop = Animated.loop(Animated.timing(pulso, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduzir, pulso]);

  // --- entrada do cartão a cada passo + pulinho do avatar ---
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;
  const pulinho = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    entrada.setValue(0);
    const a = Animated.spring(entrada, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [passo.id, reduzir, entrada]);
  useEffect(() => {
    if (reduzir) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulinho, { toValue: -5, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulinho, { toValue: 0, duration: 450, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(500),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduzir, pulinho]);

  // som e vibração leves a cada cartão novo (independe de "reduzir movimento")
  useEffect(() => {
    tocarSom('tour');
    feedbackSelecao();
  }, [passo.id]);

  // --- texto digitado (toque no texto mostra tudo) ---
  const { displayedText, skipToEnd } = useTypewriter(passo.texto, { speedMs: 16, startDelayMs: 220 });
  const textoVisivel = reduzir ? passo.texto : displayedText;

  const modo = passo.alvo && alvo ? 'spot' : 'centro';
  const lado = alvo ? escolherLado(alvo, tela.altura) : 'abaixo';
  const caminho = caminhoSpotlight(tela, atual, RAIO_ALVO);
  const ultimoSpot = numero >= total;
  const progressoPct = total > 0 ? Math.min(1, numero / total) : 0;

  const posCartao =
    modo === 'centro'
      ? { top: 0, bottom: 0, justifyContent: 'center' as const }
      : lado === 'abaixo'
        ? { top: (alvo?.y ?? 0) + (alvo?.altura ?? 0) + GAP_CARTAO }
        : { bottom: tela.altura - (alvo?.y ?? 0) + GAP_CARTAO };

  // setinha do cartão apontando para o centro do alvo
  const setaX = alvo ? Math.min(Math.max(alvo.x + alvo.largura / 2 - 8, 28), Math.max(28, tela.largura - 32 - 28)) : 0;

  const modoImg = modoImagem(passo.avatar);
  const ringEscala = pulso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const ringOpacidade = pulso.interpolate({ inputRange: [0, 1], outputRange: [0.95, 0] });

  return (
    <View
      ref={raiz}
      style={StyleSheet.absoluteFill}
      collapsable={false}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setTela({ largura: width, altura: height });
        medirOrigem();
      }}
    >
      {/* escurecido (com buraco no alvo); também engole toques para não vazarem para a tela de trás */}
      <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true}>
        {tela.largura > 0 && (
          <Svg width={tela.largura} height={tela.altura} pointerEvents="none">
            <Path d={caminho} fill={COR_ESCURO} fillRule="evenodd" />
          </Svg>
        )}
      </View>

      {atual && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: atual.x - 3, top: atual.y - 3, width: atual.largura + 6, height: atual.altura + 6 }}
        >
          <Animated.View
            style={{
              flex: 1,
              borderWidth: 3,
              borderColor: colors.primary,
              borderRadius: RAIO_ALVO + 3,
              opacity: reduzir ? 0.9 : ringOpacidade,
              transform: [{ scale: reduzir ? 1 : ringEscala }],
            }}
          />
        </View>
      )}

      <View pointerEvents="box-none" style={[styles.posicao, posCartao]}>
        <Animated.View
          style={[
            styles.cartao,
            {
              opacity: entrada,
              transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [lado === 'abaixo' ? 14 : -14, 0] }) }],
            },
          ]}
        >
          {modo === 'spot' && <View style={[styles.seta, lado === 'abaixo' ? { top: -8 } : { bottom: -8 }, { left: setaX }]} />}

          <View style={styles.topo}>
            <Animated.View style={[styles.avatar, { transform: [{ translateY: pulinho }] }]}>
              <Image
                source={AVATARES_TOUR[passo.avatar]}
                style={modoImg === 'cover' ? styles.avatarImgCover : styles.avatarImg}
                resizeMode={modoImg}
              />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.contador}>
                {numero} DE {total}
              </AppText>
              <AppText style={styles.titulo} accessibilityRole="header">
                {passo.titulo}
              </AppText>
            </View>
          </View>

          <View style={styles.trilhaProgresso} accessibilityElementsHidden importantForAccessibility="no">
            <View style={[styles.preenchido, { width: `${progressoPct * 100}%` }]} />
          </View>

          {/* o texto completo fica invisível só para reservar a altura: o cartão não "cresce" enquanto digita */}
          <View>
            <AppText style={[styles.texto, { opacity: 0 }]} accessibilityElementsHidden importantForAccessibility="no">
              {passo.texto}
            </AppText>
            <AppText style={[styles.texto, StyleSheet.absoluteFill]} onPress={skipToEnd} accessibilityLabel={passo.texto}>
              {textoVisivel}
            </AppText>
          </View>

          <View style={styles.rodape}>
            <AppText style={styles.pular} onPress={onPular} accessibilityRole="button" suppressHighlighting>
              Pular tour
            </AppText>
            <View style={styles.acoes}>
              {podeVoltar && (
                <AppText style={styles.voltar} onPress={ocupado ? undefined : onVoltar} accessibilityRole="button" suppressHighlighting>
                  Voltar
                </AppText>
              )}
              <AppText
                style={[styles.botao, ocupado && { opacity: 0.6 }]}
                onPress={ocupado ? undefined : onProximo}
                accessibilityRole="button"
                suppressHighlighting
              >
                {passo.rotuloPrincipal ?? (ultimoSpot ? 'Terminar' : 'Próximo')}
              </AppText>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  posicao: { position: 'absolute', left: 16, right: 16 },
  cartao: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  seta: { position: 'absolute', width: 16, height: 16, borderRadius: 3, backgroundColor: colors.white, transform: [{ rotate: '45deg' }] },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar: {
    width: LARGURA_AVATAR,
    height: LARGURA_AVATAR,
    borderRadius: LARGURA_AVATAR / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#EAF6D9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: LARGURA_AVATAR - 8, height: LARGURA_AVATAR - 8 },
  avatarImgCover: { width: LARGURA_AVATAR, height: LARGURA_AVATAR },
  contador: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 0.8, color: colors.primaryShadow },
  titulo: { fontFamily: typography.bold, fontSize: 20, lineHeight: 24, color: colors.primaryDark },
  trilhaProgresso: { height: 6, borderRadius: 3, backgroundColor: colors.exercicioAcertoFundo, overflow: 'hidden', marginBottom: 12 },
  preenchido: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  texto: { fontFamily: typography.regular, fontSize: 15, lineHeight: 21, color: colors.exercicioBorda },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pular: { fontFamily: typography.semiBold, fontSize: 14, color: colors.placeholder, paddingVertical: 10, paddingRight: 8 },
  voltar: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark, paddingVertical: 10 },
  botao: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.primaryDark,
    backgroundColor: colors.primary,
    borderRadius: 12,
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryShadow,
    paddingHorizontal: 22,
    paddingVertical: 10,
    overflow: 'hidden',
  },
});
