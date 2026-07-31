// src/features/signup-flow/domain/presentation/AppPresentationScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
} from 'react-native';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { DotsIndicator } from '../../../../shared/ui/DotsIndicator';
import { PRESENTATION_SLIDES } from '../../domain/presentationSlides';

// a largura da tela é usada para calcular o deslocamento do scroll
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// o padding horizontal é usado para calcular a largura da barra de progresso
const HORIZONTAL_PADDING = 24;

export default function AppPresentationScreen({ navigation }: any) {
    // o scrollRef é usado para controlar o scroll programaticamente
    // o scrollX é usado para animar a barra de progresso e os slides
    // o currentIndex é usado para saber qual slide está visível atualmente
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);

  // o totalSlides e isLastSlide são usados para saber quando avançar para a tela de cadastro
  const totalSlides = PRESENTATION_SLIDES.length; // Pega o número total de slides a partir do array de slides
  const isLastSlide = currentIndex === totalSlides - 1; //Pega o índice do slide atual e compara com o índice do último slide

  // Função para ir para um slide específico, usada para avançar ou voltar
  function goToSlide(index: number) {
    // o scrollRef.current?.getNode() é usado para acessar o método scrollTo do ScrollView
    //Se o scrollRef.current?.getNode() existir, chama o método scrollTo com o 
    // deslocamento calculado pelo índice do slide e a largura da tela
    scrollRef.current?.getNode
    // Se o scrollRef.current?.getNode() existir, chama o método scrollTo com o 
    // deslocamento calculado pelo índice do slide e a largura da tela
      ? (scrollRef.current as any).getNode().scrollTo({ x: index * SCREEN_WIDTH, animated: true })
      //Se o scrollRef.current?.getNode() não existir, chama o método scrollTo diretamente no scrollRef.current
      : (scrollRef.current as any)?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setCurrentIndex(index);
  }

  // Função para avançar para o próximo slide ou ir para a tela de cadastro se for o último slide
  function handleAdvance() {
    // Se for o último slide, navega para a tela de cadastro
    if (isLastSlide) {
      navigation.navigate('Signup');
      return;
    }
    goToSlide(currentIndex + 1);
  }


  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  }

  // progress bar anima suavemente entre os pontos de cada slide,
  // acompanhando o scroll em vez de saltar direto no valor final
  const progressWidth = scrollX.interpolate({
    inputRange: [0, (totalSlides - 1) * SCREEN_WIDTH],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Pressable onPress={() => navigation.navigate('Signup')} hitSlop={8} style={styles.skipButton}>
          <AppText style={styles.skipText}>Pular</AppText>
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scroll}
      >
        {PRESENTATION_SLIDES.map((slide, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          // a imagem do slide atual fica no tamanho normal;
          // a dos slides vizinhos encolhe e perde opacidade,
          // dando a sensação de movimento ao arrastar
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [20, 0, 20],
            extrapolate: 'clamp',
          });

          return (
            <Pressable key={slide.id} style={styles.slide} onPress={handleAdvance}>
              <Animated.Image
                source={slide.image}
                style={[
                  styles.illustration,
                  { transform: [{ scale }, { translateY }], opacity },
                ]}
                resizeMode="contain"
              />
              <AppText style={styles.title}>{slide.title}</AppText>
              <AppText style={styles.subtitle}>{slide.subtitle}</AppText>
            </Pressable>
          );
        })}
      </Animated.ScrollView>

      <DotsIndicator total={totalSlides} currentIndex={currentIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 60,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 32,
  },
  skipButton: {
    height: 48,
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E3E8E5',
    overflow: 'hidden',
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primaryDark,
  },
  scroll: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: HORIZONTAL_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: '100%',
    height: 320,
    marginBottom: 32,
  },
  title: {
    fontFamily: typography.bold,
    fontSize: 24,
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: typography.regular,
    fontSize: 16,
    color: colors.primaryDark,
    textAlign: 'center',
    lineHeight: 22,
  },
});