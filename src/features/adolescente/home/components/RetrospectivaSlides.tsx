// src/features/adolescente/home/components/RetrospectivaSlides.tsx
//
// "Seu ano com o Bróxis" em poucos slides animados (intro, números, momentos e o cartão final).
// Toque na direita (ou "Continuar") avança, toque na esquerda volta. O último slide é o
// CartaoStory em tela cheia, com "Compartilhar" e "Valeu, Bróxis!" por cima — só o cartão vira
// imagem (ver services/compartilharRetrospectiva.ts).
// Só celebra: sem nota, sem comparação, sem dado pessoal no cartão.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Pressable, StyleSheet, TouchableOpacity, useWindowDimensions, View, type TextStyle,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackSelecao } from '../../../../shared/audio/feedback';
import { ACENTOS } from '../../metricas/ui/tokens';
import type { IconeMomento, RetrospectivaAno, SlideAno } from '../../metricas/utils/retrospectivaSlides';
import { compartilharRetrospectiva } from '../services/compartilharRetrospectiva';
import CartaoStory from './CartaoStory';
import CartaoFesta from './CartaoFesta';

type Props = {
  retrospectiva: RetrospectivaAno;
  reduzirMovimento: boolean;
  onFechar: () => void;
};

// o Modal da Home tem paddingTop 72, paddingHorizontal 32 e paddingBottom 40
const TOPO = 72;
const LATERAL = 32;
const BASE = 40;

const ICONE_MOMENTO: Record<IconeMomento, React.ComponentProps<typeof Ionicons>['name']> = {
  calendar: 'calendar',
  flame: 'flame',
  sparkles: 'sparkles',
};

/** Número que "sobe" até o valor; com movimento reduzido já mostra o valor final. */
function Contador({ valor, parado, estilo }: { valor: number; parado: boolean; estilo: TextStyle }) {
  const [n, setN] = useState(parado ? valor : 0);

  useEffect(() => {
    if (parado) {
      setN(valor);
      return;
    }
    const anim = new Animated.Value(0);
    const id = anim.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(anim, {
      toValue: valor,
      duration: Math.min(1500, 600 + valor * 6),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // anima um número em texto: precisa do thread JS
    }).start();
    return () => {
      anim.removeListener(id);
      anim.stopAnimation();
    };
  }, [valor, parado]);

  return (
    <AppText style={estilo} accessibilityLabel={String(valor)}>
      {n}
    </AppText>
  );
}

function descricaoAcessivel(slide: SlideAno): string {
  switch (slide.tipo) {
    case 'intro':
      return `${slide.titulo}. ${slide.periodo}. ${slide.texto}`;
    case 'numeros':
      return `${slide.titulo}. ${slide.itens.map((i) => `${i.valor} ${i.rotulo}`).join(', ')}.`;
    case 'momentos':
      return `${slide.titulo}. ${slide.itens.map((i) => `${i.titulo}: ${i.destaque}. ${i.frase}`).join(' ')}`;
    case 'final':
      return `${slide.titulo} ${slide.mensagem} ${slide.resumo.map((r) => `${r.valor} ${r.rotulo}`).join(', ')}.`;
  }
}

