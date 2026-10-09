import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { tocarSom } from '../../../../shared/audio/sons';
import { PROPORCAO_CARTA, alturaDaCarta, corDoPasso } from '../../cartas/data/cartasArte';
import { CartaArte } from '../../cartas/components/CartaArte';
import { rotuloPasso, type CartaGuia } from '../../cartas/utils/cartas';

type Props = {
  carta: CartaGuia;
  /** quantas recompensas ainda esperam depois desta */
  restantes: number;
  onContinuar: () => void;
  onVerAlbum: () => void;
  onPularTudo: () => void;
};

/** Brilho suave: centro na cor e borda totalmente transparente (nada de disco com borda dura). */
function LuzRadial({ tamanho, cor, id }: { tamanho: number; cor: string; id: string }) {
  return (
    <Svg width={tamanho} height={tamanho}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={cor} stopOpacity="1" />
          <Stop offset="0.4" stopColor={cor} stopOpacity="0.5" />
          <Stop offset="1" stopColor={cor} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

const ICONE_APP = require('../../../../../assets/img/mascot/icon.png');

/**
 * Celebração de CARTA NOVA. Roteiro (~2 s):
 *  1. a carta sobe de baixo com o VERSO virado (mistério);
 *  2. balança de leve;
 *  3. gira e revela a frente, com clarão na cor do passo, confete, som e vibração;
 *  4. um brilho diagonal passa pela arte e aparecem o passo e os botões.
 * É de propósito diferente da celebração de sequência (foguinho + raios) e da de
 * insígnia/conquista (medalha que "pula" com anéis).
 */
export function CartaGanhaModal({ carta, restantes, onContinuar, onVerAlbum, onPularTudo }: Props) {
  const { width, height } = useWindowDimensions();
  const cor = corDoPasso(carta.passo);

  const larguraCarta = Math.round(Math.min(width - 112, 280, height * 0.46 * PROPORCAO_CARTA * 1.35));
  const alturaCarta = alturaDaCarta(larguraCarta);
  const raio = Math.round(larguraCarta * 0.09);

  const fundo = useRef(new Animated.Value(0)).current;
  const entrada = useRef(new Animated.Value(0)).current;
  const tremor = useRef(new Animated.Value(0)).current;
  const giro = useRef(new Animated.Value(0)).current;
  const clarao = useRef(new Animated.Value(0)).current;
  const aura = useRef(new Animated.Value(0)).current;
  const brilho = useRef(new Animated.Value(0)).current;
  const textos = useRef(new Animated.Value(0)).current;
  const titulo = useRef(new Animated.Value(0)).current;

  const [revelada, setRevelada] = useState(false);
  const [reduzirMovimento, setReduzirMovimento] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelado = false;
    const depois = (ms: number, fn: () => void) => timers.push(setTimeout(() => !cancelado && fn(), ms));

    function revelarFinal() {
      setRevelada(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      tocarSom('conquista');
    }

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduzir) => {
        if (cancelado) return;

        // quem pediu menos movimento recebe o resultado direto, sem voo, giro nem confete
        if (reduzir) {
          setReduzirMovimento(true);
          [fundo, entrada, giro, aura, textos, titulo].forEach((v) => v.setValue(1));
          revelarFinal();
          return;
        }

        Animated.timing(fundo, { toValue: 1, duration: 220, useNativeDriver: true }).start();
        Animated.timing(titulo, { toValue: 1, duration: 360, delay: 120, useNativeDriver: true }).start();
        Animated.spring(entrada, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }).start();

        // balanço antes de virar
        depois(750, () => {
          Animated.sequence([
            Animated.timing(tremor, { toValue: 1, duration: 90, useNativeDriver: true }),
            Animated.timing(tremor, { toValue: -1, duration: 130, useNativeDriver: true }),
            Animated.timing(tremor, { toValue: 0.6, duration: 110, useNativeDriver: true }),
            Animated.timing(tremor, { toValue: -0.4, duration: 100, useNativeDriver: true }),
            Animated.timing(tremor, { toValue: 0, duration: 90, useNativeDriver: true }),
          ]).start();
        });

        // gira e revela
        depois(1250, () => {
          tocarSom('virar');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          Animated.timing(giro, {
            toValue: 1,
            duration: 560,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        });

        // clarão + confete no meio do giro
        depois(1500, () => {
          revelarFinal();
          Animated.timing(clarao, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
          Animated.timing(aura, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        });

        // brilho passa pela arte + aparecem passo e botões
        depois(1900, () => {
          Animated.timing(brilho, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();
          Animated.timing(textos, { toValue: 1, duration: 380, useNativeDriver: true }).start();
        });
      });

    return () => {
      cancelado = true;
      timers.forEach(clearTimeout);
    };
  }, [fundo, entrada, tremor, giro, clarao, aura, brilho, textos, titulo]);

  const subida = entrada.interpolate({ inputRange: [0, 1], outputRange: [height * 0.55, 0] });
  const escala = entrada.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const inclinacao = tremor.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });
  const rotacaoVerso = giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotacaoFrente = giro.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  // a carta "respira" um pouquinho no instante da virada
  const pulo = giro.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] });

  const tamanhoClarao = larguraCarta * 2.2;
  const tamanhoAura = larguraCarta * 1.7;
  const escalaClarao = clarao.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.25] });
  const opacidadeClarao = clarao.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0.9, 0] });
  const opacidadeAura = aura.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });
  const brilhoX = brilho.interpolate({ inputRange: [0, 1], outputRange: [-larguraCarta * 1.1, larguraCarta * 1.3] });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onContinuar}>
      <View style={styles.raiz}>
        <Animated.View style={[styles.fundo, { opacity: fundo }]} />

        <Animated.View style={[styles.cabecalho, { opacity: titulo }]}>
          <AppText style={styles.titulo}>Carta nova!</AppText>
        </Animated.View>

        <View style={[styles.palco, { width: larguraCarta, height: alturaCarta }]}>
          {/* clarão (explosão de luz na hora da virada) e aura (luz suave que fica) */}
          <Animated.View
            pointerEvents="none"
            style={[styles.luz, { opacity: opacidadeClarao, transform: [{ scale: escalaClarao }] }]}
          >
            <LuzRadial tamanho={tamanhoClarao} cor={cor.borda} id="clarao" />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.luz, { opacity: opacidadeAura }]}>
            <LuzRadial tamanho={tamanhoAura} cor={cor.borda} id="aura" />
          </Animated.View>

          <Animated.View
            style={{
              width: larguraCarta,
              height: alturaCarta,
              transform: [{ translateY: subida }, { scale: escala }, { rotate: inclinacao }, { scale: pulo }],
            }}
          >
            {/* VERSO (o que aparece primeiro) */}
            <Animated.View
              style={[
                styles.face,
                styles.verso,
                {
                  width: larguraCarta,
                  height: alturaCarta,
                  borderRadius: raio,
                  backgroundColor: cor.borda,
                  transform: [{ perspective: 1200 }, { rotateY: rotacaoVerso }],
                },
              ]}
            >
              <View style={[styles.versoMoldura, { borderRadius: raio * 0.7 }]}>
                <View style={[styles.versoMedalha, { width: larguraCarta * 0.5, height: larguraCarta * 0.5 }]}>
                  <Image source={ICONE_APP} style={styles.versoIcone} resizeMode="contain" />
                </View>
                <AppText style={styles.versoRotulo}>10 PASSOS</AppText>
              </View>
            </Animated.View>

            {/* FRENTE (a arte já é a carta completa) */}
            <Animated.View
              style={[
                styles.face,
                { width: larguraCarta, height: alturaCarta, transform: [{ perspective: 1200 }, { rotateY: rotacaoFrente }] },
              ]}
            >
              <CartaArte codigo={carta.codigo} passo={carta.passo} largura={larguraCarta} versao="cheia" />

              {/* brilho diagonal passando */}
              <View style={[StyleSheet.absoluteFill, { borderRadius: raio, overflow: 'hidden' }]} pointerEvents="none">
                <Animated.View style={[styles.brilho, { width: larguraCarta * 0.5, transform: [{ translateX: brilhoX }, { rotate: '18deg' }] }]}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.rodape, { opacity: textos, transform: [{ translateY: textos.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <AppText style={styles.passo}>{rotuloPasso(carta.passo)} desbloqueado</AppText>
          <AppText style={styles.nome}>{carta.titulo}</AppText>

          <View style={styles.botoes} pointerEvents={revelada ? 'auto' : 'none'}>
            <AppButton label="Ver no álbum" onPress={onVerAlbum} backgroundColor={colors.primary} textColor={colors.primaryDark} />
            <AppButton
              label={restantes > 0 ? `Próxima (+${restantes})` : 'Continuar'}
              onPress={onContinuar}
              outlineColor="#fff"
              shadowColor="rgba(255,255,255,0.45)"
              textColor="#fff"
            />
          </View>

          {restantes > 0 && (
            <Pressable onPress={onPularTudo} hitSlop={10} accessibilityRole="button" accessibilityLabel="Pular as outras recompensas">
              <AppText style={styles.pular}>Pular tudo</AppText>
            </Pressable>
          )}
        </Animated.View>

        {revelada && !reduzirMovimento && (
          <ConfettiCannon
            count={80}
            origin={{ x: width / 2, y: height * 0.4 }}
            autoStart
            fadeOut
            explosionSpeed={380}
            fallSpeed={2800}
            colors={[cor.borda, '#FFD54A', '#FFFFFF', cor.fundo, colors.primary]}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,24,18,0.92)' },
  cabecalho: { marginBottom: 22 },
  titulo: { fontSize: 30, fontFamily: typography.bold, color: '#fff', textAlign: 'center', letterSpacing: 0.4 },
  palco: { alignItems: 'center', justifyContent: 'center' },
  luz: { position: 'absolute' },
  face: { position: 'absolute', backfaceVisibility: 'hidden' },
  verso: { alignItems: 'center', justifyContent: 'center' },
  versoMoldura: {
    ...StyleSheet.absoluteFillObject,
    margin: 10,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  versoMedalha: {
    borderRadius: 999,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  versoIcone: { width: '100%', height: '100%' },
  versoRotulo: { fontSize: 13, fontFamily: typography.bold, color: '#fff', letterSpacing: 3 },
  brilho: { position: 'absolute', top: -40, bottom: -40 },
  rodape: { marginTop: 26, alignItems: 'center', paddingHorizontal: 32, width: '100%', gap: 4 },
  passo: { fontSize: 13, fontFamily: typography.bold, color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' },
  nome: { fontSize: 20, fontFamily: typography.bold, color: '#fff', textAlign: 'center' },
  botoes: { alignSelf: 'stretch', marginTop: 16, gap: 10 },
  pular: { marginTop: 14, fontSize: 13, fontFamily: typography.semiBold, color: colors.textOnDarkMuted, textDecorationLine: 'underline' },
});
