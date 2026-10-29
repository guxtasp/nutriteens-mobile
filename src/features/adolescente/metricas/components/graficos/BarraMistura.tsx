// src/features/adolescente/metricas/components/graficos/BarraMistura.tsx
//
// Barra proporcional de 3 segmentos (in natura / processados / ultraprocessados).
// Cada segmento é tocável: seleciona a parte para ver os alimentos (o cartão decide o que
// mostrar). Sem números e sem vermelho; a legenda em palavras fica em LegendaMistura.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { COR_MISTURA } from '../../ui/tokens';
import { CLASSES_MISTURA, ROTULOS_MISTURA, type ClasseMistura } from '../../utils/misturaNova';

type Props = {
  valores: Record<ClasseMistura, number>;
  selecionada: ClasseMistura | null;
  onSelecionar: (c: ClasseMistura) => void;
};

export function BarraMistura({ valores, selecionada, onSelecionar }: Props) {
  const presentes = CLASSES_MISTURA.filter((c) => valores[c] > 0);
  if (presentes.length === 0) return null;

  return (
    <View style={styles.barra}>
      {presentes.map((c) => (
        <Pressable
          key={c}
          onPress={() => onSelecionar(c)}
          hitSlop={{ top: 10, bottom: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`${ROTULOS_MISTURA[c]}. Toque para ver os alimentos.`}
          accessibilityState={{ selected: selecionada === c }}
          style={{ flex: valores[c], backgroundColor: COR_MISTURA[c], opacity: selecionada && selecionada !== c ? 0.4 : 1 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { flexDirection: 'row', height: 22, borderRadius: 11, overflow: 'hidden', gap: 2 },
});
