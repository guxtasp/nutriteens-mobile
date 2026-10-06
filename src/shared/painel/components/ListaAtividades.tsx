// src/shared/painel/components/ListaAtividades.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import { tempoRelativo } from '../formatadores';
import type { IconeNome } from '../types';

export type ItemAtividade = { chave: string; icone: IconeNome; titulo: string; detalhe?: string; quando: string };

export function ListaAtividades({ itens, vazio = 'Nada por aqui ainda.' }: { itens: ItemAtividade[]; vazio?: string }) {
  if (itens.length === 0) return <AppText style={styles.vazio}>{vazio}</AppText>;
  return (
    <View>
      {itens.map((it, i) => (
        <View key={it.chave} style={[styles.linha, i > 0 && styles.divisor]}>
          <View style={styles.icone}>
            <Ionicons name={it.icone} size={16} color={colors.primaryDark} />
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

const styles = StyleSheet.create({
  vazio: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave, paddingVertical: 12 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 48 },
  divisor: { borderTopWidth: 1, borderTopColor: painel.linhaSuave },
  icone: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#EAF5DE', alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.medium, fontSize: 13, color: colors.textOnLight },
  detalhe: { fontFamily: typography.regular, fontSize: 11, color: painel.textoSuave, marginTop: 1 },
  quando: { fontFamily: typography.regular, fontSize: 11, color: painel.textoSuave },
});
