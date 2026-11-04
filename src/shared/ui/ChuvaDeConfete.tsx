// src/shared/ui/ChuvaDeConfete.tsx
//
// Confete que CAI continuamente do topo da tela (chuva), com peças de formatos e cores
// variados que balançam e giram. Diferente do canhão de confete (react-native-confetti-cannon),
// que explode uma vez. Só usa Animated com driver nativo; as peças são fixas (useMemo), sem
// sortear de novo a cada render. Não captura toques.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';

type Props = {
  /** quantidade de peças */
  quantidade?: number;
  cores: readonly string[];
};

type Peca = {
  x: number;
  tamanho: number;
  cor: string;
  formato: 'retangulo' | 'circulo' | 'fita';
  atraso: number;
  duracao: number;
  balanco: number;
  giros: number;
};

// gerador pseudo-aleatório determinístico (mulberry32): mesma chuva a cada abertura, sem flicker
function gerador(semente: number) {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function PecaAnimada({ peca, altura }: { peca: Peca; altura: number }) {
  const progresso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacao = Animated.loop(
      Animated.timing(progresso, {
        toValue: 1,
        duration: peca.duracao,
        delay: peca.atraso,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animacao.start();
    return () => animacao.stop();
  }, [peca, progresso]);

  const translateY = progresso.interpolate({ inputRange: [0, 1], outputRange: [-40, altura + 40] });
  const translateX = progresso.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, peca.balanco, 0, -peca.balanco, 0],
  });
  const rotate = progresso.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 * peca.giros}deg`] });
  // "vira" a peça como papel de verdade: achata e desachata enquanto cai
  const scaleX = progresso.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.3, 1, 0.3, 1] });

  const largura = peca.formato === 'fita' ? peca.tamanho * 0.45 : peca.tamanho;
  const alturaPeca = peca.formato === 'fita' ? peca.tamanho * 1.9 : peca.formato === 'circulo' ? peca.tamanho : peca.tamanho * 0.6;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: peca.x,
        top: 0,
        width: largura,
        height: alturaPeca,
        borderRadius: peca.formato === 'circulo' ? largura / 2 : 2,
        backgroundColor: peca.cor,
        transform: [{ translateY }, { translateX }, { rotate }, { scaleX }],
      }}
    />
  );
}

export default function ChuvaDeConfete({ quantidade = 28, cores }: Props) {
  const { width, height } = useWindowDimensions();

  const pecas = useMemo<Peca[]>(() => {
    const aleatorio = gerador(20261103);
    const formatos: Peca['formato'][] = ['retangulo', 'circulo', 'fita'];
    return Array.from({ length: quantidade }, (_, i) => ({
      x: aleatorio() * (width - 12),
      tamanho: 7 + aleatorio() * 7,
      cor: cores[i % cores.length],
      formato: formatos[Math.floor(aleatorio() * formatos.length)],
      atraso: Math.floor(aleatorio() * 2600),
      duracao: 3200 + Math.floor(aleatorio() * 2600),
      balanco: 10 + aleatorio() * 22,
      giros: 1 + Math.floor(aleatorio() * 3),
    }));
  }, [quantidade, cores, width]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pecas.map((peca, i) => (
        <PecaAnimada key={i} peca={peca} altura={height} />
      ))}
    </View>
  );
}
