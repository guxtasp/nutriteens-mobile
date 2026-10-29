// src/features/adolescente/metricas/components/graficos/PratoMistura.tsx
//
// A mesma mistura da barra, vista como um prato dividido em fatias (SVG puro). Estático:
// sem animação. Tocar numa fatia seleciona a parte, igual à barra; a legenda em chips
// (LegendaMistura) é a alternativa acessível.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { COR_MISTURA, TRILHO } from '../../ui/tokens';
import type { ClasseMistura } from '../../utils/misturaNova';
import { fatiasPrato } from '../../utils/prato';

type Props = {
  valores: Record<ClasseMistura, number>;
  selecionada: ClasseMistura | null;
  onSelecionar: (c: ClasseMistura) => void;
  tamanho?: number;
};

const CENTRO = 90; // viewBox 180 x 180
const RAIO_FATIAS = 70;
const RAIO_BORDA = 84;

export function PratoMistura({ valores, selecionada, onSelecionar, tamanho = 180 }: Props) {
  const fatias = fatiasPrato(valores, CENTRO, CENTRO, RAIO_FATIAS);
  if (fatias.length === 0) return null;

  return (
    <View style={{ alignItems: 'center' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={tamanho} height={tamanho} viewBox="0 0 180 180">
        {/* borda do prato */}
        <Circle cx={CENTRO} cy={CENTRO} r={RAIO_BORDA} fill="#fff" stroke={TRILHO} strokeWidth={4} />
        {fatias.map((f) => (
          <Path
            key={f.chave}
            d={f.d}
            fill={COR_MISTURA[f.chave]}
            stroke="#fff"
            strokeWidth={3}
            strokeLinejoin="round"
            opacity={selecionada && selecionada !== f.chave ? 0.4 : 1}
            onPress={() => onSelecionar(f.chave)}
          />
        ))}
      </Svg>
    </View>
  );
}
