// src/features/adolescente/metricas/components/LegendaMistura.tsx
//
// Legenda em chips tocáveis (palavras, sem números). É também o jeito acessível de
// escolher a parte da mistura, para quem não usa a barra ou o prato.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { COR_MISTURA, TEXTO_SUAVE } from '../ui/tokens';
import { CLASSES_MISTURA, ROTULOS_MISTURA, type ClasseMistura } from '../utils/misturaNova';

type Props = {
  valores: Record<ClasseMistura, number>;
  selecionada: ClasseMistura | null;
  onSelecionar: (c: ClasseMistura) => void;
};

export function LegendaMistura({ valores, selecionada, onSelecionar }: Props) {
  const presentes = CLASSES_MISTURA.filter((c) => valores[c] > 0);
  return (
    <View style={styles.raiz}>
      {presentes.map((c) => {
        const ativa = selecionada === c;
        return (
          <Pressable
            key={c}
            onPress={() => onSelecionar(c)}
            accessibilityRole="button"
            accessibilityLabel={`${ROTULOS_MISTURA[c]}. Toque para ver os alimentos.`}
            accessibilityState={{ selected: ativa }}
            style={({ pressed }) => [
              styles.chip,
              ativa && { borderColor: COR_MISTURA[c], backgroundColor: `${COR_MISTURA[c]}1F` },
              pressed && !ativa && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.ponto, { backgroundColor: COR_MISTURA[c] }]} />
            <AppText style={[styles.rotulo, ativa && { fontFamily: typography.bold, color: '#1B4332' }]}>{ROTULOS_MISTURA[c]}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12,
    borderRadius: 18, borderWidth: 1.5, borderColor: '#E7ECE8', backgroundColor: '#fff',
  },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  rotulo: { fontFamily: typography.medium, fontSize: 12, color: TEXTO_SUAVE },
});
