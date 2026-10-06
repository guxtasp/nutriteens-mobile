// src/features/nutricionista/screens/ParticipanteDetalheScreen.tsx
// Acompanhamento de um participante: perfil, triagem (EBIA), recordatório e registros dos
// últimos 14 dias. Só o que a nutricionista precisa para o trabalho profissional.
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { CartaoKpi } from '../../../shared/painel/components/CartaoKpi';
import { Colunas } from '../../../shared/painel/components/Colunas';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { LinhaInfo } from '../../../shared/painel/components/ControlesLista';
import { dataCurta, diaCurto, ultimoAcessoTexto } from '../../../shared/painel/formatadores';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { NUTRICIONISTA_PAINEL } from '../navigation/nutricionistaMenu';
import { DetalheParticipante, buscarParticipante, calcularImc } from '../services/participantesService';
import { seloEbia } from './ParticipantesScreen';

export default function ParticipanteDetalheScreen({ route }: { route: { params: { id: string } } }) {
  const id = route.params?.id;
  const [p, setP] = useState<DetalheParticipante | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      setP(await buscarParticipante(id));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir o participante.');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  const titulo = p?.nome?.trim() || p?.apelido?.trim() || 'Participante';
  const dias = p?.ultimos14Dias ?? [];
  const diasComRegistro = dias.filter((d) => d.aguaMl > 0 || d.atividadeMin > 0 || d.refeicoes > 0).length;
  const diasComAgua = dias.filter((d) => d.aguaMl > 0);
  const mediaAgua = diasComAgua.length ? Math.round(diasComAgua.reduce((s, d) => s + d.aguaMl, 0) / diasComAgua.length) : 0;
  const totalAtividade = dias.reduce((s, d) => s + d.atividadeMin, 0);
  const totalRefeicoes = dias.reduce((s, d) => s + d.refeicoes, 0);
  const imc = p ? calcularImc(p.pesoKg, p.alturaCm) : null;

  return (
    <PainelLayout config={NUTRICIONISTA_PAINEL} titulo={titulo} subtitulo={p?.codigoParticipante ? `Código ${p.codigoParticipante}` : 'Participante'} voltar>
      {carregando && !p ? (
        <EstadoCarregando />
      ) : erro || !p ? (
        <EstadoErro mensagem={erro ?? 'Participante não encontrado.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <IntroSecao
            chave="nutri_participante_detalhe"
            titulo="Como ler esta página"
            linhas={[
              'Perfil e triagem mostram o ponto de partida do adolescente. Registros dos últimos 14 dias mostram como está o hábito agora.',
              'Estes dados são sensíveis: use apenas para o acompanhamento profissional e não compartilhe fora da equipe.',
            ]}
          />

          <Colunas bases={[320, 320]}>
            <CartaoSecao titulo="Perfil" ajuda="Dados informados no cadastro. O IMC é só uma referência e deve ser interpretado com as curvas de crescimento adequadas à idade.">
              <LinhaInfo rotulo="Idade" valor={p.idade != null ? `${p.idade} anos` : null} />
              <LinhaInfo rotulo="Gênero" valor={p.genero} />
              <LinhaInfo rotulo="Peso" valor={p.pesoKg != null ? `${p.pesoKg} kg` : null} />
              <LinhaInfo rotulo="Altura" valor={p.alturaCm != null ? `${p.alturaCm} cm` : null} />
              <LinhaInfo rotulo="IMC (referência)" valor={imc} />
              <LinhaInfo rotulo="Instituição" valor={p.instituicaoEnsino} />
              <LinhaInfo rotulo="Cadastro" valor={dataCurta(p.criadoEm)} />
              <LinhaInfo rotulo="Último acesso" valor={ultimoAcessoTexto(p.ultimoAcesso)} />
            </CartaoSecao>

            <CartaoSecao titulo="Triagem — EBIA" ajuda="Escala Brasileira de Insegurança Alimentar, respondida na triagem inicial. A pontuação é o total de respostas 'sim'.">
              <View style={{ flexDirection: 'row' }}>{seloEbia(p.ebia?.classificacao ?? p.classificacaoEbia)}</View>
              {p.ebia ? (
                <>
                  <LinhaInfo rotulo="Pontuação" valor={p.ebia.pontuacaoTotal} />
                  <LinhaInfo rotulo="Realizada em" valor={dataCurta(p.ebia.dataRealizacao)} />
                </>
              ) : (
                <AppText style={styles.texto}>Este participante ainda não concluiu a triagem EBIA.</AppText>
              )}
            </CartaoSecao>
          </Colunas>

          <CartaoSecao titulo="Últimos 14 dias" subtitulo="Registros feitos pelo adolescente" ajuda="Resumo do que foi registrado nos últimos 14 dias: água, atividade física e refeições.">
            <GridResponsiva minItem={150} gap={12} maxColunas={4}>
              <CartaoKpi titulo="Dias com registro" valor={diasComRegistro} icone="calendar-outline" detalhe="de 14" />
              <CartaoKpi titulo="Água (média/dia, ml)" valor={mediaAgua} icone="water-outline" detalhe="nos dias com registro" />
              <CartaoKpi titulo="Atividade (min)" valor={totalAtividade} icone="walk-outline" detalhe="soma dos 14 dias" />
              <CartaoKpi titulo="Refeições registradas" valor={totalRefeicoes} icone="restaurant-outline" detalhe="soma dos 14 dias" />
            </GridResponsiva>
            <View style={{ gap: 2 }}>
              <View style={styles.linhaDia}>
                <AppText style={[styles.th, { flex: 1 }]}>Dia</AppText>
                <AppText style={[styles.th, { flex: 1.2 }]}>Água</AppText>
                <AppText style={[styles.th, { flex: 1.2 }]}>Atividade</AppText>
                <AppText style={[styles.th, { flex: 1 }]}>Refeições</AppText>
              </View>
              {[...dias].reverse().map((d) => {
                const vazio = d.aguaMl === 0 && d.atividadeMin === 0 && d.refeicoes === 0;
                return (
                  <View key={d.data} style={styles.linhaDia}>
                    <AppText style={[styles.td, { flex: 1 }]}>{diaCurto(d.data)}</AppText>
                    <AppText style={[styles.td, { flex: 1.2 }, vazio && styles.apagado]}>{d.aguaMl ? `${d.aguaMl} ml` : '—'}</AppText>
                    <AppText style={[styles.td, { flex: 1.2 }, vazio && styles.apagado]}>{d.atividadeMin ? `${d.atividadeMin} min` : '—'}</AppText>
                    <AppText style={[styles.td, { flex: 1 }, vazio && styles.apagado]}>{d.refeicoes || '—'}</AppText>
                  </View>
                );
              })}
            </View>
          </CartaoSecao>

          <Colunas bases={[320, 320]}>
            <CartaoSecao
              titulo="Recordatório alimentar"
              subtitulo="Últimos registros da triagem"
              ajuda="Recordatório de 24 horas feito na triagem. Escore saudável e não saudável vêm da classificação dos alimentos relatados."
            >
              {p.recordatorios.length === 0 ? (
                <AppText style={styles.texto}>Nenhum recordatório registrado ainda.</AppText>
              ) : (
                p.recordatorios.map((r, i) => (
                  <View key={i} style={styles.recordatorio}>
                    <AppText style={styles.recData}>{dataCurta(r.dataReferencia)}{r.concluido ? '' : ' (incompleto)'}</AppText>
                    <AppText style={styles.texto}>
                      Saudável: {r.escoreSaudavel ?? '—'} · Não saudável: {r.escoreNaoSaudavel ?? '—'}
                    </AppText>
                  </View>
                ))
              )}
            </CartaoSecao>

            <CartaoSecao titulo="Engajamento" ajuda="Mostra quanto o adolescente usa o aplicativo e avança nas trilhas.">
              <LinhaInfo rotulo="Sequência atual" valor={`${p.sequenciaAtual} dia(s)`} />
              <LinhaInfo rotulo="Maior sequência" valor={`${p.maiorSequencia} dia(s)`} />
              <LinhaInfo rotulo="XP total" valor={p.xpTotal} />
              <LinhaInfo rotulo="Fase do mascote" valor={p.faseAtual} />
              <LinhaInfo rotulo="Lições concluídas" valor={p.licoesConcluidas} />
              <LinhaInfo rotulo="Insígnias" valor={p.insignias} />
            </CartaoSecao>
          </Colunas>
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  texto: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave, lineHeight: 19 },
  linhaDia: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: painel.linhaSuave },
  th: { fontFamily: typography.bold, fontSize: 11, color: painel.textoSuave, textTransform: 'uppercase' },
  td: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight },
  apagado: { color: painel.textoSuave },
  recordatorio: { borderLeftWidth: 3, borderLeftColor: painel.cardBorda, paddingLeft: 10, gap: 1 },
  recData: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
});
