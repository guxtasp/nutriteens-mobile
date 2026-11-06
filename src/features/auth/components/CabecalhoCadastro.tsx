// src/features/auth/components/CabecalhoCadastro.tsx
//
// Topo verde do cadastro em etapas: voltar, "Passo X de Y", barra de progresso,
// título/subtítulo e o mascote Bróxis da etapa.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { BackButton } from '../../../shared/ui/BackButton';
import { progressoDaEtapa } from '../utils/etapasCadastro';

interface CabecalhoCadastroProps {
  etapa: number;
  totalEtapas: number;
  titulo: string;
  subtitulo: string;
  mascote: ImageSourcePropType;
  onVoltar: () => void;
}

export function CabecalhoCadastro({
  etapa,
  totalEtapas,
  titulo,
  subtitulo,
  mascote,
  onVoltar,
}: CabecalhoCadastroProps) {
  const insets = useSafeAreaInsets();
  const progresso = useRef(new Animated.Value(progressoDaEtapa(etapa))).current;

  useEffect(() => {
    const anim = Animated.timing(progresso, {
      toValue: progressoDaEtapa(etapa),
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // anima width (não suportado no driver nativo)
    });
    anim.start();
    return () => anim.stop(); // limpeza no unmount
  }, [etapa, progresso]);

  const largura = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.topo, { paddingTop: insets.top + 16 }]}>
      <View style={styles.linhaTopo}>
        <BackButton onPress={onVoltar} style={styles.voltar} />
        <View style={styles.progressoBloco}>
          <AppText style={styles.passo}>
            Passo {etapa} de {totalEtapas}
          </AppText>
          <View
            style={styles.trilha}
            accessibilityRole="progressbar"
            accessibilityLabel={`Passo ${etapa} de ${totalEtapas}`}
            accessibilityValue={{ min: 0, max: totalEtapas, now: etapa }}
          >
            <Animated.View style={[styles.preenchimento, { width: largura }]} />
          </View>
        </View>
      </View>

      <View style={styles.linhaTitulo}>
        <View style={styles.textos}>
          <AppText style={styles.titulo} accessibilityRole="header">
            {titulo}
          </AppText>
          <AppText style={styles.subtitulo}>{subtitulo}</AppText>
        </View>
        <Image source={mascote} style={styles.mascote} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />
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
  linhaTopo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  voltar: { backgroundColor: 'rgba(255, 255, 255, 0.18)' },
  progressoBloco: { flex: 1 },
  passo: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    color: colors.textOnDarkMuted,
    marginBottom: 6,
  },
  trilha: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  preenchimento: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
  linhaTitulo: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 12 },
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
