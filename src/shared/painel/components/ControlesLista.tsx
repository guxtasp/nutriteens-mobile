// src/shared/painel/components/ControlesLista.tsx
// Peças comuns das listas do painel (busca, filtros, selos, linhas de informação).
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';

export function CampoBusca({ valor, onChange, placeholder }: { valor: string; onChange: (t: string) => void; placeholder: string }) {
  return (
    <View style={styles.busca}>
      <Ionicons name="search-outline" size={18} color={painel.textoSuave} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder ?? '#9AA5A0'}
        style={styles.buscaInput}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={placeholder}
      />
      {valor.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar busca">
          <Ionicons name="close-circle" size={18} color={painel.textoSuave} />
        </Pressable>
      )}
    </View>
  );
}

export type OpcaoChip = { chave: string; label: string };

export function ChipsFiltro({ opcoes, valor, onChange }: { opcoes: OpcaoChip[]; valor: string; onChange: (chave: string) => void }) {
  return (
    <View style={styles.chips}>
      {opcoes.map((o) => {
        const ativo = o.chave === valor;
        return (
          <Pressable
            key={o.chave}
            onPress={() => onChange(o.chave)}
            accessibilityRole="button"
            accessibilityState={{ selected: ativo }}
            style={[styles.chip, ativo && styles.chipAtivo]}
          >
            <AppText style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export type TomSelo = 'neutro' | 'ok' | 'aviso' | 'erro' | 'info';
const TONS: Record<TomSelo, { fundo: string; texto: string }> = {
  neutro: { fundo: '#EEF0EF', texto: '#4B4B4B' },
  ok: { fundo: '#EAF5DE', texto: colors.primaryDark },
  aviso: { fundo: colors.warningSoft, texto: colors.warningShadow },
  erro: { fundo: colors.exercicioErroSuave, texto: colors.error },
  info: { fundo: '#E3F1FB', texto: '#1D5F8A' },
};

export function Selo({ texto, tom = 'neutro' }: { texto: string; tom?: TomSelo }) {
  const t = TONS[tom];
  return (
    <View style={[styles.selo, { backgroundColor: t.fundo }]}>
      <AppText style={[styles.seloTexto, { color: t.texto }]}>{texto}</AppText>
    </View>
  );
}

export function LinhaInfo({ rotulo, valor }: { rotulo: string; valor: string | number | null | undefined }) {
  return (
    <View style={styles.linhaInfo}>
      <AppText style={styles.linhaRotulo}>{rotulo}</AppText>
      <AppText style={styles.linhaValor}>{valor === null || valor === undefined || valor === '' ? '—' : String(valor)}</AppText>
    </View>
  );
}

export function RodapeLista({ mostrados, total, temMais, carregando, onMais }: { mostrados: number; total: number; temMais: boolean; carregando: boolean; onMais: () => void }) {
  return (
    <View style={styles.rodape}>
      <AppText style={styles.rodapeTexto}>
        Mostrando {mostrados} de {total}
      </AppText>
      {temMais && (
        <AppButton
          label={carregando ? 'CARREGANDO…' : 'CARREGAR MAIS'}
          fullWidth={false}
          size="compact"
          outlineColor={colors.primaryDark}
          textColor={colors.primaryDark}
          disabled={carregando}
          style={{ paddingHorizontal: 18, minHeight: 44 }}
          onPress={onMais}
        />
      )}
    </View>
  );
}

export function VazioPainel({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <View style={styles.vazio}>
      <Ionicons name="file-tray-outline" size={28} color={painel.textoSuave} />
      <AppText style={styles.vazioTitulo}>{titulo}</AppText>
      <AppText style={styles.vazioTexto}>{texto}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  busca: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 14, borderRadius: 14,
    borderWidth: 2, borderColor: painel.cardBorda, backgroundColor: painel.card,
  },
  buscaInput: { flex: 1, minWidth: 0, fontFamily: typography.regular, fontSize: 14, color: colors.textOnLight, paddingVertical: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: painel.cardBorda,
    backgroundColor: painel.card, alignItems: 'center', justifyContent: 'center',
  },
  chipAtivo: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  chipTextoAtivo: { color: colors.white },
  selo: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  seloTexto: { fontFamily: typography.bold, fontSize: 11 },
  linhaInfo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: painel.linhaSuave },
  linhaRotulo: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave },
  linhaValor: { fontFamily: typography.semiBold, fontSize: 13, color: colors.textOnLight, flexShrink: 1, textAlign: 'right' },
  rodape: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  rodapeTexto: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  vazio: { backgroundColor: painel.card, borderRadius: painel.cardRaio, borderWidth: 2, borderColor: painel.cardBorda, padding: 32, alignItems: 'center', gap: 6 },
  vazioTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave, textAlign: 'center' },
});
