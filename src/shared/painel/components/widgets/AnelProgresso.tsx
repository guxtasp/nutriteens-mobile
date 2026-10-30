// src/shared/painel/components/widgets/AnelProgresso.tsx
// Anel de progresso (0–100%) com o valor no centro.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from '../../../ui/AppText';
import { typography } from '../../../theme/typography';
import type { TemaPainel } from '../../tema/paletas';
import { useEstilos, useTemaPainel } from '../../tema/TemaPainelContext';

type Props = {
  /** 0–100; null mostra "—" */
  pct: number | null;
  tamanho?: number;
  espessura?: number;
  /** texto dentro do anel, abaixo do valor */
  rotulo?: string;
  /** frase abaixo do anel (ex.: "3 de 4 missões") */
  legenda?: string;
};

export function AnelProgresso({ pct, tamanho = 112, espessura = 12, rotulo, legenda }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const raio = (tamanho - espessura) / 2;
  const circ = 2 * Math.PI * raio;
  const valor = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 4 }}>
    <View
      style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}
      accessibilityLabel={pct === null ? 'Sem dados' : `${valor}%${rotulo ? ` ${rotulo}` : ''}`}
    >
      <Svg width={tamanho} height={tamanho} style={{ position: 'absolute' }}>
        <Circle cx={tamanho / 2} cy={tamanho / 2} r={raio} stroke={tema.linhaSuave} strokeWidth={espessura} fill="none" />
        {valor > 0 && (
          <Circle
            cx={tamanho / 2}
            cy={tamanho / 2}
            r={raio}
            stroke={tema.destaque}
            strokeWidth={espessura}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(valor / 100) * circ} ${circ}`}
            rotation={-90}
            origin={`${tamanho / 2}, ${tamanho / 2}`}
          />
        )}
      </Svg>
      <AppText style={styles.valor}>{pct === null ? '—' : `${valor}%`}</AppText>
      {!!rotulo && <AppText style={styles.rotulo}>{rotulo}</AppText>}
    </View>
    {!!legenda && <AppText style={styles.legenda}>{legenda}</AppText>}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  valor: { fontFamily: typography.bold, fontSize: 24, color: t.texto } as const,
  rotulo: { fontFamily: typography.regular, fontSize: 10, color: t.textoSuave } as const,
  legenda: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, textAlign: 'center' } as const,
});
