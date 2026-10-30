// src/features/nutricionista/components/AvaliacaoEbia.tsx
// Triagem EBIA do participante dentro da moldura padrão de avaliação.
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { CartaoAvaliacao } from '../../../shared/painel/components/CartaoAvaliacao';
import { dataCurta } from '../../../shared/painel/formatadores';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import type { DetalheParticipante } from '../services/participantesService';
import { seloEbia } from '../screens/ParticipantesScreen';

export function AvaliacaoEbia({ p }: { p: DetalheParticipante }) {
  const styles = useEstilos(criarEstilos);
  const classificacao = p.ebia?.classificacao ?? p.classificacaoEbia;
  return (
    <CartaoAvaliacao
      titulo="Triagem EBIA"
      icone="clipboard-outline"
      detalhe={p.ebia ? `Realizada em ${dataCurta(p.ebia.dataRealizacao)}` : 'Ainda não realizada'}
      situacao={seloEbia(classificacao)}
      ajuda="Escala Brasileira de Insegurança Alimentar, respondida na triagem inicial. A pontuação é o total de respostas 'sim'."
    >
      {p.ebia ? (
        <View style={styles.resultado}>
          <View>
            <AppText style={styles.valor}>{p.ebia.pontuacaoTotal ?? '—'}</AppText>
            <AppText style={styles.rotulo}>respostas "sim"</AppText>
          </View>
        </View>
      ) : (
        <AppText style={styles.texto}>Este participante ainda não concluiu a triagem EBIA.</AppText>
      )}
    </CartaoAvaliacao>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  resultado: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: t.superficieSuave, borderRadius: 12, padding: 14 } as const,
  valor: { fontFamily: typography.bold, fontSize: 28, color: t.texto } as const,
  rotulo: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave } as const,
  texto: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, lineHeight: 19 } as const,
});
