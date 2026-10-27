// src/features/adolescente/metricas/components/graficos/BarraMistura.tsx
//
// Barra proporcional de 3 segmentos (in natura / processados / ultraprocessados).
// Sem números e sem vermelho: a legenda usa palavras e o ultraprocessado não tem cor de alerta.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../../shared/ui/AppText';
import { typography } from '../../../../../shared/theme/typography';
import { COR_MISTURA, TEXTO_SUAVE } from '../../ui/tokens';

type Props = { natural: number; processado: number; ultra: number; rotuloAcessivel: string };

const SEGMENTOS = [
  { chave: 'natural', rotulo: 'In natura e feitos em casa', cor: COR_MISTURA.natural },
  { chave: 'processado', rotulo: 'Processados', cor: COR_MISTURA.processado },
  { chave: 'ultra', rotulo: 'Ultraprocessados', cor: COR_MISTURA.ultra },
] as const;

export function BarraMistura({ natural, processado, ultra, rotuloAcessivel }: Props) {
  const valores = { natural, processado, ultra };
  const presentes = SEGMENTOS.filter((s) => valores[s.chave] > 0);
  if (presentes.length === 0) return null;

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={rotuloAcessivel} style={{ gap: 10 }}>
      <View style={styles.barra}>
        {presentes.map((s) => (
          <View key={s.chave} style={{ flex: valores[s.chave], backgroundColor: s.cor }} />
        ))}
      </View>
      <View style={styles.legenda}>
        {presentes.map((s) => (
          <View key={s.chave} style={styles.item}>
            <View style={[styles.ponto, { backgroundColor: s.cor }]} />
            <AppText style={styles.rotulo}>{s.rotulo}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { flexDirection: 'row', height: 18, borderRadius: 9, overflow: 'hidden', gap: 2 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  rotulo: { fontFamily: typography.medium, fontSize: 12, color: TEXTO_SUAVE },
});
