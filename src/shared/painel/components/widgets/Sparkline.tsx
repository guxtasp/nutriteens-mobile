// src/shared/painel/components/widgets/Sparkline.tsx
// Minigráfico de linha com área (evolução diária dentro de um cartão de indicador).
import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = { valores: number[]; cor: string; altura?: number };

export function Sparkline({ valores, cor, altura = 32 }: Props) {
  const [largura, setLargura] = useState(0);
  const n = valores.length;
  const max = Math.max(1, ...valores);
  const pad = 2;
  const w = Math.max(0, largura);
  const h = altura - pad * 2;
  const x = (i: number) => (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => pad + h - (v / max) * h;

  function aoMedir(e: LayoutChangeEvent) {
    const lw = Math.floor(e.nativeEvent.layout.width);
    if (lw !== largura) setLargura(lw);
  }

  const linha = valores.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${linha} L${x(n - 1).toFixed(1)},${altura} L${x(0).toFixed(1)},${altura} Z`;

  return (
    <View onLayout={aoMedir} style={{ width: '100%', height: altura, marginTop: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {largura > 0 && n > 1 && (
        <Svg width={largura} height={altura}>
          <Path d={area} fill={cor} fillOpacity={0.14} />
          <Path d={linha} stroke={cor} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
      )}
    </View>
  );
}
