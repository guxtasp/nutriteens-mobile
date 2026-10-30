// src/shared/painel/components/widgets/BarrasSemana.tsx
// Média por dia da semana (Seg–Dom). O dia mais forte fica em destaque.
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { typography } from '../../../theme/typography';
import { DIAS_SEMANA } from '../../utils/widgets';
import type { TemaPainel } from '../../tema/paletas';
import { useEstilos, useTemaPainel } from '../../tema/TemaPainelContext';

type Props = { medias: number[]; altura?: number };

export function BarrasSemana({ medias, altura = 120 }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const max = Math.max(...medias, 0);
  const lider = max > 0 ? medias.indexOf(max) : -1;
  return (
    <View style={styles.linha}>
      {DIAS_SEMANA.map((nome, i) => {
        const v = medias[i] ?? 0;
        const h = max > 0 ? Math.max(v > 0 ? 6 : 0, (v / max) * altura) : 0;
        const ativo = i === lider;
        return (
          <View key={nome} style={styles.coluna} accessibilityLabel={`${nome}: média de ${v.toLocaleString('pt-BR')}`}>
            <AppText style={[styles.valor, ativo && { color: tema.texto }]}>{v > 0 ? v.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : ''}</AppText>
            <View style={{ height: altura, justifyContent: 'flex-end' }}>
              <View style={[styles.barra, { height: h, backgroundColor: ativo ? tema.destaque : tema.serie[1], opacity: ativo ? 1 : 0.45 }]} />
            </View>
            <AppText style={[styles.dia, ativo && { color: tema.texto, fontFamily: typography.bold }]}>{nome}</AppText>
          </View>
        );
      })}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', gap: 6, alignItems: 'flex-end' } as const,
  coluna: { flex: 1, alignItems: 'center', gap: 4 } as const,
  barra: { width: '100%', maxWidth: 34, borderTopLeftRadius: 8, borderTopRightRadius: 8 } as const,
  valor: { fontFamily: typography.medium, fontSize: 10, color: t.textoSuave, minHeight: 14 } as const,
  dia: { fontFamily: typography.medium, fontSize: 11, color: t.textoSuave } as const,
});
