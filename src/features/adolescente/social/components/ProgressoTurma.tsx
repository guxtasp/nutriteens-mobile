// src/features/adolescente/social/components/ProgressoTurma.tsx
//
// Progresso do desafio EM EQUIPE. Substitui a "barra da turma" com bolinhas que ninguém entendia.
// Ideia: um caminho com 3 medalhas (bronze, prata, ouro). Cada medalha mostra quantos dias da turma ela pede.
// A turma anda pelo caminho somando os dias que cada pessoa cumpriu (cada um contra a sua meta pessoal).
// Texto sempre positivo: só diz o que falta para a próxima medalha, nunca quem não cumpriu.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { ATIVIDADE, MEDALHA } from '../theme/turma';
import { DIAS_DESAFIO, MARCOS, marcoAtingido, proximoMarco, type MarcoDesafio } from '../utils/desafioGrupo';

type Props = { total: number; ativos: number; acabou: boolean };

const COR: Record<Exclude<MarcoDesafio, 'NENHUM'>, { cor: string; relevo: string }> = {
  BRONZE: { cor: MEDALHA[3].cor, relevo: MEDALHA[3].relevo },
  PRATA: { cor: MEDALHA[2].cor, relevo: MEDALHA[2].relevo },
  OURO: { cor: MEDALHA[1].cor, relevo: MEDALHA[1].relevo },
};

/** 0 a 1: quanto do trecho [de, ate] a turma já andou. */
function fracaoDoTrecho(total: number, de: number, ate: number): number {
  if (ate <= de) return 1;
  return Math.min(1, Math.max(0, (total - de) / (ate - de)));
}

export default function ProgressoTurma({ total, ativos, acabou }: Props) {
  const n = Math.max(1, ativos);
  const marco = marcoAtingido(total, n);
  const prox = proximoMarco(total, n);
  const maximo = DIAS_DESAFIO * n;
  const alvos = MARCOS.map((m) => m.diasPorPessoa * n);

  const frase = acabou
    ? marco === 'NENHUM'
      ? 'A turma não chegou à medalha desta vez, mas cada dia cumprido valeu. Dá para tentar de novo!'
      : `A turma terminou com a medalha de ${MARCOS.find((m) => m.marco === marco)?.nome.toLowerCase()}!`
    : prox
      ? `Faltam ${prox.faltam} ${prox.faltam === 1 ? 'dia' : 'dias'} da turma para a medalha de ${prox.nome.toLowerCase()}.`
      : 'A turma chegou ao ouro! Mandou muito bem.';

  return (
    <View
      style={estilos.caixa}
      accessible
      accessibilityLabel={`A turma já somou ${total} dias cumpridos de ${maximo} possíveis. ${frase}`}
    >
      <View style={estilos.topo}>
        <View style={{ flex: 1 }}>
          <AppText style={estilos.titulo}>Medalhas da turma</AppText>
          <AppText style={estilos.explica}>Cada dia que alguém cumpre a meta vale 1 ponto para a turma.</AppText>
        </View>
        <View style={estilos.placar}>
          <AppText style={estilos.placarNumero}>{total}</AppText>
          <AppText style={estilos.placarLegenda}>{total === 1 ? 'dia' : 'dias'}</AppText>
        </View>
      </View>

      <View style={estilos.caminho}>
        <View style={estilos.no}>
          <View style={[estilos.bolinha, estilos.bolinhaInicio]}>
            <Ionicons name="flag" size={16} color={ATIVIDADE.desafio.cor} />
          </View>
          <AppText style={estilos.noRotulo}>Início</AppText>
          <AppText style={estilos.noDias}> </AppText>
        </View>

        {MARCOS.map((m, i) => {
          const alcancado = total >= alvos[i];
          const de = i === 0 ? 0 : alvos[i - 1];
          const f = fracaoDoTrecho(total, de, alvos[i]);
          const c = COR[m.marco];
          return (
            <React.Fragment key={m.marco}>
              <View style={estilos.trecho}>
                <View style={estilos.trechoFundo}>
                  <View style={[estilos.trechoCheio, { width: `${Math.round(f * 100)}%`, backgroundColor: ATIVIDADE.desafio.cor }]} />
                </View>
              </View>
              <View style={estilos.no}>
                <View style={[estilos.bolinha, alcancado ? { backgroundColor: c.cor, borderColor: c.relevo } : estilos.bolinhaVazia]}>
                  <Ionicons name={alcancado ? 'medal' : 'medal-outline'} size={20} color={alcancado ? colors.primaryDark : '#A9B4AF'} />
                </View>
                <AppText style={[estilos.noRotulo, !alcancado && { color: '#8A9A92' }]}>{m.nome}</AppText>
                <AppText style={estilos.noDias}>{alvos[i]} dias</AppText>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      <AppText style={estilos.frase}>{frase}</AppText>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { gap: 14 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  explica: { fontFamily: typography.regular, fontSize: 12.5, lineHeight: 17, color: '#5A6B64', marginTop: 2 },
  placar: { minWidth: 64, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 18, backgroundColor: ATIVIDADE.desafio.fundo, alignItems: 'center' },
  placarNumero: { fontFamily: typography.bold, fontSize: 26, lineHeight: 30, color: ATIVIDADE.desafio.cor },
  placarLegenda: { fontFamily: typography.bold, fontSize: 11, color: ATIVIDADE.desafio.cor },
  caminho: { flexDirection: 'row', alignItems: 'flex-start' },
  no: { width: 56, alignItems: 'center', gap: 2 },
  bolinha: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  bolinhaInicio: { backgroundColor: ATIVIDADE.desafio.fundo, borderColor: '#D9CCF7' },
  bolinhaVazia: { backgroundColor: colors.white, borderColor: '#DDE3DF' },
  noRotulo: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  noDias: { fontFamily: typography.regular, fontSize: 11, color: '#6B7B74' },
  trecho: { flex: 1, height: 42, justifyContent: 'center' },
  trechoFundo: { height: 8, borderRadius: 4, backgroundColor: '#E6EAE8', overflow: 'hidden' },
  trechoCheio: { height: 8, borderRadius: 4 },
  frase: { fontFamily: typography.bold, fontSize: 13.5, lineHeight: 18, color: ATIVIDADE.desafio.cor },
});
