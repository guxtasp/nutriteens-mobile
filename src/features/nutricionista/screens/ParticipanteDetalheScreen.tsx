// src/features/nutricionista/screens/ParticipanteDetalheScreen.tsx
// Acompanhamento de um participante, organizado em abas:
//  - Visão geral: resumo dos últimos 14 dias, cadastro e engajamento
//  - Avaliações: EBIA e recordatório (e as próximas avaliações) na mesma moldura
//  - Registros: dia a dia dos últimos 14 dias
// Só o que a nutricionista precisa para o trabalho profissional.
import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { AbasPainel, type AbaPainel } from '../../../shared/painel/components/AbasPainel';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { CartaoKpi } from '../../../shared/painel/components/CartaoKpi';
import { Colunas } from '../../../shared/painel/components/Colunas';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { LinhaInfo } from '../../../shared/painel/components/ControlesLista';
import { dataCurta, ultimoAcessoTexto } from '../../../shared/painel/formatadores';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { NUTRICIONISTA_PAINEL } from '../navigation/nutricionistaMenu';
import { DetalheParticipante, buscarParticipante, calcularImc } from '../services/participantesService';
import { PerfilParticipante } from '../components/PerfilParticipante';
import { AvaliacaoEbia } from '../components/AvaliacaoEbia';
import { AvaliacaoRecordatorio } from '../components/AvaliacaoRecordatorio';
import { RegistrosParticipante } from '../components/RegistrosParticipante';

type Aba = 'visao' | 'avaliacoes' | 'registros';
const ABAS: AbaPainel<Aba>[] = [
  { chave: 'visao', label: 'Visão geral', icone: 'grid-outline' },
  { chave: 'avaliacoes', label: 'Avaliações', icone: 'clipboard-outline' },
  { chave: 'registros', label: 'Registros', icone: 'calendar-outline' },
];

export default function ParticipanteDetalheScreen({ route }: { route: { params: { id: string } } }) {
  const id = route.params?.id;
  const styles = useEstilos(criarEstilos);
  const [p, setP] = useState<DetalheParticipante | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>('visao');
  const [verAnteriores, setVerAnteriores] = useState(false);

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
  const [recente, ...anteriores] = p?.recordatorios ?? [];

  return (
    <PainelLayout config={NUTRICIONISTA_PAINEL} titulo="Participante" subtitulo="Acompanhamento individual" voltar>
      {carregando && !p ? (
        <EstadoCarregando />
      ) : erro || !p ? (
        <EstadoErro mensagem={erro ?? 'Participante não encontrado.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <View style={{ gap: 16 }}>
          <IntroSecao
            chave="nutri_participante_detalhe"
            titulo="Como ler esta página"
            linhas={[
              'Visão geral resume o participante; Avaliações mostra a triagem inicial; Registros mostra o hábito dos últimos 14 dias.',
              'Estes dados são sensíveis: use apenas para o acompanhamento profissional e não compartilhe fora da equipe.',
            ]}
          />

          <PerfilParticipante p={p} nome={titulo} imc={imc} />
          <AbasPainel abas={ABAS} ativa={aba} onChange={setAba} />

          {aba === 'visao' && (
            <>
              <CartaoSecao titulo="Últimos 14 dias" subtitulo="Registros feitos pelo adolescente" ajuda="Resumo do que foi registrado nos últimos 14 dias: água, atividade física e refeições.">
                <GridResponsiva minItem={150} gap={12} maxColunas={4}>
                  <CartaoKpi titulo="Dias com registro" valor={diasComRegistro} icone="calendar-outline" detalhe="de 14" />
                  <CartaoKpi titulo="Água (média/dia, ml)" valor={mediaAgua} icone="water-outline" detalhe="nos dias com registro" />
                  <CartaoKpi titulo="Atividade (min)" valor={totalAtividade} icone="walk-outline" detalhe="soma dos 14 dias" />
                  <CartaoKpi titulo="Refeições registradas" valor={totalRefeicoes} icone="restaurant-outline" detalhe="soma dos 14 dias" />
                </GridResponsiva>
              </CartaoSecao>

              <Colunas bases={[320, 320]}>
                <CartaoSecao titulo="Cadastro" ajuda="Dados informados no cadastro. O IMC é só uma referência e deve ser interpretado com as curvas de crescimento adequadas à idade.">
                  <LinhaInfo rotulo="Gênero" valor={p.genero} />
                  <LinhaInfo rotulo="Instituição" valor={p.instituicaoEnsino} />
                  <LinhaInfo rotulo="Cadastro" valor={dataCurta(p.criadoEm)} />
                  <LinhaInfo rotulo="Último acesso" valor={ultimoAcessoTexto(p.ultimoAcesso)} />
                </CartaoSecao>
                <CartaoSecao titulo="Engajamento" ajuda="Mostra quanto o adolescente usa o aplicativo e avança nas trilhas.">
                  <LinhaInfo rotulo="Sequência atual" valor={`${p.sequenciaAtual} dia(s)`} />
                  <LinhaInfo rotulo="Maior sequência" valor={`${p.maiorSequencia} dia(s)`} />
                  <LinhaInfo rotulo="XP total" valor={p.xpTotal} />
                  <LinhaInfo rotulo="Lições concluídas" valor={p.licoesConcluidas} />
                  <LinhaInfo rotulo="Insígnias" valor={p.insignias} />
                </CartaoSecao>
              </Colunas>
            </>
          )}

          {aba === 'avaliacoes' && (
            <>
              <AvaliacaoEbia p={p} />
              {recente ? (
                <AvaliacaoRecordatorio r={recente} />
              ) : (
                <CartaoSecao titulo="Recordatório alimentar">
                  <AppText style={styles.texto}>Nenhum recordatório registrado ainda.</AppText>
                </CartaoSecao>
              )}
              {anteriores.length > 0 && (
                <>
                  <Pressable onPress={() => setVerAnteriores((v) => !v)} accessibilityRole="button" style={styles.alternar}>
                    <AppText style={styles.alternarTexto}>
                      {verAnteriores ? 'Ocultar recordatórios anteriores' : `Ver recordatórios anteriores (${anteriores.length})`}
                    </AppText>
                  </Pressable>
                  {verAnteriores && anteriores.map((r, i) => <AvaliacaoRecordatorio key={i} r={r} titulo="Recordatório anterior" />)}
                </>
              )}
            </>
          )}

          {aba === 'registros' && <RegistrosParticipante dias={dias} />}
        </View>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  texto: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, lineHeight: 19 } as const,
  alternar: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 } as const,
  alternarTexto: { fontFamily: typography.bold, fontSize: 13, color: t.destaque } as const,
});
