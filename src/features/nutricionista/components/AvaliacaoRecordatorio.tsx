// src/features/nutricionista/components/AvaliacaoRecordatorio.tsx
// Recordatório de 24h: dois marcadores em barras segmentadas e, abaixo, cada refeição com os
// alimentos em etiquetas (em vez de um parágrafo corrido).
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { CartaoAvaliacao } from '../../../shared/painel/components/CartaoAvaliacao';
import { Selo } from '../../../shared/painel/components/ControlesLista';
import { dataCurta } from '../../../shared/painel/formatadores';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import { DetalheParticipante, REFEICAO_LABEL, ordemRefeicao } from '../services/participantesService';

type Recordatorio = DetalheParticipante['recordatorios'][number];

function BarraEscore({ rotulo, valor, max, cor }: { rotulo: string; valor: number | null; max: number; cor: string }) {
  const styles = useEstilos(criarEstilos);
  const cheio = Math.max(0, Math.min(max, valor ?? 0));
  return (
    <View style={styles.escore}>
      <View style={styles.escoreTopo}>
        <AppText style={styles.escoreRotulo}>{rotulo}</AppText>
        <AppText style={styles.escoreValor}>{valor ?? '—'} de {max}</AppText>
      </View>
      <View style={styles.segmentos} accessibilityLabel={`${rotulo}: ${valor ?? 'sem dado'} de ${max}`}>
        {Array.from({ length: max }, (_, i) => (
          <View key={i} style={[styles.segmento, i < cheio && { backgroundColor: cor }]} />
        ))}
      </View>
    </View>
  );
}

export function AvaliacaoRecordatorio({ r, titulo = 'Recordatório alimentar' }: { r: Recordatorio; titulo?: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const refeicoes = [...r.refeicoes].sort((a, b) => ordemRefeicao(a.tipo) - ordemRefeicao(b.tipo));
  return (
    <CartaoAvaliacao
      titulo={titulo}
      icone="restaurant-outline"
      detalhe={`Referente a ${dataCurta(r.dataReferencia)} · o que contou da alimentação de ontem`}
      situacao={<Selo texto={r.concluido ? 'Completo' : 'Incompleto'} tom={r.concluido ? 'ok' : 'aviso'} />}
      ajuda="Recordatório de 24 horas feito na triagem. Os marcadores vêm da classificação dos alimentos relatados."
    >
      <View style={styles.escores}>
        <BarraEscore rotulo="Marcadores saudáveis" valor={r.escoreSaudavel} max={3} cor={tema.destaque} />
        <BarraEscore rotulo="Marcadores não saudáveis" valor={r.escoreNaoSaudavel} max={4} cor={tema.alerta} />
      </View>

      <View style={{ gap: 0 }}>
        {refeicoes.map((m) => (
          <View key={m.tipo} style={styles.refeicao}>
            <AppText style={styles.refNome}>{REFEICAO_LABEL[m.tipo] ?? m.tipo}</AppText>
            <View style={styles.alimentos}>
              {m.alimentos.length > 0 ? (
                m.alimentos.map((a, i) => (
                  <View key={`${a}-${i}`} style={styles.etiqueta}>
                    <AppText style={styles.etiquetaTexto}>{a}</AppText>
                  </View>
                ))
              ) : (
                <AppText style={styles.vazio}>{m.realizada ? 'Sem itens marcados' : 'Não comeu nada'}</AppText>
              )}
            </View>
          </View>
        ))}
      </View>
    </CartaoAvaliacao>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  escores: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } as const,
  escore: { flexGrow: 1, flexBasis: 200, backgroundColor: t.superficieSuave, borderRadius: 12, padding: 12, gap: 8 } as const,
  escoreTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' } as const,
  escoreRotulo: { fontFamily: typography.medium, fontSize: 12, color: t.textoSuave } as const,
  escoreValor: { fontFamily: typography.bold, fontSize: 13, color: t.texto } as const,
  segmentos: { flexDirection: 'row', gap: 4 } as const,
  segmento: { flex: 1, height: 8, borderRadius: 4, backgroundColor: t.linhaSuave } as const,
  refeicao: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: t.linhaSuave } as const,
  refNome: { width: 120, fontFamily: typography.bold, fontSize: 13, color: t.texto } as const,
  alimentos: { flex: 1, minWidth: 180, flexDirection: 'row', flexWrap: 'wrap', gap: 6 } as const,
  etiqueta: { backgroundColor: t.superficieSuave, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 } as const,
  etiquetaTexto: { fontFamily: typography.regular, fontSize: 12, color: t.textoCorpo } as const,
  vazio: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, fontStyle: 'italic' } as const,
});
