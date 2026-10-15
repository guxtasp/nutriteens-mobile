// src/features/adolescente/metricas/screens/MetricasView.tsx
//
// Apresentação pura da tela "Minha jornada": recebe o estado pronto e não busca nada.
// A Fase 4 cria a tela de rota (hook + navegação) que alimenta este componente.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { EstadoMetricas, GruposInfo } from '../types/estado';
import type { MetricasCompletas, TipoPeriodo } from '../types/metricas';
import type { CartaoId } from '../utils/cartoesInfo';
import type { FeedbackBroxis, ProximoPasso } from '../utils/feedbackBroxis';
import { humanizarGrupo, pluralizar, serieRefeicoes, textoAcessivelDias } from '../utils/apresentacao';
import { ACENTOS, FUNDO } from '../ui/tokens';
import { CartaoMetrica } from '../components/CartaoMetrica';
import { ConquistasLista } from '../components/ConquistasLista';
import { MetricasCarregando, MetricasErro, MetricasSemDados } from '../components/EstadosMetricas';
import { SeletorPeriodo } from '../components/SeletorPeriodo';
import { BarrasGrupos } from '../components/graficos/BarrasGrupos';
import { GraficoBarras } from '../components/graficos/GraficoBarras';
import { GraficoDias } from '../components/graficos/GraficoDias';
import { ProgressoSegmentado } from '../components/graficos/ProgressoSegmentado';

const INTRO = 'Aqui eu mostro o que você registrou e aprendeu. Sem nota e sem comparação com ninguém: só você e a sua jornada!';
const MAX_GRUPOS = 6;

type Props = {
  estado: EstadoMetricas;
  periodo: TipoPeriodo;
  onMudarPeriodo: (p: TipoPeriodo) => void;
  onVoltar: () => void;
  onTentarNovamente: () => void;
  onProximoPasso: (passo: ProximoPasso) => void;
  gruposInfo?: GruposInfo;
};

