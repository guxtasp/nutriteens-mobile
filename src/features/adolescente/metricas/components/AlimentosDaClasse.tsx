// src/features/adolescente/metricas/components/AlimentosDaClasse.tsx
//
// "O que apareceu": os alimentos que o adolescente registrou em uma parte da mistura.
// Tom neutro em todas as partes (só informa o que apareceu), sem números e sem julgamento.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { COR_MISTURA, TEXTO_SUAVE } from '../ui/tokens';
import { ROTULOS_MISTURA, type AlimentoNaMistura, type ClasseMistura } from '../utils/misturaNova';

const MAX_CHIPS = 8;

export function AlimentosDaClasse({ classe, alimentos }: { classe: ClasseMistura; alimentos: AlimentoNaMistura[] }) {
  const mostrados = alimentos.slice(0, MAX_CHIPS);
  const temMais = alimentos.length > MAX_CHIPS;
  return (
    <View style={styles.raiz} accessible accessibilityLabel={`${ROTULOS_MISTURA[classe]}: ${mostrados.map((a) => a.nome).join(', ')}${temMais ? ' e outros' : ''}`}>
      <AppText style={styles.titulo}>Apareceram em “{ROTULOS_MISTURA[classe]}”:</AppText>
      <View style={styles.chips}>
        {mostrados.map((a) => (
          <View key={a.nome} style={[styles.chip, { backgroundColor: `${COR_MISTURA[classe]}26` }]}>
            <AppText style={styles.chipTexto}>{a.nome}</AppText>
          </View>
        ))}
        {temMais && <AppText style={styles.mais}>e outros</AppText>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 8, marginTop: 12 },
  titulo: { fontFamily: typography.semiBold, fontSize: 12.5, color: '#1B4332' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  chip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  chipTexto: { fontFamily: typography.medium, fontSize: 12, color: '#1B4332' },
  mais: { fontFamily: typography.regular, fontSize: 12, color: TEXTO_SUAVE },
});
