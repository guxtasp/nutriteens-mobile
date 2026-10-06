// src/shared/painel/components/GraficoBarras.tsx
//
// Barras horizontais (ranking ou comparação "iniciados x concluídos").
// Em Views — escala bem em qualquer largura e vira lista legível no celular.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import { formatarNumero } from '../formatadores';

export type ItemBarra = { rotulo: string; valores: number[] };
type Props = {
  itens: ItemBarra[];
  /** nomes das séries (legenda); omita para ranking de série única */
  series?: string[];
  vazio?: string;
};

export function GraficoBarras({ itens, series, vazio = 'Sem dados no período.' }: Props) {
  const max = Math.max(1, ...itens.flatMap((i) => i.valores));
  if (itens.length === 0) return <AppText style={styles.vazio}>{vazio}</AppText>;
  return (
    <View style={{ gap: 12 }}>
      {series && series.length > 1 && (
        <View style={styles.legenda}>
          {series.map((s, i) => (
            <View key={s} style={styles.legendaItem}>
              <View style={[styles.ponto, { backgroundColor: painel.serie[i % painel.serie.length] }]} />
              <AppText style={styles.legendaTexto}>{s}</AppText>
            </View>
          ))}
        </View>
      )}
      {itens.map((item) => (
        <View key={item.rotulo} style={{ gap: 4 }}>
          <AppText style={styles.rotulo} numberOfLines={2}>
            {item.rotulo}
          </AppText>
          {item.valores.map((v, i) => (
            <View key={i} style={styles.linhaBarra}>
              <View style={styles.trilho}>
                <View
                  style={[
                    styles.barra,
                    { width: `${Math.max(v > 0 ? 2 : 0, (v / max) * 100)}%`, backgroundColor: painel.serie[i % painel.serie.length] },
                  ]}
                />
              </View>
              <AppText style={styles.valor}>{formatarNumero(v)}</AppText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  vazio: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave, paddingVertical: 12 },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  legendaTexto: { fontFamily: typography.medium, fontSize: 12, color: painel.textoSuave },
  rotulo: { fontFamily: typography.medium, fontSize: 13, color: colors.primaryDark },
  linhaBarra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trilho: { flex: 1, height: 12, borderRadius: 6, backgroundColor: painel.linhaSuave, overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 6 },
  valor: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark, minWidth: 36, textAlign: 'right' },
});