export function MetricasView({ estado, periodo, onMudarPeriodo, onVoltar, onTentarNovamente, onProximoPasso, gruposInfo }: Props) {
  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.header}>
        <BackButton onPress={onVoltar} />
        <AppText style={styles.titulo} accessibilityRole="header">Minha jornada</AppText>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <SeletorPeriodo valor={periodo} onChange={onMudarPeriodo} />

        {estado.status === 'carregando' && <MetricasCarregando />}
        {estado.status === 'erro' && <MetricasErro onTentar={onTentarNovamente} />}
        {estado.status === 'pronto' && (
          estado.metricas.atual.nivelDados === 'nenhum' ? (
            <MetricasSemDados feedback={estado.feedbacks.resumo} onProximoPasso={onProximoPasso} />
          ) : (
            <Cartoes metricas={estado.metricas} feedbacks={estado.feedbacks} gruposInfo={gruposInfo} onProximoPasso={onProximoPasso} />
          )
        )}

        {estado.status === 'pronto' && (
          <AppText style={styles.aviso}>
            O NutriTeens é uma companheira de jornada educativa: não faz diagnóstico nem substitui o acompanhamento de profissionais de saúde.
          </AppText>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Cartoes({ metricas: m, feedbacks: f, gruposInfo, onProximoPasso }: {
  metricas: MetricasCompletas; feedbacks: Record<CartaoId, FeedbackBroxis>; gruposInfo?: GruposInfo; onProximoPasso: (p: ProximoPasso) => void;
}) {
  const a = m.atual;
  const h = a.habitos;
  const e = a.engajamento;
  const total = a.janela.dias;
  const c = m.comparacoes;
  const temMissoes = e.missoes.atribuidas > 0;
  const grupos = h.grupos.slice(0, MAX_GRUPOS).map((g) => ({ rotulo: gruposInfo?.[g.grupo]?.titulo ?? humanizarGrupo(g.grupo), dias: g.dias }));
  const serie = serieRefeicoes(h.porDia, m.tipo);
  const diasAgua = h.porDia.map((d) => ({ data: d.data, marcado: d.aguaMeta === null ? d.aguaRegistrada : d.aguaMeta }));
  const rotuloAgua = h.agua.diasComMeta === null ? 'com água registrada' : 'na meta de água';
  const marcadosAgua = diasAgua.filter((d) => d.marcado).length;

  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.intro}>
        <BroxisMascot size={84} pose="apresentando" entrance="pulo" showParticles={false} />
        <View style={{ flex: 1 }}><SpeechBubble text={INTRO} tailPosition="left" /></View>
      </View>

      <CartaoMetrica
        cartao="resumo" indice={0} feedback={f.resumo} onProximoPasso={onProximoPasso} comparacao={c.diasAtivos}
        destaque={{ valor: String(a.diasAtivos), rotulo: pluralizar(a.diasAtivos, 'dia ativo', 'dias ativos') }}
      >
        <GraficoDias
          dias={e.porDia.map((d) => ({ data: d.data, marcado: d.ativo }))}
          cor={ACENTOS.resumo.cor}
          rotuloAcessivel={textoAcessivelDias(a.diasAtivos, total, 'com registro ou lição')}
        />
      </CartaoMetrica>

      <CartaoMetrica
        cartao="alimentacao" indice={1} feedback={f.alimentacao} onProximoPasso={onProximoPasso} comparacao={c.diasComRefeicao}
        destaque={{ valor: String(h.diasComRefeicao), rotulo: pluralizar(h.diasComRefeicao, 'dia com refeição registrada', 'dias com refeição registrada') }}
      >
        {h.diasComRefeicao > 0 ? (
          <GraficoBarras pontos={serie} cor={ACENTOS.alimentacao.cor} rotuloAcessivel={`Refeições registradas: ${h.refeicoes} no período`} />
        ) : null}
      </CartaoMetrica>

      <CartaoMetrica
        cartao="diversidade" indice={2} feedback={f.diversidade} onProximoPasso={onProximoPasso} comparacao={c.alimentosDistintos}
        destaque={{ valor: String(h.alimentosDistintos), rotulo: pluralizar(h.alimentosDistintos, 'alimento diferente', 'alimentos diferentes') }}
      >
        {grupos.length > 0 ? (
          <BarrasGrupos itens={grupos} totalDias={total} cor={ACENTOS.diversidade.cor} rotuloAcessivel={`${h.grupos.length} grupos alimentares apareceram no período`} />
        ) : null}
      </CartaoMetrica>

      <CartaoMetrica
        cartao="agua" indice={3} feedback={f.agua} onProximoPasso={onProximoPasso}
        comparacao={h.agua.diasComMeta === null ? c.diasComAgua : c.diasComMetaAgua}
        destaque={{ valor: String(h.agua.diasComMeta ?? h.agua.diasComRegistro), rotulo: `${pluralizar(h.agua.diasComMeta ?? h.agua.diasComRegistro, 'dia', 'dias')} ${rotuloAgua}` }}
      >
        {h.agua.diasComRegistro > 0 ? (
          <GraficoDias dias={diasAgua} cor={ACENTOS.agua.cor} rotuloAcessivel={textoAcessivelDias(marcadosAgua, total, rotuloAgua)} />
        ) : null}
      </CartaoMetrica>

      <CartaoMetrica
        cartao="atividade" indice={4} feedback={f.atividade} onProximoPasso={onProximoPasso} comparacao={c.minutosAtividade}
        destaque={{ valor: String(h.atividade.minutos), rotulo: pluralizar(h.atividade.minutos, 'minuto registrado', 'minutos registrados') }}
      >
        {h.atividade.diasAtivos > 0 ? (
          <GraficoDias
            dias={h.porDia.map((d) => ({ data: d.data, marcado: d.atividade }))}
            cor={ACENTOS.atividade.cor}
            rotuloAcessivel={textoAcessivelDias(h.atividade.diasAtivos, total, 'com atividade')}
          />
        ) : null}
      </CartaoMetrica>

      <CartaoMetrica
        cartao="engajamento" indice={5} feedback={f.engajamento} onProximoPasso={onProximoPasso}
        comparacao={temMissoes ? c.missoesConcluidas : c.licoes}
        destaque={temMissoes
          ? { valor: `${e.missoes.concluidas}/${e.missoes.atribuidas}`, rotulo: 'missões do dia concluídas' }
          : { valor: String(e.licoes), rotulo: pluralizar(e.licoes, 'lição concluída', 'lições concluídas') }}
      >
        {temMissoes ? (
          <ProgressoSegmentado total={e.missoes.atribuidas} feitos={e.missoes.concluidas} cor={ACENTOS.engajamento.cor} rotuloAcessivel={`${e.missoes.concluidas} de ${e.missoes.atribuidas} missões concluídas`} />
        ) : null}
      </CartaoMetrica>

      <CartaoMetrica
        cartao="conquistas" indice={6} feedback={f.conquistas} onProximoPasso={onProximoPasso} comparacao={c.conquistas}
        celebrar={a.evolucao.conquistasNoPeriodo > 0}
        destaque={{ valor: String(a.evolucao.conquistasNoPeriodo), rotulo: pluralizar(a.evolucao.conquistasNoPeriodo, 'conquista no período', 'conquistas no período') }}
      >
        {a.evolucao.conquistasRecentes.length > 0 ? <ConquistasLista itens={a.evolucao.conquistasRecentes.slice(0, 3)} /> : null}
      </CartaoMetrica>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: FUNDO },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 8, paddingHorizontal: 20 },
  titulo: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: typography.bold, color: colors.primaryDark },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  aviso: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: '#4B4B4B', textAlign: 'center', marginTop: 8 },
});
