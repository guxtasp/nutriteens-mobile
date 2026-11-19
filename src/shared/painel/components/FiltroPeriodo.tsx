// src/shared/painel/components/FiltroPeriodo.tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos } from '../tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../painelTheme';

export const PERIODOS = [7, 30, 90] as const;
export type PeriodoDias = (typeof PERIODOS)[number];

type Props = { valor: number; onChange: (dias: PeriodoDias) => void };

export function FiltroPeriodo({ valor, onChange }: Props) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.linha} accessibilityRole="radiogroup" accessibilityLabel="Período dos indicadores">
      {PERIODOS.map((d) => {
        const on = d === valor;
        return (
          <Pressable
            key={d}
            onPress={() => onChange(d)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on, checked: on }}
            accessibilityLabel={`Últimos ${d} dias`}
            style={[styles.chip, on && styles.chipOn]}
          >
            <AppText style={[styles.texto, on && styles.textoOn]}>{d} dias</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' } as const,
  chip: {
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: t.borda,
    borderColor: t.chipBorda,
    backgroundColor: t.chipFundo,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  chipOn: { backgroundColor: t.chipAtivoFundo, borderColor: t.chipAtivoFundo } as const,
  texto: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.chipTexto } as const,
  textoOn: { color: t.chipAtivoTexto } as const,
});
