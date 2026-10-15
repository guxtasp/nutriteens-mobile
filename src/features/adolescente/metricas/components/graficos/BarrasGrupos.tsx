// src/features/adolescente/metricas/components/graficos/BarrasGrupos.tsx
//
// Participação de cada grupo alimentar: em quantos dos dias do período ele apareceu.
// Não ordena por "melhor/pior" nem define meta por grupo, só mostra o que apareceu.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { AppText } from '../../../../../shared/ui/AppText';
import { typography } from '../../../../../shared/theme/typography';
import { pluralizar } from '../../utils/apresentacao';
import { TEXTO_SUAVE, TRILHO } from '../../ui/tokens';

export type ItemGrupo = { rotulo: string; dias: number };
type Props = { itens: ItemGrupo[]; totalDias: number; cor: string; rotuloAcessivel: string };

export function BarrasGrupos({ itens, totalDias, cor, rotuloAcessivel }: Props) {
  return (
    <View accessible accessibilityLabel={rotuloAcessivel} style={{ gap: 10 }}>
      {itens.map((it, i) => (
        <View key={it.rotulo} style={{ gap: 4 }}>
          <View style={styles.topo}>
            <AppText style={styles.rotulo} numberOfLines={1}>{it.rotulo}</AppText>
            <AppText style={styles.dias}>{it.dias} {pluralizar(it.dias, 'dia', 'dias')}</AppText>
          </View>
          <View style={styles.trilho}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${Math.min(100, Math.max(6, (it.dias / totalDias) * 100))}%` }}
              transition={{ type: 'timing', duration: 450, delay: i * 60 }}
              style={[styles.preenchido, { backgroundColor: cor }]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rotulo: { flex: 1, fontFamily: typography.semiBold, fontSize: 13, color: '#1B4332' },
  dias: { fontFamily: typography.medium, fontSize: 12, color: TEXTO_SUAVE },
  trilho: { height: 12, borderRadius: 6, backgroundColor: TRILHO, overflow: 'hidden' },
  preenchido: { height: '100%', borderRadius: 6 },
});
