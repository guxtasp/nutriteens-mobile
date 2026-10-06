// src/shared/painel/components/GridResponsiva.tsx
//
// Grid sem larguras fixas: mede o próprio container e calcula quantas colunas
// cabem com `minItem` de largura mínima (2 KPIs por linha no celular, 4+ no
// desktop). Nunca estoura a tela.
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

type Props = { minItem?: number; gap?: number; maxColunas?: number; children: React.ReactNode };

export function GridResponsiva({ minItem = 150, gap = 12, maxColunas = 6, children }: Props) {
  const [largura, setLargura] = useState(0);
  const itens = React.Children.toArray(children).filter(Boolean);
  const colunas = Math.max(1, Math.min(maxColunas, Math.floor((largura + gap) / (minItem + gap)) || 1));
  const larguraItem = largura > 0 ? Math.floor((largura - gap * (colunas - 1)) / colunas) : 0;

  function aoMedir(e: LayoutChangeEvent) {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w !== largura) setLargura(w);
  }

  return (
    <View onLayout={aoMedir} style={[styles.grid, { gap }, largura === 0 && { opacity: 0 }]}>
      {largura > 0 &&
        itens.map((filho, i) => (
          <View key={i} style={{ width: larguraItem }}>
            {filho}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' } });
