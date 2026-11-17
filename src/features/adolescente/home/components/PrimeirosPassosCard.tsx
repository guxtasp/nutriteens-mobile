// src/features/adolescente/home/components/PrimeirosPassosCard.tsx
//
// Cartão "Primeiros passos" da Home: resolve o "terminei o tour, e agora?". Lista as ações que
// fazem o app "pegar" (água, atividade, refeição, lição, turma), com barra de progresso, um
// botão grande para o próximo passo e atalho em cada linha. Dispensável (X); quando tudo é feito
// vira um "parabéns" e some na visita seguinte. Quem decide QUANDO mostrar é usePrimeirosPassos.
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { layout } from '../../../../shared/theme/layout';
import { typography } from '../../../../shared/theme/typography';
import { feedbackConquista, feedbackToque } from '../../../../shared/audio/feedback';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import {
  rotuloBotaoPassos,
  textoProgressoPassos,
  type ResumoPrimeirosPassos,
  type RotaPasso,
} from '../utils/primeirosPassos';

type Props = {
  resumo: ResumoPrimeirosPassos;
  onAbrirPasso: (rota: RotaPasso) => void;
  onDispensar: () => void;
};

export default function PrimeirosPassosCard({ resumo, onAbrirPasso, onDispensar }: Props) {
  const reduzir = useReduzirMovimento();
  const entrada = useRef(new Animated.Value(reduzir ? 1 : 0)).current;
  const barra = useRef(new Animated.Value(resumo.fracao)).current;

  useEffect(() => {
    if (reduzir) {
      entrada.setValue(1);
      return;
    }
    Animated.spring(entrada, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }).start();
  }, [reduzir, entrada]);

  // a barra anda quando um passo novo é cumprido (volta da tela de registro)
  useEffect(() => {
    if (reduzir) {
      barra.setValue(resumo.fracao);
      return;
    }
    Animated.timing(barra, { toValue: resumo.fracao, duration: 500, useNativeDriver: false }).start();
  }, [resumo.fracao, reduzir, barra]);

  // um som de conquista quando o cartão vira "parabéns" (só se ele já estava na tela)
  const completoAntesRef = useRef(resumo.completo);
  useEffect(() => {
    if (resumo.completo && !completoAntesRef.current) feedbackConquista();
    completoAntesRef.current = resumo.completo;
  }, [resumo.completo]);

  const larguraBarra = barra.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View
      style={[
        styles.card,
        resumo.completo && styles.cardCompleto,
        {
          opacity: entrada,
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      <View style={styles.topo}>
        <Image
          source={require('../../../../../assets/img/feedback/incentivando.png')}
          style={styles.mascote}
          resizeMode="contain"
          accessible={false}
        />
        <View style={{ flex: 1 }}>
          <AppText style={styles.titulo} accessibilityRole="header">
            {resumo.completo ? 'Você completou os primeiros passos!' : 'Seus primeiros passos'}
          </AppText>
          <AppText style={styles.subtitulo}>
            {resumo.completo
              ? 'Agora é só seguir no seu ritmo. O Bróxis está orgulhoso!'
              : 'Faça uma coisinha de cada vez. Eu te acompanho!'}
          </AppText>
        </View>
        <Pressable
          onPress={() => {
            feedbackToque();
            onDispensar();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={resumo.completo ? 'Fechar' : 'Dispensar primeiros passos'}
          style={styles.fechar}
        >
          <Ionicons name="close" size={18} color={colors.primaryDark} />
        </Pressable>
      </View>

      <View style={styles.progressoLinha}>
        <View style={styles.trilho} accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: resumo.total, now: resumo.feitos }}>
          <Animated.View style={[styles.preenchimento, { width: larguraBarra }]} />
        </View>
        <AppText style={styles.progressoTexto}>{textoProgressoPassos(resumo)}</AppText>
      </View>

      {!resumo.completo && (
        <View style={styles.lista}>
          {resumo.passos.map((passo) => (
            <Pressable
              key={passo.id}
              disabled={passo.feito}
              onPress={() => {
                feedbackToque();
                onAbrirPasso(passo.rota);
              }}
              style={({ pressed }) => [styles.linha, pressed && styles.linhaPressionada]}
              accessibilityRole="button"
              accessibilityLabel={`${passo.titulo}. ${passo.feito ? 'Feito' : passo.legenda}`}
              accessibilityState={{ disabled: passo.feito }}
            >
              <View style={[styles.icone, passo.feito && styles.iconeFeito]}>
                <Ionicons
                  name={passo.feito ? 'checkmark' : passo.icone}
                  size={18}
                  color={passo.feito ? colors.white : colors.primaryDark}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={[styles.linhaTitulo, passo.feito && styles.linhaTituloFeita]}>{passo.titulo}</AppText>
                {!passo.feito && <AppText style={styles.linhaLegenda}>{passo.legenda}</AppText>}
              </View>
              {!passo.feito && <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />}
            </Pressable>
          ))}
        </View>
      )}

      {resumo.proximo && (
        <Pressable
          onPress={() => {
            feedbackToque();
            onAbrirPasso(resumo.proximo!.rota);
          }}
          style={({ pressed }) => [styles.botao, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={`${rotuloBotaoPassos(resumo)}: ${resumo.proximo.titulo}`}
        >
          <AppText style={styles.botaoTexto}>{rotuloBotaoPassos(resumo)}</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E2F3D3',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: layout.margemH,
    marginTop: layout.gapEntreBlocos,
    marginBottom: layout.gapEntreBlocos,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cardCompleto: { backgroundColor: '#FFF6D6', borderColor: '#FFD54A' },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mascote: { width: 52, height: 52 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: colors.primaryDark, marginTop: 2 },
  fechar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(27,67,50,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  progressoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  trilho: { flex: 1, height: 10, borderRadius: 5, backgroundColor: 'rgba(27,67,50,0.15)', overflow: 'hidden' },
  preenchimento: { height: '100%', borderRadius: 5, backgroundColor: colors.primaryDark },
  progressoTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  lista: { marginTop: 10 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 12 },
  linhaPressionada: { backgroundColor: 'rgba(27,67,50,0.08)' },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeFeito: { backgroundColor: colors.primaryDark },
  linhaTitulo: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
  linhaTituloFeita: { textDecorationLine: 'line-through', opacity: 0.55 },
  linhaLegenda: { fontFamily: typography.regular, fontSize: 12, color: colors.primaryDark, opacity: 0.75, marginTop: 1 },
  botao: {
    marginTop: 12,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.background },
});
