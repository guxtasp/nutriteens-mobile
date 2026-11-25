// src/shared/ui/BroxisPose.tsx
//
// Bróxis de CORPO INTEIRO para momentos grandes (conclusões, boas-vindas, missão do dia,
// sem conexão, despedida). As reações redondas (assets/img/feedback) continuam sendo o
// feedback do dia a dia; estas poses entram onde o momento pede mais.
// Todas as artes têm o mesmo enquadramento (quadradas, fundo transparente, personagem
// apoiado na base), então trocam entre si sem pular.
//
// Movimento: entra com um pulinho (opcional) e depois fica "vivo" com um movimento leve:
//  - 'flutuar': sobe e desce devagar (padrão);
//  - 'soluco': tremidinha de choro (para a pose chorando);
//  - 'nenhum': parado.
// Com "reduzir movimento" (sistema ou app), fica parado. Só Animated com driver nativo.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { useReduzirMovimento } from '../hooks/useReduzirMovimento';

export type PoseBroxis =
  | 'apresentando'
  | 'chorando'
  | 'comemorando'
  | 'determinado'
  | 'medalha'
  | 'pensativo'
  | 'tchau'
  | 'torcida';

export const ARTE_POSE: Record<PoseBroxis, ImageSourcePropType> = {
  apresentando: require('../../../assets/img/mascot/poses/apresentando.png'),
  chorando: require('../../../assets/img/mascot/poses/chorando.png'),
  comemorando: require('../../../assets/img/mascot/poses/comemorando.png'),
  determinado: require('../../../assets/img/mascot/poses/determinado.png'),
  medalha: require('../../../assets/img/mascot/poses/medalha.png'),
  pensativo: require('../../../assets/img/mascot/poses/pensativo.png'),
  tchau: require('../../../assets/img/mascot/poses/tchau.png'),
  torcida: require('../../../assets/img/mascot/poses/torcida.png'),
};

type Props = {
  pose: PoseBroxis;
  tamanho: number;
  /** pulinho de entrada ao aparecer (padrão: true) */
  entrada?: boolean;
  /** atraso da entrada, em ms (para combinar com a animação da tela) */
  atraso?: number;
  movimento?: 'flutuar' | 'soluco' | 'nenhum';
  /** descrição para leitor de tela; sem ela, a imagem é decorativa */
  rotulo?: string;
  style?: StyleProp<ViewStyle>;
};

export function BroxisPose({ pose, tamanho, entrada = true, atraso = 0, movimento = 'flutuar', rotulo, style }: Props) {
  const reduzir = useReduzirMovimento();
  const surgir = useRef(new Animated.Value(entrada ? 0 : 1)).current;
  const vivo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduzir) {
      surgir.setValue(1);
      vivo.setValue(0);
      return;
    }
    const anims: Animated.CompositeAnimation[] = [];
    if (entrada) {
      surgir.setValue(0);
      const a = Animated.spring(surgir, { toValue: 1, friction: 5, tension: 80, delay: atraso, useNativeDriver: true });
      anims.push(a);
      a.start();
    }
    if (movimento !== 'nenhum') {
      const ida = movimento === 'soluco' ? 140 : 1500;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(vivo, { toValue: 1, duration: ida, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(vivo, { toValue: 0, duration: ida, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          // o soluço vem em rajadas: treme, para, treme de novo
          ...(movimento === 'soluco'
            ? [
                Animated.timing(vivo, { toValue: 1, duration: ida, useNativeDriver: true }),
                Animated.timing(vivo, { toValue: 0, duration: ida, useNativeDriver: true }),
                Animated.delay(900),
              ]
            : []),
        ]),
      );
      anims.push(loop);
      const t = setTimeout(() => loop.start(), atraso + (entrada ? 500 : 0));
      return () => {
        clearTimeout(t);
        anims.forEach((a) => a.stop());
      };
    }
    return () => anims.forEach((a) => a.stop());
  }, [pose, reduzir, entrada, atraso, movimento, surgir, vivo]);

  const transform =
    movimento === 'soluco'
      ? [
          { translateY: vivo.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
          { scaleY: vivo.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] }) },
        ]
      : [{ translateY: vivo.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }];

  return (
    <Animated.View
      style={[
        {
          width: tamanho,
          height: tamanho,
          opacity: surgir.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { translateY: surgir.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
            { scale: surgir.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
          ],
        },
        style,
      ]}
      accessible={!!rotulo}
      accessibilityRole={rotulo ? 'image' : undefined}
      accessibilityLabel={rotulo}
      importantForAccessibility={rotulo ? 'yes' : 'no-hide-descendants'}
    >
      <Animated.View style={{ flex: 1, transform }}>
        <Image source={ARTE_POSE[pose]} style={{ width: tamanho, height: tamanho }} resizeMode="contain" accessibilityIgnoresInvertColors />
      </Animated.View>
    </Animated.View>
  );
}
