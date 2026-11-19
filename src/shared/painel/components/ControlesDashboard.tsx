// src/shared/painel/components/ControlesDashboard.tsx
// Controles do topo dos dashboards: período (7/30/90 dias), hora da última atualização
// e botão de atualizar. Antes não havia como saber se os números eram de agora nem
// recarregar sem sair da tela (heurísticas 1 e 3 de Nielsen).
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../painelTheme';
import { FiltroPeriodo, type PeriodoDias } from './FiltroPeriodo';

type Props = {
  dias: number;
  onDias: (d: PeriodoDias) => void;
  atualizadoEm: Date | null;
  carregando: boolean;
  onAtualizar: () => void;
};

function hora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ControlesDashboard({ dias, onDias, atualizadoEm, carregando, onAtualizar }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const status = carregando ? 'Atualizando…' : atualizadoEm ? `Atualizado às ${hora(atualizadoEm)}` : '';
  return (
    <View style={styles.linha}>
      <FiltroPeriodo valor={dias} onChange={onDias} />
      <Pressable
        onPress={onAtualizar}
        disabled={carregando}
        accessibilityRole="button"
        accessibilityLabel={`Atualizar dados. ${status}`}
        accessibilityState={{ disabled: carregando, busy: carregando }}
        style={styles.atualizar}
      >
        {carregando ? (
          <ActivityIndicator size="small" color={tema.destaqueTexto} />
        ) : (
          <Ionicons name="refresh" size={18} color={tema.destaqueTexto} />
        )}
        {!!status && <AppText style={styles.status}>{status}</AppText>}
      </Pressable>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 } as const,
  atualizar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 12,
    borderRadius: 22,
    borderWidth: t.borda,
    borderColor: t.chipBorda,
    backgroundColor: t.chipFundo,
  } as const,
  status: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoSuave } as const,
});
