// src/features/adolescente/home/components/PerdaSequenciaOverlay.tsx
//
// Animação de "perdeu a sequência", no mesmo espírito da
// CelebracaoSequenciaModal (fase "hero" com o foguinho sozinho, ganhando
// destaque e depois assentando) só que invertida: o foguinho verde vira
// vermelho, uma mensagem de perda aparece e o Bróxis triste é revelado por
// baixo.
//
// IMPORTANTE (bug corrigido): a versão anterior tentava animar a prop
// `color` do ícone passando um Animated.Value interpolado direto nela. O
// Animated do RN só sabe interpolar valores dentro de `style` — passado
// como prop solta, o Ionicons recebia o objeto do Animated.Value em vez de
// uma string de cor e quebrava ao simular a perda. A troca de cor agora é
// feita com DOIS ícones sobrepostos (um verde, um vermelho) cruzando a
// opacidade um do outro — só opacidade/escala, sem cor animada.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import BroxisTristeFormas from './BroxisTristeFormas';

export const DURACAO_MS = 3200;
const VERMELHO_PERDA = '#E14D4D';
const VERMELHO_PERDA_ESCURO = '#B23A3A';

type Props = {
  visivel: boolean;
  /** chamado no fim da animação — quem chama deve atualizar os números pra 0/reset por baixo do overlay */
  onFinalizado: () => void;
};

export default function PerdaSequenciaOverlay({ visivel, onFinalizado }: Props) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visivel) return;
    t.setValue(0);
    Animated.timing(t, {
      toValue: 1,
      duration: DURACAO_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true, // só opacidade/escala/translação agora — dá pra usar o driver nativo
    }).start(({ finished }) => {
      if (finished) onFinalizado();
    });
  }, [visivel]);

  if (!visivel) return null;

  // --- lavado vermelho cobrindo a tela inteira, entra rápido e some no fim ---
  const fundoOpacity = t.interpolate({
    inputRange: [0, 0.12, 0.85, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  // --- foguinho: cresce, "troca" de cor via crossfade (ver comentário no topo) ---
  const foguinhoEscala = t.interpolate({
    inputRange: [0, 0.15, 0.4, 0.6, 1],
    outputRange: [1, 1.6, 1.3, 1.15, 1.15],
  });
  const foguinhoVerdeOpacity = t.interpolate({
    inputRange: [0, 0.2, 0.35],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });
  const foguinhoVermelhoOpacity = t.interpolate({
    inputRange: [0.2, 0.35],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // --- círculo de destaque atrás do foguinho, mesmo princípio do heroGlow da celebração ---
  const circuloEscala = t.interpolate({
    inputRange: [0, 0.2, 0.5, 1],
    outputRange: [0.3, 1.6, 1.9, 1.9],
  });
  const circuloOpacity = t.interpolate({
    inputRange: [0, 0.15, 0.75, 0.9],
    outputRange: [0, 0.35, 0.35, 0],
    extrapolate: 'clamp',
  });

  // --- texto "Você perdeu a sequência!" ---
  const textoOpacity = t.interpolate({
    inputRange: [0, 0.4, 0.5, 0.7, 0.8],
    outputRange: [0, 0, 1, 1, 0],
    extrapolate: 'clamp',
  });
  const textoTranslateY = t.interpolate({
    inputRange: [0.4, 0.5],
    outputRange: [12, 0],
    extrapolate: 'clamp',
  });

  // --- Bróxis triste, revelado depois que o texto some ---
  const mascoteOpacity = t.interpolate({
    inputRange: [0, 0.72, 0.85],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });
  const mascoteEscala = t.interpolate({
    inputRange: [0.72, 0.9],
    outputRange: [0.7, 1],
    extrapolate: 'clamp',
  });
  const legendaOpacity = t.interpolate({
    inputRange: [0.85, 0.95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fundoOpacity }]}>
        <LinearGradient
          colors={[VERMELHO_PERDA, VERMELHO_PERDA_ESCURO]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.centro} pointerEvents="none">
        <Animated.View
          style={[
            styles.circuloDestaque,
            { opacity: circuloOpacity, transform: [{ scale: circuloEscala }] },
          ]}
        />

        {/* foguinho verde e vermelho sobrepostos — a troca de cor é um crossfade de opacidade */}
        <Animated.View style={{ transform: [{ scale: foguinhoEscala }] }}>
          <Animated.View style={{ opacity: foguinhoVerdeOpacity }}>
            <Ionicons name="flame" size={96} color={colors.primary} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: foguinhoVermelhoOpacity }]}>
            <Ionicons name="flame" size={96} color="#FF6B57" />
          </Animated.View>
        </Animated.View>

        <Animated.View style={{ opacity: textoOpacity, transform: [{ translateY: textoTranslateY }], marginTop: 24 }}>
          <AppText style={styles.textoPerdeu}>Você perdeu a sequência!</AppText>
        </Animated.View>

        <Animated.View
          style={[
            styles.mascoteBloco,
            { opacity: mascoteOpacity, transform: [{ scale: mascoteEscala }] },
          ]}
        >
          <BroxisTristeFormas size={120} />
          <Animated.View style={{ opacity: legendaOpacity, marginTop: 12, paddingHorizontal: 32 }}>
            <AppText style={styles.legenda}>
              Tudo bem! Comece uma nova sequência hoje mesmo.
            </AppText>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  circuloDestaque: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.white,
  },
  textoPerdeu: {
    fontFamily: typography.bold,
    fontSize: 20,
    color: colors.white,
    textAlign: 'center',
  },
  mascoteBloco: {
    position: 'absolute',
    alignItems: 'center',
  },
  legenda: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 19,
  },
});