// src/features/nutricionista/screens/ParticipantesScreen.tsx
// Lista de participantes (adolescentes) para a nutricionista: busca, filtro por classificação
// de segurança alimentar (EBIA), ordenação e "carregar mais". Toque abre o acompanhamento.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { AjudaInfo } from '../../../shared/painel/components/AjudaInfo';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { CampoBusca, ChipsFiltro, RodapeLista, Selo, VazioPainel, type TomSelo } from '../../../shared/painel/components/ControlesLista';
import { useListaPaginada } from '../../../shared/painel/hooks/useListaPaginada';
import { useModoPainel } from '../../../shared/painel/hooks/useModoPainel';
import { ultimoAcessoTexto } from '../../../shared/painel/formatadores';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { NUTRICIONISTA_PAINEL } from '../navigation/nutricionistaMenu';
import { EBIA_LABEL, Participante, listarParticipantes } from '../services/participantesService';

const FILTROS = [
  { chave: 'TODOS', label: 'Todos' },
  { chave: 'SEGURANCA_ALIMENTAR', label: 'Segurança alimentar' },
  { chave: 'INSEGURANCA_LEVE', label: 'Insegurança leve' },
  { chave: 'INSEGURANCA_MODERADA', label: 'Moderada' },
  { chave: 'INSEGURANCA_GRAVE', label: 'Grave' },
  { chave: 'SEM_AVALIACAO', label: 'Sem avaliação' },
];
const ORDENS = [
  { chave: 'recentes', label: 'Mais recentes' },
  { chave: 'nome', label: 'Nome (A–Z)' },
  { chave: 'acesso', label: 'Último acesso' },
];

export function tomEbia(c: string | null): TomSelo {
  if (!c) return 'neutro';
  if (c === 'SEGURANCA_ALIMENTAR') return 'ok';
  if (c === 'INSEGURANCA_LEVE') return 'info';
  if (c === 'INSEGURANCA_MODERADA') return 'aviso';
  return 'erro';
}
export function seloEbia(c: string | null) {
  return <Selo texto={c ? EBIA_LABEL[c] ?? c : 'Sem avaliação'} tom={tomEbia(c)} />;
}
const nome = (p: Participante) => p.nome?.trim() || p.apelido?.trim() || 'Sem nome';

