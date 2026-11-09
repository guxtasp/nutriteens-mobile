// src/features/adolescente/metricas/components/ResumoRapido.tsx
//
// Visão geral do Resumo: 4 números de relance, um por assunto. Tocar leva à aba com o
// detalhe. É o que separa "ver como estou" (aqui) de "entender cada parte" (abas).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { feedbackSelecao } from '../../../../shared/audio/feedback';
import type { AbaId } from '../utils/abas';
import type { CartaoId } from '../utils/cartoesInfo';
import { ACENTOS } from '../ui/tokens';

export type ItemResumo = {
  cartao: CartaoId;
  valor: string;
  rotulo: string;
  /** aba que abre ao tocar */
  aba: AbaId;
};

type Props = { itens: ItemResumo[]; onAbrirAba: (aba: AbaId) => void };

export function ResumoRapido({ itens, onAbrirAba }: Props) {
  return (
    <View style={styles.grade}>
      {itens.map((item) => {
        const ac = ACENTOS[item.cartao];
        return (
          <Pressable
            key={item.cartao}
            onPress={() => { feedbackSelecao(); onAbrirAba(item.aba); }}
            accessibilityRole="button"
            accessibilityLabel={`${item.valor} ${item.rotulo}. Ver detalhes`}
            style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={styles.topo}>
              <View style={[styles.icone, { backgroundColor: ac.suave }]}>
                <Ionicons name={ac.icone} size={16} color={ac.cor} />
              </View>
              <Ionicons name="chevron-forward" size={16} color={ac.cor} />
            </View>
            <AppText style={[styles.valor, { color: ac.cor }]}>{item.valor}</AppText>
            <AppText style={styles.rotulo} numberOfLines={2}>{item.rotulo}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  tile: { flexGrow: 1, flexBasis: '45%', minHeight: 96, backgroundColor: '#fff', borderRadius: 18, padding: 12 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icone: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  valor: { fontFamily: typography.bold, fontSize: 26, lineHeight: 32, marginTop: 6 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 12, lineHeight: 16, color: '#1B4332' },
});
