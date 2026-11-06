// src/shared/hooks/useEntradaSuave.ts
//
// Entrada suave de um formulário ao abrir a tela (aparece subindo um pouco), no mesmo
// espírito da troca de etapa do cadastro. Com "reduzir movimento" só aparece, sem deslizar.
import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReduzirMovimento } from './useReduzirMovimento';

export function useEntradaSuave(deslocamento = 24) {
  const reduzir = useReduzirMovimento();
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(entrada, {
      toValue: 1,
      duration: reduzir ? 150 : 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [entrada, reduzir]);

  return {
    opacity: entrada,
    transform: [
      { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [reduzir ? 0 : deslocamento, 0] }) },
    ],
  };
}
