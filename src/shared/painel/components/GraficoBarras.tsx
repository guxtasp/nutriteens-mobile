// src/shared/painel/components/GraficoBarras.tsx
//
// Barras horizontais (ranking ou comparação "iniciados x concluídos").
// Em Views — escala bem em qualquer largura e vira lista legível no celular.
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { formatarNumero } from '../formatadores';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

export type ItemBarra = { rotulo: string; valores: number[] };
type Props = {
  itens: ItemBarra[];
  /** nomes das séries (legenda); omita para ranking de série única */
  series?: string[];
  vazio?: string;
};

export function GraficoBarras({ itens, series, vazio = 'Sem dados no período.' }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const max = Math.max(1, ...itens.flatMap((i) => i.valores));
  if (itens.length === 0) return <AppText style={styles.vazio}>{vazio}</AppText>;
  return (
    <View style={{ gap: 12 }}>
      {series && series.length > 1 && (
        <View style={styles.legenda}>
          {series.map((s, i) => (
            <View key={s} style={styles.legendaItem}>
              <View style={[styles.ponto, { backgroundColor: tema.serie[i % tema.serie.length] }]} />
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
                    { width: `${Math.max(v > 0 ? 2 : 0, (v / max) * 100)}%`, backgroundColor: tema.serie[i % tema.serie.length] },
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

const criarEstilos = (t: TemaPainel) => ({
  vazio: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, paddingVertical: 12 } as const,
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 } as const,
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 } as const,
  ponto: { width: 10, height: 10, borderRadius: 5 } as const,
  legendaTexto: { fontFamily: typography.medium, fontSize: 12, color: t.textoSuave } as const,
  rotulo: { fontFamily: typography.medium, fontSize: 13, color: t.texto } as const,
  linhaBarra: { flexDirection: 'row', alignItems: 'center', gap: 10 } as const,
  trilho: { flex: 1, height: 12, borderRadius: 6, backgroundColor: t.linhaSuave, overflow: 'hidden' } as const,
  barra: { height: '100%', borderRadius: 6 } as const,
  valor: { fontFamily: typography.bold, fontSize: 12, color: t.texto, minWidth: 36, textAlign: 'right' } as const,
});
