// src/features/auth/components/CabecalhoAuth.tsx
//
// Topo verde arredondado das telas de acesso (Login, Esqueci senha, Redefinir senha):
// mesma identidade do cadastro — voltar, título, subtítulo e o mascote Bróxis, que entra
// com um pulinho. Respeita "reduzir movimento" do aparelho (aí só aparece).
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { BackButton } from '../../../shared/ui/BackButton';

interface CabecalhoAuthProps {
  titulo: string;
  subtitulo?: string;
  mascote: ImageSourcePropType;
  /** sem onVoltar não mostra o botão (ex.: Redefinir senha) */
  onVoltar?: () => void;
}

export function CabecalhoAuth({ titulo, subtitulo, mascote, onVoltar }: CabecalhoAuthProps) {
  const insets = useSafeAreaInsets();
  const pulo = useRef(new Animated.Value(0)).current;
  const [reduzirMovimento, setReduzirMovimento] = useState(false);

  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => ativo && setReduzirMovimento(v))
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (reduzirMovimento) {
      pulo.setValue(1);
      return;
    }
    pulo.setValue(0);
    const anim = Animated.spring(pulo, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [reduzirMovimento, pulo]);

  return (
    <View style={[styles.topo, { paddingTop: insets.top + 16 }]}>
      {onVoltar ? <BackButton onPress={onVoltar} style={styles.voltar} /> : null}

      <View style={[styles.linhaTitulo, !onVoltar && styles.semVoltar]}>
        <View style={styles.textos}>
          <AppText style={styles.titulo} accessibilityRole="header">
            {titulo}
          </AppText>
          {subtitulo ? <AppText style={styles.subtitulo}>{subtitulo}</AppText> : null}
        </View>
        <Animated.Image
          source={mascote}
          style={[
            styles.mascote,
            {
              opacity: pulo.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
              transform: [
                { scale: pulo.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                { rotate: pulo.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '0deg'] }) },
              ],
            },
          ]}
          resizeMode="contain"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topo: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  voltar: { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 12 },
  semVoltar: { marginTop: 0 },
  textos: { flex: 1 },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 26,
    lineHeight: 34,
    color: colors.white,
    marginBottom: 6,
  },
  subtitulo: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.textOnDarkMuted,
  },
  mascote: { width: 96, height: 96 },
});
