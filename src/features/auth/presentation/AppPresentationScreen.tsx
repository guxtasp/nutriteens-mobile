// src/features/auth/presentation/AppPresentationScreen.tsx
//
// Slides de apresentação (tela depois de "COMEÇAR AGORA").
// Estrutura: fundo colorido que muda de cor a cada slide, folha branca fixa embaixo
// e páginas que deslizam por cima (ilustração em cima, texto na folha).
// Cabeçalho (voltar/pular), pílulas de progresso e botão ficam fixos.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { useReduzirMovimento } from '../../../shared/hooks/useReduzirMovimento';
import { PRESENTATION_SLIDES, PresentationSlide } from './presentationSlides';

const PADDING_LATERAL = 28;
const VERDE_ESCURO = colors.primaryDark; // #1B4332
const TEXTO_BOTAO = '#0F3D2E';
const TEXTO_SUAVE = '#3D5A4D';
const ALTURA_BOTAO = 56;
const ALTURA_CABECALHO = 44;

type Medidas = {
  largura: number;
  altura: number;
  alturaFolha: number;   // altura da folha branca
  topoFolha: number;     // y onde a folha começa
  topoIlustracao: number;
  tamIlustracao: number;
  paddingInferior: number;
};

export default function AppPresentationScreen({ navigation }: any) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();

  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flutuar = useRef(new Animated.Value(0)).current;
  const brilhar = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  const total = PRESENTATION_SLIDES.length;
  const slideAtual = PRESENTATION_SLIDES[currentIndex];
  const isLastSlide = currentIndex === total - 1;

  // ---- medidas (se adaptam a telas baixas) ----
  const paddingInferior = Math.max(insets.bottom, 16) + 12;
  const alturaFolha = Math.min(430, Math.max(380, Math.round(height * 0.5)));
  const topoFolha = height - alturaFolha;
  const baseCabecalho = insets.top + 8 + ALTURA_CABECALHO + 8;
  const espacoIlustracao = topoFolha + 10 - baseCabecalho;
  const tamIlustracao = Math.max(180, Math.min(310, width - 60, espacoIlustracao));
  const topoIlustracao = baseCabecalho + Math.max(0, (espacoIlustracao - tamIlustracao) / 2);
  const medidas: Medidas = {
    largura: width,
    altura: height,
    alturaFolha,
    topoFolha,
    topoIlustracao,
    tamIlustracao,
    paddingInferior,
  };

  // ---- animações em repetição (flutuar da ilustração e brilho das estrelinhas) ----
  useEffect(() => {
    if (reduzir) {
      flutuar.setValue(0);
      brilhar.setValue(0);
      return;
    }
    const loop = (valor: Animated.Value, ms: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(valor, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(valor, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
    const a = loop(flutuar, 2000);
    const b = loop(brilhar, 1200);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [reduzir, flutuar, brilhar]);

  // ---- navegação ----
  function irParaSlide(index: number) {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  }

  function avancar() {
    if (isLastSlide) {
      navigation.navigate('Signup');
      return;
    }
    irParaSlide(currentIndex + 1);
  }

  // atualiza o índice já durante o arrasto, para o texto do botão trocar na hora certa
  function aoRolar(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const novo = Math.round(event.nativeEvent.contentOffset.x / width);
    if (novo >= 0 && novo < total && novo !== currentIndex) setCurrentIndex(novo);
  }

  // cor de fundo acompanha o scroll
  const corFundo = scrollX.interpolate({
    inputRange: PRESENTATION_SLIDES.map((_, i) => i * width),
    outputRange: PRESENTATION_SLIDES.map((s) => s.tema.fundo),
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: corFundo }]}>
      {/* folha branca fixa */}
      <View
        pointerEvents="none"
        style={[styles.folha, { height: alturaFolha }]}
      />

      {/* páginas que deslizam por cima da folha */}
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
          listener: aoRolar,
        })}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ height }}
      >
        {PRESENTATION_SLIDES.map((slide, index) => (
          <Pagina
            key={slide.id}
            slide={slide}
            index={index}
            total={total}
            scrollX={scrollX}
            flutuar={flutuar}
            brilhar={brilhar}
            m={medidas}
          />
        ))}
      </Animated.ScrollView>

      {/* cabeçalho fixo */}
      <View style={[styles.cabecalho, { top: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.botaoVoltar}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={6}
        >
          <Feather name="arrow-left" size={22} color={VERDE_ESCURO} />
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Signup')}
          style={styles.botaoPular}
          accessibilityRole="button"
          accessibilityLabel="Pular apresentação"
          hitSlop={6}
        >
          <AppText style={styles.textoPular}>Pular</AppText>
        </Pressable>
      </View>

      {/* pílulas + botão fixos na folha */}
      <View style={[styles.rodape, { paddingBottom: paddingInferior }]}>
        <Pilulas total={total} scrollX={scrollX} largura={width} />
        <AppButton
          label={slideAtual.cta}
          backgroundColor={colors.primary}
          textColor={TEXTO_BOTAO}
          shadowColor={colors.primaryShadow}
          onPress={avancar}
          style={styles.botao}
        />
      </View>
    </Animated.View>
  );
}

