// src/features/adolescente/metricas/components/graficos/GraficoBarras.tsx
//
// Barras em pílula (uma por dia ou por semana). O ponto mais recente fica em destaque,
// os demais mais claros; zero vira uma barrinha cinza (nada de "vazio assustador").
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { AppText } from '../../../../../shared/ui/AppText';
import { typography } from '../../../../../shared/theme/typography';
import type { PontoSerie } from '../../utils/apresentacao';
import { TEXTO_SUAVE, TRILHO } from '../../ui/tokens';

const ALTURA = 96;
type Props = { pontos: PontoSerie[]; cor: string; rotuloAcessivel: string };

export function GraficoBarras({ pontos, cor, rotuloAcessivel }: Props) {
  const max = Math.max(1, ...pontos.map((p) => p.valor));
  return (
    <View accessible accessibilityLabel={rotuloAcessivel} style={styles.raiz}>
      {pontos.map((p, i) => {
        const altura = p.valor === 0 ? 6 : Math.max(14, (p.valor / max) * ALTURA);
        return (
          <View key={`${p.rotulo}-${i}`} style={styles.coluna}>
            <AppText style={[styles.valor, p.destaque && { color: cor }]}>{p.valor > 0 ? p.valor : ''}</AppText>
            <View style={styles.area}>
              <MotiView
                from={{ height: 0 }}
                animate={{ height: altura }}
                transition={{ type: 'timing', duration: 420, delay: i * 40 }}
                style={[styles.barra, { backgroundColor: p.valor === 0 ? TRILHO : p.destaque ? cor : `${cor}66` }]}
              />
            </View>
            <AppText style={[styles.rotulo, p.destaque && { fontFamily: typography.bold, color: cor }]}>{p.rotulo}</AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flexDirection: 'row', gap: 6 },
  coluna: { flex: 1, alignItems: 'center', gap: 4 },
  area: { height: ALTURA, justifyContent: 'flex-end', alignSelf: 'stretch', alignItems: 'center' },
  barra: { width: '70%', maxWidth: 34, borderRadius: 12 },
  valor: { fontFamily: typography.bold, fontSize: 12, color: TEXTO_SUAVE, minHeight: 16 },
  rotulo: { fontFamily: typography.medium, fontSize: 12, color: TEXTO_SUAVE },
});
