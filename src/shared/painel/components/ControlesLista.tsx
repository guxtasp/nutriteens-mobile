// src/shared/painel/components/ControlesLista.tsx
// Peças comuns das listas do painel (busca, filtros, selos, linhas de informação).
// Todas leem as cores do tema do painel (claro/escuro).
import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import type { TemaPainel, TomSelo } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

export type { TomSelo };

export function CampoBusca({ valor, onChange, placeholder }: { valor: string; onChange: (t: string) => void; placeholder: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.busca}>
      <Ionicons name="search-outline" size={18} color={tema.textoSuave} />
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tema.placeholder}
        style={styles.buscaInput}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={placeholder}
      />
      {valor.length > 0 && (
        <Pressable onPress={() => onChange('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Limpar busca">
          <Ionicons name="close-circle" size={18} color={tema.textoSuave} />
        </Pressable>
      )}
    </View>
  );
}

export type OpcaoChip = { chave: string; label: string };

export function ChipsFiltro({ opcoes, valor, onChange }: { opcoes: OpcaoChip[]; valor: string; onChange: (chave: string) => void }) {
  const styles = useEstilos(criarEstilos);
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

export function Selo({ texto, tom = 'neutro' }: { texto: string; tom?: TomSelo }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const t = tema.selos[tom];
  return (
    <View style={[styles.selo, { backgroundColor: t.fundo }]}>
      <AppText style={[styles.seloTexto, { color: t.texto }]}>{texto}</AppText>
    </View>
  );
}

export function LinhaInfo({ rotulo, valor }: { rotulo: string; valor: string | number | null | undefined }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.linhaInfo}>
      <AppText style={styles.linhaRotulo}>{rotulo}</AppText>
      <AppText style={styles.linhaValor}>{valor === null || valor === undefined || valor === '' ? '—' : String(valor)}</AppText>
    </View>
  );
}

export function RodapeLista({ mostrados, total, temMais, carregando, onMais }: { mostrados: number; total: number; temMais: boolean; carregando: boolean; onMais: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
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
          outlineColor={tema.texto}
          textColor={tema.texto}
          disabled={carregando}
          style={{ paddingHorizontal: 18, minHeight: 44 }}
          onPress={onMais}
        />
      )}
    </View>
  );
}

export function VazioPainel({ titulo, texto }: { titulo: string; texto: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.vazio}>
      <Ionicons name="file-tray-outline" size={28} color={tema.textoSuave} />
      <AppText style={styles.vazioTitulo}>{titulo}</AppText>
      <AppText style={styles.vazioTexto}>{texto}</AppText>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  busca: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 14, borderRadius: 14,
    borderWidth: 2, borderColor: t.cardBorda, backgroundColor: t.card,
  } as const,
  buscaInput: { flex: 1, minWidth: 0, fontFamily: typography.regular, fontSize: 14, color: t.textoCorpo, paddingVertical: 8 } as const,
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as const,
  chip: {
    minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: t.chipBorda,
    backgroundColor: t.chipFundo, alignItems: 'center', justifyContent: 'center',
  } as const,
  chipAtivo: { backgroundColor: t.chipAtivoFundo, borderColor: t.chipAtivoFundo } as const,
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: t.chipTexto } as const,
  chipTextoAtivo: { color: t.chipAtivoTexto } as const,
  selo: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 } as const,
  seloTexto: { fontFamily: typography.bold, fontSize: 11 } as const,
  linhaInfo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.linhaSuave } as const,
  linhaRotulo: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave } as const,
  linhaValor: { fontFamily: typography.semiBold, fontSize: 13, color: t.textoCorpo, flexShrink: 1, textAlign: 'right' } as const,
  rodape: { alignItems: 'center', gap: 10, paddingVertical: 12 } as const,
  rodapeTexto: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave } as const,
  vazio: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 32, alignItems: 'center', gap: 6 } as const,
  vazioTitulo: { fontFamily: typography.bold, fontSize: 14, color: t.texto } as const,
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, textAlign: 'center' } as const,
});
