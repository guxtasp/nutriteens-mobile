// src/features/adolescente/trocas/components/CartaTroca.tsx
//
// Carta do baralho de trocas: frente (a ideia) e verso ("Por que essa troca?"). Vira com rotateY
// em 400 ms; com "reduzir movimento" é só um crossfade. A face escondida sai da árvore de
// acessibilidade e não recebe toque.
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { iconeDoDestino } from '../utils/iconesTrocas';
import { CONTEXTO_CATEGORIA, noLugarDe, rotulosNutrientes, type Troca } from '../utils/trocas';
import { Bloco } from './TrocaDetalheSheet';

const DURACAO_GIRO_MS = 400;

type Props = { troca: Troca; virada: boolean; onVirar: () => void; reduzirMovimento: boolean };

function BotaoVirar({ rotulo, onPress }: { rotulo: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.virar} accessibilityRole="button" accessibilityLabel={rotulo}>
      <MaterialCommunityIcons name="rotate-3d-variant" size={16} color={colors.destaqueTexto} />
      <AppText style={styles.virarTexto}>{rotulo}</AppText>
    </Pressable>
  );
}

export default function CartaTroca({ troca, virada, onVirar, reduzirMovimento }: Props) {
  const progresso = useSharedValue(virada ? 1 : 0);
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    progresso.value = withTiming(virada ? 1 : 0, { duration: reduzirMovimento ? 200 : DURACAO_GIRO_MS });
  }, [virada, reduzirMovimento, progresso]);

  const estiloFrente = useAnimatedStyle(() =>
    reduzirMovimento
      ? { opacity: 1 - progresso.value, transform: [] }
      : {
          opacity: progresso.value < 0.5 ? 1 : 0,
          transform: [{ perspective: 1000 }, { rotateY: `${180 * progresso.value}deg` }],
        },
  );
  const estiloVerso = useAnimatedStyle(() =>
    reduzirMovimento
      ? { opacity: progresso.value, transform: [] }
      : {
          opacity: progresso.value >= 0.5 ? 1 : 0,
          transform: [{ perspective: 1000 }, { rotateY: `${180 * progresso.value + 180}deg` }],
        },
  );

  const chips = [...rotulosNutrientes(troca.nutrientes).map((n) => `fonte de ${n}`), ...(troca.rapida ? ['rápido de levar'] : [])];
  // tela baixa: o círculo encolhe para o nome e a frase caberem
  const circulo = altura > 0 ? Math.max(96, Math.min(150, altura * 0.3)) : 150;

  return (
    <View style={styles.area} onLayout={(e) => setAltura(e.nativeEvent.layout.height)}>
      <Animated.View
        style={[styles.face, estiloFrente]}
        pointerEvents={virada ? 'none' : 'auto'}
        importantForAccessibility={virada ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={virada}
      >
        <View style={styles.seloLugar}>
          <AppText style={styles.seloLugarTexto}>{noLugarDe(troca.categoria).toUpperCase()}</AppText>
        </View>
        <View style={styles.frenteCentro}>
          <View style={[styles.circulo, { width: circulo, height: circulo, borderRadius: circulo / 2 }]}>
            <MaterialCommunityIcons name={iconeDoDestino(troca.destinoNome) as any} size={circulo * 0.46} color={colors.primaryDark} />
          </View>
          <AppText style={styles.nome} accessibilityRole="header">
            {troca.destinoNome}
          </AppText>
          <AppText style={styles.frase} numberOfLines={4}>
            {troca.frase}
          </AppText>
          {chips.length > 0 && (
            <View style={styles.chips}>
              {chips.map((c) => (
                <View key={c} style={styles.chip}>
                  <AppText style={styles.chipTexto}>{c}</AppText>
                </View>
              ))}
            </View>
          )}
        </View>
        <BotaoVirar rotulo="Por que essa troca?" onPress={onVirar} />
      </Animated.View>

      <Animated.View
        style={[styles.face, styles.verso, estiloVerso]}
        pointerEvents={virada ? 'auto' : 'none'}
        importantForAccessibility={virada ? 'auto' : 'no-hide-descendants'}
        accessibilityElementsHidden={!virada}
      >
        <View style={styles.versoTopo}>
          <View style={styles.versoIcone}>
            <MaterialCommunityIcons name={iconeDoDestino(troca.destinoNome) as any} size={22} color={colors.primaryDark} />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.seloVerso}>{noLugarDe(troca.categoria).toUpperCase()}</AppText>
            <AppText style={styles.nomeVerso}>{troca.destinoNome}</AppText>
          </View>
        </View>
        <ScrollView style={styles.flex} contentContainerStyle={styles.blocos} showsVerticalScrollIndicator={false}>
          <Bloco icone="swap-horizontal" titulo="O que muda" texto={CONTEXTO_CATEGORIA[troca.categoria]} />
          <Bloco icone="heart-outline" titulo="O que você ganha" texto={troca.frase} />
          {!!troca.dica && <Bloco icone="lightbulb-on-outline" titulo="Dica pra fazer" texto={troca.dica} destaque />}
        </ScrollView>
        <BotaoVirar rotulo="Virar de volta" onPress={onVirar} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  area: { flex: 1 },
  face: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.bordaSuave,
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    // "sombra" sólida verde-clara embaixo, feita com borda (igual nos dois sistemas, como o relevo dos botões)
    borderBottomWidth: 6,
    borderBottomColor: colors.exercicioAcertoFundo,
  },
  verso: { alignItems: 'stretch', paddingHorizontal: 20, gap: 10 },
  seloLugar: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pilhaCartaClara,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seloLugarTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 0.9, color: colors.destaqueTexto },
  frenteCentro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch' },
  circulo: { backgroundColor: colors.exercicioAcertoFundo, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  nome: { fontFamily: typography.bold, fontSize: 28, lineHeight: 33, color: colors.primaryDark, textAlign: 'center' },
  frase: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.textoCorrido, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 4 },
  chip: { backgroundColor: colors.exercicioAcertoFundo, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  chipTexto: { fontFamily: typography.bold, fontSize: 11, color: colors.primaryDark },
  virar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    backgroundColor: colors.pilhaCartaClara,
    borderRadius: 22,
    marginTop: 10,
  },
  virarTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.destaqueTexto },
  versoTopo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  versoIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.exercicioAcertoFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seloVerso: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 0.9, color: colors.destaqueTexto },
  nomeVerso: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  blocos: { paddingBottom: 4 },
});
