// src/shared/painel/components/widgets/RankingTrilhas.tsx
// Taxa de conclusão por trilha (concluídas ÷ iniciadas), com as contagens ao lado.
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../ui/AppText';
import { typography } from '../../../theme/typography';
import { formatarNumero } from '../../formatadores';
import type { TrilhaConclusao } from '../../utils/widgets';
import type { TemaPainel } from '../../tema/paletas';
import { useEstilos, useTemaPainel } from '../../tema/TemaPainelContext';

export function RankingTrilhas({ itens, vazio = 'Nenhuma trilha ativa.' }: { itens: TrilhaConclusao[]; vazio?: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  if (itens.length === 0) return <AppText style={styles.vazio}>{vazio}</AppText>;
  return (
    <View style={{ gap: 14 }}>
      {itens.map((t) => (
        <View key={t.titulo} style={{ gap: 5 }}>
          <View style={styles.topo}>
            <AppText style={styles.nome} numberOfLines={2}>
              {t.titulo}
            </AppText>
            <AppText style={styles.pct}>{t.pct === null ? '—' : `${t.pct}%`}</AppText>
          </View>
          <View style={styles.trilho}>
            <View style={[styles.barra, { width: `${t.pct ?? 0}%`, backgroundColor: tema.destaque }]} />
          </View>
          <AppText style={styles.contagem}>
            {formatarNumero(t.concluidas)} concluíram de {formatarNumero(t.iniciadas)} que iniciaram
          </AppText>
        </View>
      ))}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  vazio: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, paddingVertical: 12 } as const,
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 } as const,
  nome: { flex: 1, fontFamily: typography.medium, fontSize: 13, color: t.texto } as const,
  pct: { fontFamily: typography.bold, fontSize: 13, color: t.texto } as const,
  trilho: { height: 10, borderRadius: 5, backgroundColor: t.linhaSuave, overflow: 'hidden' } as const,
  barra: { height: '100%', borderRadius: 5 } as const,
  contagem: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave } as const,
});
