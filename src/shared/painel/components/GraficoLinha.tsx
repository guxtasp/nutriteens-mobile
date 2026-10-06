// src/shared/painel/components/GraficoLinha.tsx
//
// Gráfico de evolução temporal em SVG puro (react-native-svg, já no projeto).
// Largura vem do container (onLayout) — sem largura fixa.
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import { diaCurto } from '../formatadores';

export type SerieLinha = { nome: string; cor?: string; valores: number[] };
type Props = {
  /** rótulos do eixo X (datas ISO "YYYY-MM-DD"), um por valor */
  dias: string[];
  series: SerieLinha[];
  altura?: number;
};

const M = { t: 10, r: 10, b: 24, l: 34 };

export function GraficoLinha({ dias, series, altura = 190 }: Props) {
  const [largura, setLargura] = useState(0);
  const n = dias.length;
  const max = Math.max(1, ...series.flatMap((s) => s.valores));
  // arredonda o topo do eixo Y para um número "redondo"
  const passo = Math.pow(10, Math.floor(Math.log10(max)));
  const topo = Math.ceil(max / passo) * passo;
  const w = Math.max(0, largura - M.l - M.r);
  const h = altura - M.t - M.b;
  const x = (i: number) => M.l + (n <= 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => M.t + h - (v / topo) * h;
  const ticks = [0, 0.5, 1].map((f) => Math.round(topo * f));
  const rotulosX = n === 0 ? [] : Array.from(new Set([0, Math.floor((n - 1) / 2), n - 1]));

  function aoMedir(e: LayoutChangeEvent) {
    const lw = Math.floor(e.nativeEvent.layout.width);
    if (lw !== largura) setLargura(lw);
  }

  return (
    <View>
      {series.length > 1 && (
        <View style={styles.legenda}>
          {series.map((s, i) => (
            <View key={s.nome} style={styles.legendaItem}>
              <View style={[styles.legendaPonto, { backgroundColor: s.cor ?? painel.serie[i % painel.serie.length] }]} />
              <AppText style={styles.legendaTexto}>{s.nome}</AppText>
            </View>
          ))}
        </View>
      )}
      <View onLayout={aoMedir} style={{ width: '100%', height: altura }}>
        {largura > 0 && n > 0 && (
          <Svg width={largura} height={altura}>
            {ticks.map((t) => (
              <React.Fragment key={t}>
                <Line x1={M.l} x2={M.l + w} y1={y(t)} y2={y(t)} stroke={painel.linhaSuave} strokeWidth={1} />
                <SvgText x={M.l - 6} y={y(t) + 4} fontSize={10} fill={painel.textoSuave} textAnchor="end" fontFamily={typography.regular}>
                  {t}
                </SvgText>
              </React.Fragment>
            ))}
            {rotulosX.map((i, k) => (
              <SvgText
                key={i}
                x={x(i)}
                y={altura - 6}
                fontSize={10}
                fill={painel.textoSuave}
                textAnchor={k === 0 && rotulosX.length > 1 ? 'start' : i === n - 1 && rotulosX.length > 1 ? 'end' : 'middle'}
                fontFamily={typography.regular}
              >
                {diaCurto(dias[i])}
              </SvgText>
            ))}
            {series.map((s, si) => {
              const cor = s.cor ?? painel.serie[si % painel.serie.length];
              const d = s.valores.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
              return (
                <React.Fragment key={s.nome}>
                  <Path d={d} stroke={cor} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                  {n <= 31 && s.valores.map((v, i) => <Circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={cor} />)}
                </React.Fragment>
              );
            })}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 6 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaPonto: { width: 10, height: 10, borderRadius: 5 },
  legendaTexto: { fontFamily: typography.medium, fontSize: 12, color: painel.textoSuave },
});