function Progresso({ total, indice, onFechar }: { total: number; indice: number; onFechar: () => void }) {
  return (
    <View style={styles.topo}>
      <View style={styles.progresso} accessibilityLabel={`Slide ${indice + 1} de ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segmento, i <= indice && styles.segmentoCheio]} />
        ))}
      </View>
      <TouchableOpacity onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={12}>
        <Ionicons name="close" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

export default function RetrospectivaSlides({ retrospectiva, reduzirMovimento, onFechar }: Props) {
  const { slides, textoCompartilhar } = retrospectiva;
  const { width, height } = useWindowDimensions();
  const [indice, setIndice] = useState(0);
  const [compartilhando, setCompartilhando] = useState(false);
  const [modelo, setModelo] = useState<'resumo' | 'festa'>('resumo');
  const cartaoRef = useRef<View>(null);

  const slide = slides[indice];

  const avancar = useCallback(() => {
    setIndice((i) => {
      if (i >= slides.length - 1) return i;
      feedbackSelecao();
      return i + 1;
    });
  }, [slides.length]);

  const voltar = useCallback(() => {
    setIndice((i) => {
      if (i <= 0) return i;
      feedbackSelecao();
      return i - 1;
    });
  }, []);

  async function aoCompartilhar() {
    if (compartilhando) return;
    setCompartilhando(true);
    try {
      await compartilharRetrospectiva({ texto: textoCompartilhar, cartaoRef: cartaoRef.current });
    } finally {
      setCompartilhando(false);
    }
  }

  const entrada = reduzirMovimento
    ? { from: { opacity: 0 }, animate: { opacity: 1 } }
    : { from: { opacity: 0, translateY: 24 }, animate: { opacity: 1, translateY: 0 } };
  const transicao = { type: 'timing' as const, duration: reduzirMovimento ? 120 : 380 };

  // ---- último slide: cartão em tela cheia (formato story) com os botões por cima ----
  if (slide.tipo === 'final') {
    return (
      <View style={StyleSheet.absoluteFill}>
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transicao} style={StyleSheet.absoluteFill}>
          {modelo === 'resumo' ? (
            <CartaoStory
              ref={cartaoRef}
              largura={width}
              altura={height}
              titulo={slide.titulo}
              mensagem={slide.mensagem}
              resumo={slide.resumo}
            />
          ) : (
            <CartaoFesta
              ref={cartaoRef}
              largura={width}
              altura={height}
              titulo={slide.titulo}
              mensagem={slide.mensagem}
              avatar={retrospectiva.avatar}
            />
          )}
        </MotiView>

        <View style={[styles.sobreposto, { top: TOPO, left: LATERAL, right: LATERAL }]}>
          <Progresso total={slides.length} indice={indice} onFechar={onFechar} />
        </View>

        {/* escolha do modelo da imagem a compartilhar (fica fora da imagem) */}
        <View style={[styles.sobreposto, styles.seletor, { top: TOPO + 40, left: LATERAL, right: LATERAL }]}>
          {(['resumo', 'festa'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => {
                if (m !== modelo) feedbackSelecao();
                setModelo(m);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: modelo === m }}
              accessibilityLabel={m === 'resumo' ? 'Modelo resumo, com os números' : 'Modelo festa, com o avatar'}
              style={[styles.pilula, modelo === m && styles.pilulaAtiva]}
              hitSlop={6}
            >
              <Ionicons
                name={m === 'resumo' ? 'stats-chart' : 'balloon'}
                size={14}
                color={modelo === m ? '#1B4332' : colors.white}
              />
              <AppText style={[styles.pilulaTexto, modelo === m && styles.pilulaTextoAtivo]}>
                {m === 'resumo' ? 'Resumo' : 'Festa'}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.sobreposto, { bottom: BASE, left: LATERAL, right: LATERAL, gap: 10 }]}>
          <AppButton
            label={compartilhando ? 'Abrindo...' : 'Compartilhar minha conquista'}
            onPress={aoCompartilhar}
            disabled={compartilhando}
          />
          <TouchableOpacity onPress={onFechar} accessibilityRole="button" style={styles.linkFechar} hitSlop={8}>
            <AppText style={styles.linkFecharTexto}>Valeu, Bróxis!</AppText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.raiz}>
      <Progresso total={slides.length} indice={indice} onFechar={onFechar} />

      <View style={styles.area}>
        <MotiView
          key={indice}
          from={entrada.from}
          animate={entrada.animate}
          transition={transicao}
          style={styles.slide}
          accessible
          accessibilityLabel={descricaoAcessivel(slide)}
        >
          {slide.tipo === 'intro' && (
            <>
              <BroxisMascot size={150} pose="supercontente" entrance={reduzirMovimento ? 'nenhuma' : 'pulo'} showParticles={false} />
              <AppText style={styles.kicker}>{slide.periodo}</AppText>
              <AppText style={styles.tituloGrande} accessibilityRole="header">{slide.titulo}</AppText>
              <AppText style={styles.frase}>{slide.texto}</AppText>
            </>
          )}

          {slide.tipo === 'numeros' && (
            <>
              <AppText style={styles.kicker} accessibilityRole="header">{slide.titulo}</AppText>
              <View style={styles.grade}>
                {slide.itens.map((item) => (
                  <View key={item.rotulo} style={[styles.tile, { backgroundColor: ACENTOS[item.cartao].suave }]}>
                    <Ionicons name={ACENTOS[item.cartao].icone} size={22} color={ACENTOS[item.cartao].cor} />
                    <Contador
                      valor={item.valor}
                      parado={reduzirMovimento}
                      estilo={{ ...styles.tileValor, color: ACENTOS[item.cartao].cor }}
                    />
                    <AppText style={styles.tileRotulo}>{item.rotulo}</AppText>
                  </View>
                ))}
              </View>
              <BroxisMascot size={110} pose="orgulhoso" entrance="nenhuma" showParticles={false} />
            </>
          )}

          {slide.tipo === 'momentos' && (
            <>
              <AppText style={styles.kicker} accessibilityRole="header">{slide.titulo}</AppText>
              <View style={styles.lista}>
                {slide.itens.map((item) => (
                  <View key={item.titulo} style={styles.momento}>
                    <View style={styles.momentoIcone}>
                      <Ionicons name={ICONE_MOMENTO[item.icone]} size={24} color="#FFF3C4" />
                    </View>
                    <View style={styles.momentoTextos}>
                      <AppText style={styles.momentoTitulo}>{item.titulo}</AppText>
                      <AppText style={styles.momentoDestaque}>{item.destaque}</AppText>
                      <AppText style={styles.momentoFrase}>{item.frase}</AppText>
                    </View>
                  </View>
                ))}
              </View>
              <BroxisMascot size={100} pose="curioso" entrance="nenhuma" showParticles={false} />
            </>
          )}
        </MotiView>

        {/* toque: esquerda volta, direita avança */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={styles.zonas}>
            <Pressable style={styles.zonaVoltar} onPress={voltar} accessibilityLabel="Slide anterior" />
            <Pressable style={styles.zonaAvancar} onPress={avancar} accessibilityLabel="Próximo slide" />
          </View>
        </View>
      </View>

      <View style={styles.rodape}>
        <AppButton label={indice === 0 ? 'Vamos lá!' : 'Continuar'} onPress={avancar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, width: '100%' },
  sobreposto: { position: 'absolute' },
  seletor: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  pilula: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  pilulaAtiva: { backgroundColor: '#FFF3C4', borderColor: '#FFF3C4' },
  pilulaTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
  pilulaTextoAtivo: { color: '#1B4332' },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  progresso: { flex: 1, flexDirection: 'row', gap: 4 },
  segmento: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  segmentoCheio: { backgroundColor: colors.white },
  area: { flex: 1, justifyContent: 'center' },
  slide: { alignItems: 'center', gap: 12 },
  zonas: { flex: 1, flexDirection: 'row' },
  zonaVoltar: { flex: 3 },
  zonaAvancar: { flex: 7 },
  kicker: {
    fontFamily: typography.bold, fontSize: 14, letterSpacing: 0.8, color: '#FFF3C4',
    textAlign: 'center', textTransform: 'uppercase',
  },
  tituloGrande: { fontFamily: typography.bold, fontSize: 32, lineHeight: 38, color: colors.white, textAlign: 'center' },
  frase: {
    fontFamily: typography.regular, fontSize: 16, lineHeight: 22, color: colors.textOnDarkMuted,
    textAlign: 'center', paddingHorizontal: 8,
  },
  grade: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexGrow: 1, flexBasis: '46%', borderRadius: 18, padding: 14, gap: 2, minHeight: 112 },
  tileValor: { fontFamily: typography.bold, fontSize: 42, lineHeight: 48 },
  tileRotulo: { fontFamily: typography.semiBold, fontSize: 13, lineHeight: 17, color: '#1B4332' },
  lista: { width: '100%', gap: 10 },
  momento: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18, padding: 14,
  },
  momentoIcone: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,243,196,0.18)',
  },
  momentoTextos: { flex: 1 },
  momentoTitulo: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.6, color: '#FFF3C4', textTransform: 'uppercase' },
  momentoDestaque: { fontFamily: typography.bold, fontSize: 28, lineHeight: 34, color: colors.white, textTransform: 'capitalize' },
  momentoFrase: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: colors.textOnDarkMuted },
  rodape: { width: '100%', gap: 10 },
  linkFechar: { alignItems: 'center', paddingVertical: 8 },
  linkFecharTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.white },
});
