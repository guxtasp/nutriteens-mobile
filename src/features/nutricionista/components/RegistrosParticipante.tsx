// src/features/nutricionista/components/RegistrosParticipante.tsx
// Tabela dos últimos 14 dias (água, atividade, refeições), mais recente primeiro.
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { diaCurto } from '../../../shared/painel/formatadores';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import type { DiaRegistro } from '../services/participantesService';

export function RegistrosParticipante({ dias }: { dias: DiaRegistro[] }) {
  const styles = useEstilos(criarEstilos);
  return (
    <CartaoSecao titulo="Dia a dia" subtitulo="Últimos 14 dias, do mais recente ao mais antigo" ajuda="Água, atividade física e refeições registradas pelo adolescente em cada dia.">
      <View>
        <View style={[styles.linha, styles.cabecalho]}>
          <AppText style={[styles.th, { flex: 1 }]}>Dia</AppText>
          <AppText style={[styles.th, { flex: 1.2 }]}>Água</AppText>
          <AppText style={[styles.th, { flex: 1.2 }]}>Atividade</AppText>
          <AppText style={[styles.th, { flex: 1 }]}>Refeições</AppText>
        </View>
        {[...dias].reverse().map((d) => {
          const vazio = d.aguaMl === 0 && d.atividadeMin === 0 && d.refeicoes === 0;
          return (
            <View key={d.data} style={styles.linha}>
              <AppText style={[styles.td, { flex: 1 }]}>{diaCurto(d.data)}</AppText>
              <AppText style={[styles.td, { flex: 1.2 }, vazio && styles.apagado]}>{d.aguaMl ? `${d.aguaMl} ml` : '—'}</AppText>
              <AppText style={[styles.td, { flex: 1.2 }, vazio && styles.apagado]}>{d.atividadeMin ? `${d.atividadeMin} min` : '—'}</AppText>
              <AppText style={[styles.td, { flex: 1 }, vazio && styles.apagado]}>{d.refeicoes || '—'}</AppText>
            </View>
          );
        })}
      </View>
    </CartaoSecao>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.linhaSuave } as const,
  cabecalho: { paddingVertical: 6 } as const,
  th: { fontFamily: typography.bold, fontSize: 11, color: t.textoSuave, textTransform: 'uppercase' } as const,
  td: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo } as const,
  apagado: { color: t.textoSuave } as const,
});
