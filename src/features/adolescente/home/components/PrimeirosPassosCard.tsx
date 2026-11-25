// src/features/adolescente/home/components/PrimeirosPassosCard.tsx
//
// Cartão "Primeiros passos" da Home: resolve o "terminei o tour, e agora?". Lista as ações que
// fazem o app "pegar" (água, atividade, refeição, lição, turma), com barra de progresso, um
// botão grande para o próximo passo e atalho em cada linha. Dispensável (X); quando tudo é feito
// vira um "parabéns" e some na visita seguinte. Quem decide QUANDO mostrar é usePrimeirosPassos.
//
// Interação: o próximo passo fica destacado (selo "PRÓXIMO" e seta que chama o toque). Quando a
// pessoa volta de um registro, a linha recém-feita comemora (fundo verde, check que "pula" e
// brilhos), o Bróxis reage e a fala muda. Com "reduzir movimento", tudo isso vira troca simples
// de estado, sem animação. O cartão em si aparece sem animação de entrada (na Home ela atrapalhava).
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { layout } from '../../../../shared/theme/layout';
import { typography } from '../../../../shared/theme/typography';
import { feedbackConquista, feedbackToque } from '../../../../shared/audio/feedback';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import {
  falaPrimeirosPassos,
  passosRecemFeitos,
  rotuloBotaoPassos,
  textoProgressoPassos,
  type IdPasso,
  type PassoComEstado,
  type ResumoPrimeirosPassos,
  type RotaPasso,
} from '../utils/primeirosPassos';

type Props = {
  resumo: ResumoPrimeirosPassos;
  onAbrirPasso: (rota: RotaPasso) => void;
  onDispensar: () => void;
};

const MASCOTE_NORMAL = require('../../../../../assets/img/feedback/incentivando.png');
const MASCOTE_FESTA = require('../../../../../assets/img/feedback/supercontente.png');
/** quanto tempo a linha nova fica "comemorando" */
const DURACAO_COMEMORACAO_MS = 2600;
/** direções dos brilhos em volta do check (graus) */
const BRILHOS = [0, 60, 120, 180, 240, 300];

/** Brilhos que saem do ícone quando o passo acaba de ser feito. */
function Brilhos() {
  return (
    <View style={styles.brilhos} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no">
      {BRILHOS.map((graus, i) => {
        const rad = (graus * Math.PI) / 180;
        return (
          <MotiView
            key={graus}
            from={{ opacity: 1, scale: 0.4, translateX: 0, translateY: 0 }}
            animate={{ opacity: 0, scale: 1, translateX: Math.cos(rad) * 26, translateY: Math.sin(rad) * 26 }}
            transition={{ type: 'timing', duration: 650, delay: 120 + i * 20 }}
            style={[styles.brilho, { backgroundColor: i % 2 === 0 ? colors.amareloDestaque : colors.primary }]}
          />
        );
      })}
    </View>
  );
}

