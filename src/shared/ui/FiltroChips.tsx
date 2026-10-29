// src/shared/ui/FiltroChips.tsx
// Fileira de "chips" para filtrar listas. Tocar no chip ativo desmarca (volta para "Todos").
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

export type OpcaoFiltro = { chave: string; label: string };

type Props = {
  opcoes: OpcaoFiltro[];
  valor: string | null;
  onChange: (chave: string | null) => void;
  /** texto do chip que limpa o filtro; omita para não mostrar */
  rotuloTodos?: string;
};

export function FiltroChips({ opcoes, valor, onChange, rotuloTodos = 'Todos' }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.linha} keyboardShouldPersistTaps="handled">
      <Chip label={rotuloTodos} ativo={valor === null} onPress={() => onChange(null)} />
      {opcoes.map((o) => (
        <Chip key={o.chave} label={o.label} ativo={valor === o.chave} onPress={() => onChange(valor === o.chave ? null : o.chave)} />
      ))}
    </ScrollView>
  );
}

function Chip({ label, ativo, onPress }: { label: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={[styles.chip, ativo && styles.chipAtivo]}
    >
      <AppText style={[styles.texto, ativo && styles.textoAtivo]}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ScrollView horizontal nasce com flexGrow:1 e, dentro de uma coluna com lista embaixo,
  // "come" a altura da tela (filtros gigantes, lista espremida). Trava na altura do conteúdo.
  scroll: { flexGrow: 0, flexShrink: 0 },
  linha: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  chip: { borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff' },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  texto: { fontFamily: typography.medium, fontSize: 12, color: '#5B6B75' },
  textoAtivo: { fontFamily: typography.bold, color: colors.primaryDark },
});