export default function ParticipantesScreen() {
  const navigation = useNavigation<any>();
  const { modo } = useModoPainel();
  const lista = useListaPaginada<Participante>(
    (p) => listarParticipantes({ busca: p.busca, ebia: p.filtro, ordem: p.ordem, limite: p.limite, offset: p.offset }),
    { ordemInicial: 'recentes' }
  );
  const abrir = (p: Participante) => navigation.navigate('ParticipanteDetalhe', { id: p.id });
  const tabela = modo !== 'celular';

  return (
    <PainelLayout config={NUTRICIONISTA_PAINEL} titulo="Participantes" subtitulo="Adolescentes acompanhados no NutriTeens">
      <IntroSecao
        chave="nutri_participantes"
        titulo="Acompanhamento dos participantes"
        linhas={[
          'Lista dos adolescentes cadastrados. Busque por nome, apelido ou código do participante.',
          'A classificação vem da EBIA (escala de insegurança alimentar) respondida na triagem. Use o filtro para priorizar quem precisa de mais atenção.',
          'Toque em um participante para ver triagem, recordatório e registros dos últimos dias. Use estas informações só para o acompanhamento profissional.',
        ]}
      />
      <View style={styles.controles}>
        <CampoBusca valor={lista.busca} onChange={lista.setBusca} placeholder="Buscar por nome, apelido ou código" />
        <ChipsFiltro opcoes={FILTROS} valor={lista.filtro ?? 'TODOS'} onChange={(c) => lista.setFiltro(c === 'TODOS' ? null : c)} />
        <View style={{ gap: 6 }}>
          <AppText style={styles.ordemRotulo}>Ordenar por</AppText>
          <ChipsFiltro opcoes={ORDENS} valor={lista.ordem} onChange={lista.setOrdem} />
        </View>
      </View>

      {lista.carregando && lista.itens.length === 0 ? (
        <EstadoCarregando />
      ) : lista.erro && lista.itens.length === 0 ? (
        <EstadoErro mensagem={lista.erro} onTentar={lista.recarregar} />
      ) : lista.itens.length === 0 ? (
        <VazioPainel
          titulo="Nenhum participante encontrado"
          texto={lista.busca || lista.filtro ? 'Tente outra busca ou outro filtro.' : 'Quando adolescentes se cadastrarem, eles aparecem aqui.'}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {tabela && (
            <View style={[styles.linha, { paddingHorizontal: 14 }]}>
              <AppText style={[styles.th, styles.cNome]}>Participante</AppText>
              <AppText style={[styles.th, styles.cIdade]}>Idade</AppText>
              <View style={[styles.cEbia, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <AppText style={styles.th}>EBIA</AppText>
                <AjudaInfo titulo="EBIA" texto="Escala Brasileira de Insegurança Alimentar. A classificação mostra o quanto a família relata dificuldade para ter alimentação adequada." />
              </View>
              <AppText style={[styles.th, styles.cNum]}>Sequência</AppText>
              <AppText style={[styles.th, styles.cNum]}>XP</AppText>
              <AppText style={[styles.th, styles.cAcesso]}>Último acesso</AppText>
            </View>
          )}
          {lista.itens.map((p) =>
            tabela ? (
              <Pressable key={p.id} onPress={() => abrir(p)} accessibilityRole="button" style={[styles.linha, styles.linhaDado]}>
                <View style={styles.cNome}>
                  <AppText style={styles.nome} numberOfLines={1}>{nome(p)}</AppText>
                  <AppText style={styles.sub} numberOfLines={1}>{p.codigoParticipante ? `Código ${p.codigoParticipante}` : p.instituicaoEnsino ?? ''}</AppText>
                </View>
                <AppText style={[styles.td, styles.cIdade]}>{p.idade ?? '—'}</AppText>
                <View style={styles.cEbia}>{seloEbia(p.classificacaoEbia)}</View>
                <AppText style={[styles.td, styles.cNum]}>{p.sequenciaAtual} d</AppText>
                <AppText style={[styles.td, styles.cNum]}>{p.xpTotal}</AppText>
                <AppText style={[styles.td, styles.cAcesso]}>{ultimoAcessoTexto(p.ultimoAcesso)}</AppText>
              </Pressable>
            ) : (
              <Pressable key={p.id} onPress={() => abrir(p)} accessibilityRole="button" style={styles.card}>
                <View style={styles.cardTopo}>
                  <AppText style={[styles.nome, { flexShrink: 1 }]} numberOfLines={2}>{nome(p)}</AppText>
                  {seloEbia(p.classificacaoEbia)}
                </View>
                <AppText style={styles.sub}>
                  {p.idade != null ? `${p.idade} anos · ` : ''}{p.codigoParticipante ? `Código ${p.codigoParticipante}` : 'Sem código'}
                </AppText>
                <AppText style={styles.sub}>
                  Sequência {p.sequenciaAtual} d · {p.xpTotal} XP · {ultimoAcessoTexto(p.ultimoAcesso)}
                </AppText>
              </Pressable>
            )
          )}
          <RodapeLista mostrados={lista.itens.length} total={lista.total} temMais={lista.temMais} carregando={lista.carregandoMais} onMais={lista.carregarMais} />
          {!!lista.erro && <AppText style={styles.erro}>{lista.erro}</AppText>}
        </View>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  controles: { gap: 12, marginBottom: 12 },
  ordemRotulo: { fontFamily: typography.medium, fontSize: 12, color: painel.textoSuave },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linhaDado: { backgroundColor: painel.card, borderRadius: 14, borderWidth: 2, borderColor: painel.cardBorda, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56 },
  th: { fontFamily: typography.bold, fontSize: 11, color: painel.textoSuave, textTransform: 'uppercase' },
  td: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight },
  cNome: { flex: 3, minWidth: 0 },
  cIdade: { flex: 0.8, minWidth: 0 },
  cEbia: { flex: 2.4, minWidth: 0 },
  cNum: { flex: 1, minWidth: 0 },
  cAcesso: { flex: 1.6, minWidth: 0 },
  nome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  card: { backgroundColor: painel.card, borderRadius: painel.cardRaio, borderWidth: 2, borderColor: painel.cardBorda, padding: 14, gap: 6, minHeight: 48 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  erro: { fontFamily: typography.regular, fontSize: 12, color: colors.error, textAlign: 'center' },
});
