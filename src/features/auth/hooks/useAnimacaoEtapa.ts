// src/features/auth/hooks/useAnimacaoEtapa.ts
//
// Animação de troca de etapa do cadastro: o formulário desliza e aparece (vindo da
// direita ao avançar, da esquerda ao voltar) e o mascote dá um "pulinho". Respeita
// "reduzir movimento" do aparelho (aí só aparece, sem deslizar nem pular).
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

export function useAnimacaoEtapa(etapa: number) {
  const entrada = useRef(new Animated.Value(1)).current;
  const etapaAnterior = useRef(etapa);
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

  const direcao = etapa >= etapaAnterior.current ? 1 : -1;

  useEffect(() => {
    if (etapaAnterior.current === etapa) return;
    etapaAnterior.current = etapa;
    entrada.setValue(0);
    const anim = Animated.timing(entrada, {
      toValue: 1,
      duration: reduzirMovimento ? 150 : 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [etapa, entrada, reduzirMovimento]);

  const estiloFormulario = {
    opacity: entrada,
    transform: [
      {
        translateX: entrada.interpolate({
          inputRange: [0, 1],
          outputRange: [reduzirMovimento ? 0 : 28 * direcao, 0],
        }),
      },
    ],
  };

  return { estiloFormulario, reduzirMovimento };
}
