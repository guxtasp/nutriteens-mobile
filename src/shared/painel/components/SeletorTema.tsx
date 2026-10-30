// src/shared/painel/components/SeletorTema.tsx
// Alterna entre tema claro e escuro. Duas versões: linha do menu lateral e botão de ícone da barra do celular.
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import type { TemaPainel } from '../tema/paletas';

type Props = { variante: 'menu' | 'barra'; compacto?: boolean };

export function SeletorTema({ variante, compacto }: Props) {
  const { nome, alternar } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const escuro = nome === 'escuro';
  const icone = escuro ? 'sunny-outline' : 'moon-outline';
  const rotulo = escuro ? 'Tema claro' : 'Tema escuro';

  if (variante === 'barra') {
    return (
      <Pressable onPress={alternar} accessibilityRole="switch" accessibilityState={{ checked: escuro }} accessibilityLabel="Tema escuro" style={styles.botaoBarra}>
        <Ionicons name={icone} size={22} color={styles.icone.color as string} />
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={alternar}
      accessibilityRole="switch"
      accessibilityState={{ checked: escuro }}
      accessibilityLabel="Tema escuro"
      style={[styles.item, compacto && styles.itemCompacto]}
    >
      <Ionicons name={icone} size={20} color={styles.icone.color as string} />
      {!compacto && <AppText style={styles.texto}>{rotulo}</AppText>}
    </Pressable>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 12, borderRadius: 14 } as const,
  itemCompacto: { justifyContent: 'center', paddingHorizontal: 0 } as const,
  botaoBarra: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' } as const,
  icone: { color: t.menuTexto },
  texto: { fontFamily: typography.medium, fontSize: 14, color: t.menuTexto, flexShrink: 1 } as const,
});