// ---------- uma página (ilustração + texto) ----------
type PaginaProps = {
  slide: PresentationSlide;
  index: number;
  total: number;
  scrollX: Animated.Value;
  flutuar: Animated.Value;
  brilhar: Animated.Value;
  m: Medidas;
};

function Pagina({ slide, index, total, scrollX, flutuar, brilhar, m }: PaginaProps) {
  const { tema } = slide;
  const faixa = [(index - 1) * m.largura, index * m.largura, (index + 1) * m.largura];

  // ilustração: encolhe, esmaece e desliza mais devagar que o texto (parallax)
  const escala = scrollX.interpolate({ inputRange: faixa, outputRange: [0.85, 1, 0.85], extrapolate: 'clamp' });
  const opacidade = scrollX.interpolate({ inputRange: faixa, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
  const deslocar = scrollX.interpolate({
    inputRange: faixa,
    outputRange: [m.largura * 0.22, 0, -m.largura * 0.22],
    extrapolate: 'clamp',
  });
  // selo de reação: "pipoca" quando o slide chega
  const escalaSelo = scrollX.interpolate({ inputRange: faixa, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const giroSelo = scrollX.interpolate({ inputRange: faixa, outputRange: ['-25deg', '0deg', '25deg'], extrapolate: 'clamp' });

  const sobe = flutuar.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  const blobGrande = m.tamIlustracao * 1.15;
  const meio = m.topoIlustracao + m.tamIlustracao / 2;

  return (
    <View style={{ width: m.largura, height: m.altura }}>
      {/* círculos de fundo */}
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={StyleSheet.absoluteFill}
      >
        <View
          style={{
            position: 'absolute',
            left: (m.largura - blobGrande) / 2,
            top: meio - blobGrande / 2,
            width: blobGrande,
            height: blobGrande,
            borderRadius: blobGrande / 2,
            backgroundColor: tema.blob,
          }}
        />
        <View style={[styles.blobCanto, { left: -60, top: meio - blobGrande / 2 - 10, backgroundColor: tema.blobSuave }]} />
        <View style={[styles.blobCanto, { right: -50, top: meio + 30, width: 130, height: 130, borderRadius: 65, backgroundColor: tema.blobSuave }]} />
        <Brilho brilhar={brilhar} cor={tema.brilho} tam={22} style={{ left: 36, top: meio - 60 }} />
        <Brilho brilhar={brilhar} cor={tema.brilho} tam={28} style={{ right: 34, top: meio - blobGrande / 2 + 24 }} atraso />
        <Brilho brilhar={brilhar} cor={tema.brilho} tam={18} style={{ left: 48, top: meio + blobGrande / 2 - 30 }} invertido />
      </View>

      {/* ilustração */}
      <Animated.View
        style={{
          position: 'absolute',
          left: (m.largura - m.tamIlustracao) / 2,
          top: m.topoIlustracao,
          width: m.tamIlustracao,
          height: m.tamIlustracao,
          opacity: opacidade,
          transform: [{ translateX: deslocar }, { scale: escala }],
        }}
      >
        <Animated.Image
          source={slide.image}
          style={{ width: '100%', height: '100%', transform: [{ translateY: sobe }] }}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel={slide.alt}
        />
      </Animated.View>

      {/* selo de reação na borda da folha */}
      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[
          styles.selo,
          { top: m.topoFolha - 34, transform: [{ scale: escalaSelo }, { rotate: giroSelo }] },
        ]}
      >
        <Image source={slide.face} style={styles.seloImagem} />
      </Animated.View>

      {/* texto dentro da folha */}
      <View style={[styles.texto, { top: m.topoFolha + 28 }]}>
        <View style={[styles.etiqueta, { backgroundColor: tema.chip }]}>
          <AppText style={[styles.etiquetaTexto, { color: tema.acento }]}>
            {index + 1} DE {total}
          </AppText>
        </View>

        <TituloComMarca titulo={slide.title} destaque={slide.highlight} cor={tema.marca} />

        <AppText style={styles.subtitulo}>{slide.subtitle}</AppText>

        <View style={styles.chips}>
          {slide.tags.map((tag) => (
            <View key={tag} style={[styles.chip, { backgroundColor: tema.chip }]}>
              <View style={[styles.chipPonto, { backgroundColor: tema.acento }]} />
              <AppText style={[styles.chipTexto, { color: tema.acento }]}>{tag}</AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ---------- título com marca-texto atrás de uma palavra ----------
// O marca-texto é uma barra atrás da palavra (texto aninhado do RN pinta a linha inteira,
// por isso o título é quebrado em palavras).
function TituloComMarca({ titulo, destaque, cor }: { titulo: string; destaque: string; cor: string }) {
  const palavras = titulo.split(' ');
  return (
    <View
      style={styles.tituloLinha}
      accessible
      accessibilityRole="header"
      accessibilityLabel={titulo}
    >
      {palavras.map((palavra, i) => {
        const marcada = palavra === destaque;
        return (
          <View key={`${palavra}-${i}`} style={styles.tituloPalavra}>
            {marcada && <View style={[styles.marca, { backgroundColor: cor }]} />}
            <AppText style={styles.titulo}>{palavra}</AppText>
          </View>
        );
      })}
    </View>
  );
}

// ---------- estrelinha que pisca ----------
type BrilhoProps = {
  brilhar: Animated.Value;
  cor: string;
  tam: number;
  style: object;
  atraso?: boolean;
  invertido?: boolean;
};

function Brilho({ brilhar, cor, tam, style, atraso, invertido }: BrilhoProps) {
  const escala = brilhar.interpolate({
    inputRange: [0, 1],
    outputRange: invertido ? [0.7, 1] : atraso ? [0.85, 0.7] : [1, 0.7],
  });
  const opacidade = brilhar.interpolate({
    inputRange: [0, 1],
    outputRange: invertido ? [0.6, 1] : [1, 0.6],
  });
  return (
    <Animated.View style={[{ position: 'absolute', opacity: opacidade, transform: [{ scale: escala }] }, style]}>
      <Svg width={tam} height={tam} viewBox="0 0 24 24">
        <Path
          d="M12 1c.8 5.5 2.5 8.2 11 11-8.5 2.8-10.2 5.5-11 11-.8-5.5-2.5-8.2-11-11 8.5-2.8 10.2-5.5 11-11z"
          fill={cor}
        />
      </Svg>
    </Animated.View>
  );
}

// ---------- pílulas de progresso (a ativa se alonga) ----------
function Pilulas({ total, scrollX, largura }: { total: number; scrollX: Animated.Value; largura: number }) {
  return (
    <View
      style={styles.pilulas}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Slide, ${total} no total`}
    >
      {Array.from({ length: total }).map((_, k) => {
        const faixa = [(k - 1) * largura, k * largura, (k + 1) * largura];
        const w = scrollX.interpolate({ inputRange: faixa, outputRange: [8, 30, 8], extrapolate: 'clamp' });
        const bg = scrollX.interpolate({
          inputRange: faixa,
          outputRange: ['rgba(27,67,50,0.22)', VERDE_ESCURO, 'rgba(27,67,50,0.22)'],
          extrapolate: 'clamp',
        });
        return <Animated.View key={k} style={[styles.pilula, { width: w, backgroundColor: bg }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  folha: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    shadowColor: VERDE_ESCURO,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },

  // cabeçalho
  cabecalho: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  botaoVoltar: {
    width: ALTURA_CABECALHO,
    height: ALTURA_CABECALHO,
    borderRadius: ALTURA_CABECALHO / 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoPular: {
    height: ALTURA_CABECALHO,
    paddingHorizontal: 18,
    borderRadius: ALTURA_CABECALHO / 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
  },
  textoPular: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: VERDE_ESCURO,
  },

  // páginas
  blobCanto: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  selo: {
    position: 'absolute',
    right: 26,
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: VERDE_ESCURO,
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  seloImagem: {
    width: '100%',
    height: '100%',
  },
  texto: {
    position: 'absolute',
    left: PADDING_LATERAL,
    right: PADDING_LATERAL,
  },
  etiqueta: {
    alignSelf: 'flex-start',
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    justifyContent: 'center',
  },
  etiquetaTexto: {
    fontFamily: typography.bold,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  tituloLinha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 7,
    marginTop: 12,
    marginBottom: 10,
  },
  tituloPalavra: {
    justifyContent: 'flex-end',
  },
  marca: {
    position: 'absolute',
    left: -2,
    right: -2,
    bottom: 2,
    height: 11,
    borderRadius: 3,
  },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 27,
    lineHeight: 32,
    color: VERDE_ESCURO,
  },
  subtitulo: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 22,
    color: TEXTO_SUAVE,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  chipPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipTexto: {
    fontFamily: typography.semiBold,
    fontSize: 12.5,
  },

  // rodapé fixo
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: PADDING_LATERAL,
  },
  pilulas: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  pilula: {
    height: 8,
    borderRadius: 4,
  },
  botao: {
    minHeight: ALTURA_BOTAO,
  },
});