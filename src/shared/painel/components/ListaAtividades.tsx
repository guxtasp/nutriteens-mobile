// src/shared/painel/components/ListaAtividades.tsx
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { tempoRelativo } from '../formatadores';
import type { IconeNome } from '../types';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

export type ItemAtividade = { chave: string; icone: IconeNome; titulo: string; detalhe?: string; quando: string };

export function ListaAtividades({ itens, vazio = 'Nada por aqui ainda.' }: { itens: ItemAtividade[]; vazio?: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  if (itens.length === 0) return <AppText style={styles.vazio}>{vazio}</AppText>;
  return (
    <View>
      {itens.map((it, i) => (
        <View key={it.chave} style={[styles.linha, i > 0 && styles.divisor]}>
          <View style={styles.icone}>
            <Ionicons name={it.icone} size={16} color={tema.destaque} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText style={styles.titulo} numberOfLines={2}>
              {it.titulo}
            </AppText>
            {!!it.detalhe && <AppText style={styles.detalhe}>{it.detalhe}</AppText>}
          </View>
          <AppText style={styles.quando}>{tempoRelativo(it.quando)}</AppText>
        </View>
      ))}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  vazio: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, paddingVertical: 12 } as const,
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 48 } as const,
  divisor: { borderTopWidth: 1, borderTopColor: t.linhaSuave } as const,
  icone: { width: 32, height: 32, borderRadius: 10, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' } as const,
  titulo: { fontFamily: typography.medium, fontSize: 13, color: t.textoCorpo } as const,
  detalhe: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave, marginTop: 1 } as const,
  quando: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave } as const,
});