function LinhaPasso({
  passo,
  ehProximo,
  recemFeito,
  reduzir,
  onPress,
}: {
  passo: PassoComEstado;
  ehProximo: boolean;
  recemFeito: boolean;
  reduzir: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={passo.feito}
      onPress={onPress}
      style={({ pressed }) => [
        styles.linha,
        ehProximo && styles.linhaProxima,
        recemFeito && styles.linhaRecemFeita,
        pressed && styles.linhaPressionada,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${passo.titulo}. ${passo.feito ? 'Feito' : ehProximo ? `Próximo passo. ${passo.legenda}` : passo.legenda}`}
      accessibilityState={{ disabled: passo.feito }}
    >
      <View>
        <MotiView
          // a chave muda quando vira "feito": o ícone remonta e faz o "pulo"
          key={passo.feito ? 'feito' : 'pendente'}
          from={recemFeito && !reduzir ? { scale: 0.2, rotate: '-90deg' } : { scale: 1, rotate: '0deg' }}
          animate={{ scale: 1, rotate: '0deg' }}
          transition={{ type: 'spring', damping: 9, stiffness: 180 }}
          style={[styles.icone, passo.feito && styles.iconeFeito, ehProximo && styles.iconeProximo]}
        >
          <Ionicons
            name={passo.feito ? 'checkmark' : passo.icone}
            size={18}
            color={passo.feito ? colors.white : colors.primaryDark}
          />
        </MotiView>
        {recemFeito && !reduzir && <Brilhos />}
      </View>
      <View style={styles.flex}>
        <View style={styles.linhaTituloLinha}>
          <AppText style={[styles.linhaTitulo, passo.feito && !recemFeito && styles.linhaTituloFeita]}>{passo.titulo}</AppText>
          {ehProximo && (
            <View style={styles.seloProximo}>
              <AppText style={styles.seloProximoTexto}>PRÓXIMO</AppText>
            </View>
          )}
        </View>
        {recemFeito ? (
          <AppText style={styles.linhaLegendaFeita}>Feito agora!</AppText>
        ) : (
          !passo.feito && <AppText style={styles.linhaLegenda}>{passo.legenda}</AppText>
        )}
      </View>
      {!passo.feito && (
        <MotiView
          from={{ translateX: 0 }}
          animate={{ translateX: ehProximo && !reduzir ? 4 : 0 }}
          transition={ehProximo && !reduzir ? { type: 'timing', duration: 650, loop: true } : { type: 'timing', duration: 0 }}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </MotiView>
      )}
    </Pressable>
  );
}

export default function PrimeirosPassosCard({ resumo, onAbrirPasso, onDispensar }: Props) {
  const reduzir = useReduzirMovimento();
  const barra = useRef(new Animated.Value(resumo.fracao)).current;
  const [recemFeitos, setRecemFeitos] = useState<IdPasso[]>([]);
  const passosAntesRef = useRef<PassoComEstado[] | null>(null);

  // a barra anda quando um passo novo é cumprido (volta da tela de registro). Timing, não mola: a
  // mola passava de 100% e "pulava" a largura
  useEffect(() => {
    if (reduzir) {
      barra.setValue(resumo.fracao);
      return;
    }
    Animated.timing(barra, { toValue: resumo.fracao, duration: 500, useNativeDriver: false }).start();
  }, [resumo.fracao, reduzir, barra]);

  // descobre qual passo acabou de ser feito, comemora e depois volta ao normal. O timer fica num
  // ref (e não no cleanup do efeito): o resumo pode ser recriado a cada render da Home.
  const timerComemoracao = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const novos = passosRecemFeitos(passosAntesRef.current, resumo.passos);
    passosAntesRef.current = resumo.passos;
    if (novos.length === 0) return;
    setRecemFeitos(novos);
    feedbackConquista();
    if (timerComemoracao.current) clearTimeout(timerComemoracao.current);
    timerComemoracao.current = setTimeout(() => setRecemFeitos([]), DURACAO_COMEMORACAO_MS);
  }, [resumo.passos]);
  useEffect(() => () => {
    if (timerComemoracao.current) clearTimeout(timerComemoracao.current);
  }, []);

  const acabouDeFazer = recemFeitos.length > 0;
  const larguraBarra = barra.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp' });

  return (
    <View style={[styles.card, resumo.completo && styles.cardCompleto]}>
      <View style={styles.topo}>
        <MotiView
          // remonta a cada passo feito: o Bróxis dá um pulinho
          key={`mascote-${resumo.feitos}`}
          from={reduzir || resumo.feitos === 0 ? { translateY: 0, scale: 1 } : { translateY: -10, scale: 1.12 }}
          animate={{ translateY: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 6, stiffness: 160 }}
        >
          <Image
            source={acabouDeFazer || resumo.completo ? MASCOTE_FESTA : MASCOTE_NORMAL}
            style={styles.mascote}
            resizeMode="contain"
            accessible={false}
          />
        </MotiView>
        <View style={styles.flex}>
          <AppText style={styles.titulo} accessibilityRole="header">
            {resumo.completo ? 'Você completou os primeiros passos!' : 'Seus primeiros passos'}
          </AppText>
          <MotiView
            key={`fala-${resumo.feitos}-${acabouDeFazer}`}
            from={reduzir ? { opacity: 1 } : { opacity: 0, translateY: 4 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 260 }}
          >
            <AppText style={styles.subtitulo} accessibilityLiveRegion="polite">
              {falaPrimeirosPassos(resumo, acabouDeFazer)}
            </AppText>
          </MotiView>
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
        <MotiView
          key={`contagem-${resumo.feitos}`}
          from={reduzir || resumo.feitos === 0 ? { scale: 1 } : { scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 8, stiffness: 200 }}
        >
          <AppText style={styles.progressoTexto}>{textoProgressoPassos(resumo)}</AppText>
        </MotiView>
      </View>

      {!resumo.completo && (
        <View style={styles.lista}>
          {resumo.passos.map((passo) => (
            <LinhaPasso
              key={passo.id}
              passo={passo}
              ehProximo={resumo.proximo?.id === passo.id}
              recemFeito={recemFeitos.includes(passo.id)}
              reduzir={reduzir}
              onPress={() => {
                feedbackToque();
                onAbrirPasso(passo.rota);
              }}
            />
          ))}
        </View>
      )}

      {resumo.proximo && (
        <Pressable
          onPress={() => {
            feedbackToque();
            onAbrirPasso(resumo.proximo!.rota);
          }}
          style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
          accessibilityRole="button"
          accessibilityLabel={`${rotuloBotaoPassos(resumo)}: ${resumo.proximo.titulo}`}
        >
          <AppText style={styles.botaoTexto}>{rotuloBotaoPassos(resumo)}</AppText>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: layout.margemH,
    marginTop: layout.gapEntreBlocos,
    marginBottom: layout.gapEntreBlocos,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  cardCompleto: { backgroundColor: colors.amareloSuave, borderColor: colors.amareloDestaque },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mascote: { width: 56, height: 56 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: colors.primaryDark, marginTop: 2 },
  fechar: {
    width: 44,
    height: 44,
    marginTop: -8,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  progressoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  trilho: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.pilhaCartaMedia, overflow: 'hidden' },
  preenchimento: { height: '100%', borderRadius: 5, backgroundColor: colors.primaryDark },
  progressoTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  lista: { marginTop: 10, gap: 4 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  linhaProxima: { backgroundColor: colors.white, borderColor: colors.primary },
  linhaRecemFeita: { backgroundColor: colors.pilhaCartaClara, borderColor: colors.primary },
  linhaPressionada: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  icone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeProximo: { backgroundColor: colors.exercicioAcertoFundo },
  iconeFeito: { backgroundColor: colors.primaryDark },
  brilhos: { position: 'absolute', left: 18, top: 18, width: 0, height: 0 },
  brilho: { position: 'absolute', width: 7, height: 7, borderRadius: 4, marginLeft: -3.5, marginTop: -3.5 },
  linhaTituloLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  linhaTitulo: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
  linhaTituloFeita: { textDecorationLine: 'line-through', opacity: 0.55 },
  seloProximo: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  seloProximoTexto: { fontFamily: typography.bold, fontSize: 9, letterSpacing: 0.8, color: colors.primaryDark },
  linhaLegenda: { fontFamily: typography.regular, fontSize: 12, color: colors.textoCorrido, marginTop: 1 },
  linhaLegendaFeita: { fontFamily: typography.bold, fontSize: 12, color: colors.destaqueTexto, marginTop: 1 },
  botao: {
    marginTop: 12,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoPressionado: { borderBottomWidth: 1, transform: [{ translateY: 3 }] },
  botaoTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.background },
});
