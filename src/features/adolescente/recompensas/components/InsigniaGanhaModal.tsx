import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { tocarSom } from '../../../../shared/audio/sons';
import type { Insignia } from '../../perfil/services/gamificacaoService';
import { ARTE_INSIGNIAS, EMOJI_PLACEHOLDER } from '../../perfil/data/insigniasArte';
import { tituloRecompensaInsignia } from '../utils/recompensas';

type Props = {
  insignia: Insignia;
  restantes: number;
  onContinuar: () => void;
  onVerPerfil: () => void;
  onPularTudo: () => void;
};

const TAMANHO = 150;
const QTD_ESTRELAS = 8;
const ANEIS = [0, 260, 520];

/**
 * Celebração de INSÍGNIA / MARCO / CONQUISTA. A medalha "pula" para dentro da tela (escala
 * com ricochete + meia volta), anéis de onda se espalham e estrelinhas piscam em volta.
 * Não gira como a carta e não tem confete, pra cada tipo de prêmio ter a sua cara.
 */
export function InsigniaGanhaModal({ insignia, restantes, onContinuar, onVerPerfil, onPularTudo }: Props) {
  const { width } = useWindowDimensions();
  const marco = insignia.categoria === 'marco';
  const ehInsignia = insignia.categoria === 'insignia';
  const destaque = ehInsignia || marco ? colors.warning : colors.primary;

  const fundo = useRef(new Animated.Value(0)).current;
  const medalha = useRef(new Animated.Value(0)).current;
  const textos = useRef(new Animated.Value(0)).current;
  const aneis = useRef(ANEIS.map(() => new Animated.Value(0))).current;
  const estrelas = useRef(Array.from({ length: QTD_ESTRELAS }, () => new Animated.Value(0))).current;

  useEffect(() => {
    let cancelado = false;
    const animacoes: Animated.CompositeAnimation[] = [];
    const timer: ReturnType<typeof setTimeout>[] = [];

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduzir) => {
        if (cancelado) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        tocarSom('conquista');

        if (reduzir) {
          [fundo, medalha, textos].forEach((v) => v.setValue(1));
          return;
        }

        Animated.timing(fundo, { toValue: 1, duration: 220, useNativeDriver: true }).start();

        // medalha: pula pra dentro, com ricochete
        Animated.spring(medalha, { toValue: 1, friction: 4, tension: 70, delay: 180, useNativeDriver: true } as Animated.SpringAnimationConfig).start();

        // anéis de onda, em sequência escalonada
        aneis.forEach((valor, i) => {
          const a = Animated.timing(valor, {
            toValue: 1,
            duration: 1500,
            delay: 380 + ANEIS[i],
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          });
          animacoes.push(a);
          a.start();
        });

        // estrelinhas: piscam em loop, cada uma no seu tempo
        estrelas.forEach((valor, i) => {
          const loop = Animated.loop(
            Animated.sequence([
              Animated.timing(valor, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
              Animated.timing(valor, { toValue: 0.15, duration: 700, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ]),
          );
          animacoes.push(loop);
          timer.push(setTimeout(() => !cancelado && loop.start(), 500 + i * 130));
        });

        timer.push(
          setTimeout(() => {
            if (!cancelado) Animated.timing(textos, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          }, 700),
        );
      });

    return () => {
      cancelado = true;
      timer.forEach(clearTimeout);
      animacoes.forEach((a) => a.stop());
    };
  }, [fundo, medalha, textos, aneis, estrelas]);

  const escala = medalha.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const giro = medalha.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] });

  // posições das estrelinhas em volta da medalha (raio alternando perto/longe)
  const posicoes = useMemo(
    () =>
      Array.from({ length: QTD_ESTRELAS }, (_, i) => {
        const ang = (i / QTD_ESTRELAS) * Math.PI * 2 - Math.PI / 2;
        const raio = TAMANHO * (i % 2 === 0 ? 0.82 : 1.0);
        return { x: Math.cos(ang) * raio, y: Math.sin(ang) * raio, tam: i % 2 === 0 ? 20 : 14 };
      }),
    [],
  );

  const arte = insignia.codigo ? ARTE_INSIGNIAS[insignia.codigo] : null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onContinuar}>
      <View style={styles.raiz}>
        <Animated.View style={[styles.fundo, { opacity: fundo }]} />

        <Animated.View style={[styles.cabecalho, { opacity: textos }]}>
          <AppText style={[styles.titulo, { color: destaque }]}>{tituloRecompensaInsignia(insignia.categoria)}</AppText>
        </Animated.View>

        <View style={[styles.palco, { width: Math.min(width, 360), height: TAMANHO * 2.4 }]}>
          {aneis.map((valor, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.anel,
                {
                  borderColor: destaque,
                  opacity: valor.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.7, 0] }),
                  transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.7, 2.4] }) }],
                },
              ]}
            />
          ))}

          {posicoes.map((p, i) => (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.estrela,
                {
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { scale: estrelas[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                  ],
                  opacity: estrelas[i],
                },
              ]}
            >
              <Ionicons name={i % 2 === 0 ? 'star' : 'sparkles'} size={p.tam} color={i % 3 === 0 ? '#fff' : destaque} />
            </Animated.View>
          ))}

          <Animated.View style={{ transform: [{ scale: escala }, { rotate: giro }] }}>
            {ehInsignia ? (
              <View style={styles.molduraInsignia}>
                {arte ? (
                  <Image source={arte} style={styles.arteInsignia} resizeMode="contain" />
                ) : (
                  // sem arte cadastrada ainda: medalhão grande com o emoji (o placeholder da grade é pequeno demais aqui)
                  <View style={styles.semArte}>
                    <AppText style={styles.semArteEmoji}>{(insignia.codigo && EMOJI_PLACEHOLDER[insignia.codigo]) || '🏅'}</AppText>
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.circulo, marco ? styles.circuloMarco : styles.circuloConquista]}>
                <Ionicons
                  name={(insignia.icone ?? 'ribbon') as keyof typeof Ionicons.glyphMap}
                  size={marco ? 76 : 70}
                  color={marco ? colors.warningShadow : colors.primaryDark}
                />
                {marco && insignia.valor != null && (
                  <View style={styles.faixa}>
                    <AppText style={styles.faixaTexto}>{insignia.valor}</AppText>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </View>

        <Animated.View style={[styles.rodape, { opacity: textos, transform: [{ translateY: textos.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          <AppText style={styles.nome}>{insignia.nome}</AppText>
          {!!insignia.descricao && <AppText style={styles.descricao}>{insignia.descricao}</AppText>}

          <View style={styles.botoes}>
            <AppButton label="Ver no perfil" onPress={onVerPerfil} backgroundColor={destaque} textColor={colors.primaryDark} shadowColor={ehInsignia || marco ? colors.warningShadow : colors.primaryShadow} />
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8, 30, 4, 0.88)' },
  cabecalho: { marginBottom: 4 },
  titulo: { fontSize: 24, fontFamily: typography.bold, textAlign: 'center', letterSpacing: 0.4 },
  palco: { alignItems: 'center', justifyContent: 'center' },
  anel: { position: 'absolute', width: TAMANHO, height: TAMANHO, borderRadius: TAMANHO / 2, borderWidth: 4 },
  estrela: { position: 'absolute' },
  circulo: { width: TAMANHO, height: TAMANHO, borderRadius: TAMANHO / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 6 },
  circuloConquista: { backgroundColor: colors.exercicioAcertoFundo, borderColor: colors.primary },
  circuloMarco: { backgroundColor: '#FFF4D6', borderColor: colors.warning },
  faixa: {
    position: 'absolute',
    bottom: -14,
    minWidth: 56,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: colors.warning,
    alignItems: 'center',
  },
  faixaTexto: { fontSize: 20, fontFamily: typography.bold, color: '#fff' },
  molduraInsignia: {
    width: TAMANHO,
    height: TAMANHO + 18,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: colors.warning,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  semArte: { width: TAMANHO - 34, height: TAMANHO - 8, borderRadius: 28, backgroundColor: '#FFF4D6', alignItems: 'center', justifyContent: 'center' },
  semArteEmoji: { fontSize: 78 },
  arteInsignia: { width: TAMANHO - 30, height: TAMANHO - 4 },
  rodape: { alignItems: 'center', paddingHorizontal: 32, width: '100%', gap: 6 },
  nome: { fontSize: 22, fontFamily: typography.bold, color: '#fff', textAlign: 'center' },
  descricao: { fontSize: 14, lineHeight: 20, fontFamily: typography.regular, color: colors.textOnDarkMuted, textAlign: 'center' },
  botoes: { alignSelf: 'stretch', marginTop: 16, gap: 10 },
  pular: { marginTop: 14, fontSize: 13, fontFamily: typography.semiBold, color: colors.textOnDarkMuted, textDecorationLine: 'underline' },
});
