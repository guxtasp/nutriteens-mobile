// src/shared/painel/components/FiltroPeriodo.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const PERIODOS = [7, 30, 90] as const;
export type PeriodoDias = (typeof PERIODOS)[number];

type Props = { valor: number; onChange: (dias: PeriodoDias) => void };

export function FiltroPeriodo({ valor, onChange }: Props) {
  return (
    <View style={styles.linha}>
      {PERIODOS.map((d) => {
        const on = d === valor;
        return (
          <Pressable
            key={d}
            onPress={() => onChange(d)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, on && styles.chipOn]}
          >
            <AppText style={[styles.texto, on && styles.textoOn]}>{d} dias</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D9D9D9',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  texto: { fontFamily: typography.medium, fontSize: 12, color: '#6B7280' },
  textoOn: { color: colors.white },
});
