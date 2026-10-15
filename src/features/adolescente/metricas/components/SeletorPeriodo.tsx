// src/features/adolescente/metricas/components/SeletorPeriodo.tsx
// Mesmo padrão de abas segmentadas da tela de Missões.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { TipoPeriodo } from '../types/metricas';

const OPCOES: { chave: TipoPeriodo; rotulo: string }[] = [
  { chave: 'semana', rotulo: 'Últimos 7 dias' },
  { chave: 'mes', rotulo: 'Últimos 28 dias' },
];

export function SeletorPeriodo({ valor, onChange }: { valor: TipoPeriodo; onChange: (p: TipoPeriodo) => void }) {
  return (
    <View style={styles.raiz} accessibilityRole="tablist">
      {OPCOES.map((o) => {
        const ativo = o.chave === valor;
        return (
          <Pressable
            key={o.chave}
            onPress={() => onChange(o.chave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativo }}
            style={[styles.aba, ativo && styles.abaAtiva]}
          >
            <AppText style={[styles.texto, ativo && styles.textoAtivo]}>{o.rotulo}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', backgroundColor: '#E3E8E5', borderRadius: 14, padding: 4 },
  aba: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  abaAtiva: { backgroundColor: '#fff' },
  texto: { fontSize: 13, fontFamily: typography.semiBold, color: '#5F6B65' },
  textoAtivo: { color: colors.primaryDark, fontFamily: typography.bold },
});
