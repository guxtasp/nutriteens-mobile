// src/shared/painel/components/Colunas.tsx
//
// Linha que quebra sozinha: cada filho ocupa pelo menos `base` px; se não
// couber, vai para a linha de baixo (cards empilhados no celular).
import React from 'react';
import { StyleSheet, View } from 'react-native';

export function Colunas({ children, bases }: { children: React.ReactNode; bases: number[] }) {
  const itens = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.linha}>
      {itens.map((filho, i) => (
        <View key={i} style={{ flexGrow: 1, flexShrink: 1, flexBasis: bases[i] ?? 300, minWidth: 0 }}>
          {filho}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 } });
