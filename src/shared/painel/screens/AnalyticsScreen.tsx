// src/shared/painel/screens/AnalyticsScreen.tsx
// Analytics de utilização (Admin e Nutricionista). Só agregados; sem dados pessoais.
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { PainelLayout } from '../PainelLayout';
import { IntroSecao } from '../components/IntroSecao';
import { CartaoKpi } from '../components/CartaoKpi';
import { CartaoSecao } from '../components/CartaoSecao';
import { Colunas } from '../components/Colunas';
import { EstadoCarregando, EstadoErro } from '../components/EstadosPainel';
import { FiltroPeriodoPersonalizado, type EscolhaPeriodo } from '../components/FiltroPeriodoPersonalizado';
import { GraficoBarras } from '../components/GraficoBarras';
import { GraficoLinha } from '../components/GraficoLinha';
import { GridResponsiva } from '../components/GridResponsiva';
import { BarrasSemana } from '../components/widgets/BarrasSemana';
import { mediaPorDiaSemana } from '../utils/widgets';
import { useAnalyticsPainel } from '../hooks/useAnalyticsPainel';
import { rotuloTipoEscola, taxaAbandono, taxaRetencao } from '../services/analyticsService';
import { ultimosDias } from '../periodo';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { ConfigPainel } from '../types';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos } from '../tema/TemaPainelContext';

const ROTULO_ABANDONO = { licao: 'Lições', receita: 'Receitas' } as const;

function pct(parte: number, base: number): string {
  return base > 0 ? `${Math.round((parte / base) * 100)}%` : '—';
}

export default function AnalyticsScreen({ config }: { config: ConfigPainel }) {
  const styles = useEstilos(criarEstilos);
  const [escolha, setEscolha] = useState<EscolhaPeriodo>({ tipo: 'dias', dias: 30 });
  const intervalo = useMemo(
    () => (escolha.tipo === 'dias' ? ultimosDias(escolha.dias) : escolha.intervalo),
    [escolha]
  );
  const { dados, carregando, erro, eficacia, erroEficacia, habitosEscola, erroHabitosEscola, recarregar } = useAnalyticsPainel(intervalo);
  const dias = dados?.serie.map((p) => p.dia) ?? [];
  const semana = useMemo(
    () => mediaPorDiaSemana(dias, dados?.serie.map((p) => p.usuarios) ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dados]
  );

  const semDados = !!dados && dados.kpis.eventos === 0;

  return (
    <PainelLayout
      config={config}
      titulo="Analytics"
      subtitulo="Uso do aplicativo e se ele está funcionando (dados agregados)"
      acao={<FiltroPeriodoPersonalizado valor={escolha} onChange={setEscolha} />}
    >
      {erro ? (
        <EstadoErro mensagem={erro} onTentar={recarregar} />
      ) : carregando && !dados ? (
        <EstadoCarregando />
      ) : dados ? (
        <>
          <IntroSecao
            chave="analytics"
            titulo="Como ler o Analytics"
            linhas={[
              'Mostra como os adolescentes usam o aplicativo, sempre em números agregados: nenhuma pessoa é identificada.',
              'Escolha 7, 30 ou 90 dias, ou um período personalizado, no filtro do topo.',
              'Os gráficos só têm dados depois que o app atualizado começa a ser usado; períodos antes disso aparecem vazios.',
              'Funil: cada etapa conta as mesmas pessoas da etapa anterior, por isso os números só diminuem.',
              '"O app está funcionando?" mostra retenção (quem volta), a evolução média dos hábitos, os hábitos mais registrados e o engajamento por escola; "Como o app é usado" mostra o uso do dia a dia.',
              'Grupos com menos de 5 pessoas não mostram número, para ninguém ser identificado.',
            ]}
          />
          <AppText style={styles.secaoTitulo}>O app está funcionando?</AppText>
          {erroEficacia ? (
            <View style={styles.aviso}><AppText style={styles.avisoTexto}>{erroEficacia}</AppText></View>
          ) : eficacia ? (
            <>
              <Colunas bases={[340, 340]}>
                <CartaoSecao
                  titulo="Retenção"
                  subtitulo="Quem volta depois do 1º dia"
                  ajuda="Pega os adolescentes que usaram o app pela primeira vez no período escolhido e mostra que parte deles voltou exatamente 1, 7 e 30 dias depois. Só conta quem já completou esse prazo; coortes novas demais aparecem como 'ainda cedo'."
                >
                  <GraficoBarras
                    series={['Voltaram', 'Não voltaram']}
                    itens={eficacia.retencao.map((r) => {
                      const t = taxaRetencao(r.retidos, r.elegiveis);
                      return { rotulo: `Dia ${r.dia} · ${t === null ? 'ainda cedo' : `${t}%`}`, valores: [r.retidos, Math.max(0, r.elegiveis - r.retidos)] };
                    })}
                  />
                </CartaoSecao>
                <CartaoSecao
                  titulo="Hábito ao longo das semanas"
                  subtitulo="Média dos adolescentes com registro"
                  ajuda={`Dias por semana com algum registro (água, atividade ou refeição), em média, e a porcentagem de ultraprocessados nos alimentos registrados. Semanas com menos de ${eficacia.minimo_pessoas} pessoas ativas não aparecem, para não expor o hábito de uma pessoa só.`}
                >
                  <GraficoLinha
                    dias={eficacia.habitos.map((h) => h.inicio)}
                    series={[
                      { nome: 'Dias com registro (média)', valores: eficacia.habitos.map((h) => h.dias_com_registro_medio ?? 0) },
                      { nome: '% ultraprocessados', valores: eficacia.habitos.map((h) => h.pct_ultraprocessados ?? 0) },
                    ]}
                  />
                  {eficacia.habitos.every((h) => h.dias_com_registro_medio === null) && (
                    <AppText style={styles.avisoTexto}>Ainda não há semanas com pelo menos {eficacia.minimo_pessoas} adolescentes registrando.</AppText>
                  )}
                </CartaoSecao>
              </Colunas>
              <GridResponsiva minItem={200}>
                <CartaoKpi titulo="Pararam de registrar" ajuda="Adolescentes que já registraram alguma vez, mas estão há 7 dias ou mais sem registrar. É só o número, sem identificar ninguém." valor={eficacia.sem_registro_7d} icone="hourglass-outline" detalhe="há 7+ dias sem registro" />
              </GridResponsiva>

              <AppText style={styles.secaoSub}>Hábitos e escolas</AppText>
              {erroHabitosEscola ? (
                <View style={styles.aviso}><AppText style={styles.avisoTexto}>{erroHabitosEscola}</AppText></View>
              ) : habitosEscola ? (
                <>
                  <Colunas bases={[340, 340]}>
                    <CartaoSecao
                      titulo="Hábitos mais registrados"
                      subtitulo="Registros no período (e quantas pessoas)"
                      ajuda={{
                        oque: 'Quantas vezes cada hábito foi registrado no período (refeições, água, atividade física e itens in natura ou ultraprocessados) e por quantas pessoas.',
                        como: 'Barra maior = hábito mais registrado. Compare in natura com ultraprocessados para ver o perfil do que é registrado. Hábito com menos de 5 pessoas aparece como “poucos dados”.',
                        origem: 'Registros de refeição, água e atividade física dos adolescentes, somados e sem identificar ninguém.',
                      }}
                    >
                      <GraficoBarras
                        itens={habitosEscola.habitos.map((h) => ({
                          rotulo: h.registros === null ? `${h.rotulo} · poucos dados` : `${h.rotulo} · ${h.pessoas} pessoa(s)`,
                          valores: [h.registros ?? 0],
                        }))}
                      />
                    </CartaoSecao>
                    <CartaoSecao
                      titulo="Engajamento por tipo de escola"
                      subtitulo="Quem registrou no período, entre os cadastrados"
                      ajuda={{
                        oque: 'Para cada tipo de escola (pública, privada, filantrópica), quantos adolescentes cadastrados registraram algo no período.',
                        como: 'Compare as barras de “Registraram” e “Sem registro”. O número ao lado é a % de ativos e a média de dias com registro por pessoa ativa. Grupo com menos de 5 cadastrados aparece como “poucos dados”.',
                        origem: 'Tipo de escola informado no cadastro e registros de refeição, água e atividade física. Só totais por grupo.',
                      }}
                    >
                      <GraficoBarras
                        series={['Registraram', 'Sem registro']}
                        itens={habitosEscola.por_tipo_escola.map((g) => ({
                          rotulo:
                            g.ativos === null
                              ? `${rotuloTipoEscola(g.tipo)} · poucos dados`
                              : `${rotuloTipoEscola(g.tipo)} · ${g.pct_ativos}% ativos${g.dias_com_registro_medio === null ? '' : ` · ${g.dias_com_registro_medio} dias`}`,
                          valores: g.ativos === null ? [0, 0] : [g.ativos, Math.max(0, g.cadastrados - g.ativos)],
                        }))}
                        vazio="Nenhum adolescente cadastrado."
                      />
                    </CartaoSecao>
                  </Colunas>
                  {habitosEscola.por_escola.length > 0 && (
                    <CartaoSecao
                      titulo="Engajamento por escola"
                      subtitulo="Escolas com 5 ou mais participantes"
                      ajuda={{
                        oque: 'O mesmo engajamento, agora por escola (nome informado no cadastro).',
                        como: 'Serve para ver onde o app pega e onde precisa de apoio. Escolas com menos de 5 participantes ficam juntas em “Outras”, para ninguém ser identificado.',
                        origem: 'Nome da escola no cadastro e registros de refeição, água e atividade física. Só totais por escola.',
                      }}
                    >
                      <GraficoBarras
                        series={['Registraram', 'Sem registro']}
                        itens={habitosEscola.por_escola.map((g) => ({
                          rotulo: g.ativos === null ? `${g.escola} · poucos dados` : `${g.escola} · ${g.pct_ativos}% ativos`,
                          valores: g.ativos === null ? [0, 0] : [g.ativos, Math.max(0, g.cadastrados - g.ativos)],
                        }))}
                      />
                    </CartaoSecao>
                  )}
                </>
              ) : null}
            </>
          ) : null}

          <AppText style={styles.secaoTitulo}>Como o app é usado</AppText>
          <GridResponsiva minItem={150}>
            <CartaoKpi titulo="Usuários ativos" ajuda="Adolescentes diferentes que usaram o app no período. Cada pessoa conta uma vez." valor={dados.kpis.usuarios_ativos} icone="pulse-outline" />
            <CartaoKpi titulo="Sessões" ajuda="Cada abertura do app conta uma sessão; ela se renova após 30 minutos parado." valor={dados.kpis.sessoes} icone="phone-portrait-outline" />
            <CartaoKpi titulo="Eventos" ajuda="Ações registradas no app: login, registros, lições, desafios, receitas e amizades." valor={dados.kpis.eventos} icone="flash-outline" />
            <CartaoKpi titulo="Cadastros concluídos" ajuda="Contas novas criadas no período." valor={dados.kpis.cadastros} icone="person-add-outline" />
          </GridResponsiva>

          {semDados && (
            <View style={styles.aviso}>
              <AppText style={styles.avisoTexto}>
                Nenhum evento neste período. Os eventos só passam a ser coletados depois que o app atualizado for usado.
              </AppText>
            </View>
          )}

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Uso ao longo do tempo" subtitulo="Usuários ativos e sessões por dia">
              <GraficoLinha
                dias={dias}
                series={[
                  { nome: 'Usuários ativos', valores: dados.serie.map((p) => p.usuarios) },
                  { nome: 'Sessões', valores: dados.serie.map((p) => p.sessoes) },
                ]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Uso por funcionalidade" subtitulo="Eventos no período" ajuda="Quantas ações foram feitas em cada parte do app (alimentação, água, trilhas, desafios, receitas, amigos).">
              <GraficoBarras itens={dados.uso.map((u) => ({ rotulo: u.recurso, valores: [u.eventos] }))} />
            </CartaoSecao>
          </Colunas>

          <CartaoSecao
            titulo="Dias mais ativos"
            subtitulo="Média de usuários ativos por dia da semana"
            ajuda={{
              oque: 'Média de adolescentes ativos em cada dia da semana, dentro do período.',
              como: 'O dia mais forte fica em destaque. Bom para escolher quando publicar conteúdo novo.',
              origem: 'Eventos do app (usuários ativos por dia), agrupados pelo dia da semana.',
            }}
          >
            <BarrasSemana medias={semana} />
          </CartaoSecao>

          <Colunas bases={[380, 380]}>
            <CartaoSecao titulo="Desafios" subtitulo="Iniciados x concluídos por dia">
              <GraficoLinha
                dias={dias}
                series={[
                  { nome: 'Iniciados', valores: dados.serie.map((p) => p.desafios_iniciados) },
                  { nome: 'Concluídos', valores: dados.serie.map((p) => p.desafios_concluidos) },
                ]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Trilhas" subtitulo="Iniciadas x concluídas por dia">
              <GraficoLinha
                dias={dias}
                series={[
                  { nome: 'Iniciadas', valores: dados.serie.map((p) => p.trilhas_iniciadas) },
                  { nome: 'Concluídas', valores: dados.serie.map((p) => p.trilhas_concluidas) },
                ]}
              />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[380, 380]}>
            <CartaoSecao titulo="Funil de utilização" subtitulo="Mesmas pessoas, etapa por etapa" ajuda="Mostra quantos adolescentes avançam: abrir o app, fazer um registro, concluir lição, desafio e trilha. A queda entre etapas indica onde as pessoas desistem.">
              <GraficoBarras
                itens={dados.funil_uso.map((f) => ({
                  rotulo: `${f.etapa} (${pct(f.usuarios, dados.funil_uso[0]?.usuarios ?? 0)})`,
                  valores: [f.usuarios],
                }))}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Funil de entrada" subtitulo="Cadastro → onboarding → triagem" ajuda="Quantos que se cadastraram concluíram a apresentação inicial (onboarding) e a triagem nutricional.">
              <GraficoBarras
                itens={dados.funil_onboarding.map((f) => ({
                  rotulo: `${f.etapa} (${pct(f.usuarios, dados.funil_onboarding[0]?.usuarios ?? 0)})`,
                  valores: [f.usuarios],
                }))}
              />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[300, 300, 300]}>
            <CartaoSecao titulo="Abandono" subtitulo="Saiu sem concluir ÷ (saiu + concluiu)" ajuda="Proporção de lições e receitas que foram abertas e deixadas sem concluir. Quanto maior, mais vale revisar aquele conteúdo.">
              <GraficoBarras
                series={['Abandonos', 'Concluídos']}
                itens={dados.abandono.map((a) => {
                  const t = taxaAbandono(a.abandonos, a.concluidos);
                  return {
                    rotulo: `${ROTULO_ABANDONO[a.tipo] ?? a.tipo}${t === null ? '' : ` · ${t}%`}`,
                    valores: [a.abandonos, a.concluidos],
                  };
                })}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Trilhas mais usadas" subtitulo="No período">
              <GraficoBarras
                series={['Iniciadas', 'Concluídas']}
                itens={dados.top_trilhas.map((t) => ({ rotulo: t.titulo, valores: [t.iniciadas, t.concluidas] }))}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Receitas utilizadas" subtitulo="Visualizadas x concluídas">
              <GraficoBarras
                series={['Visualizadas', 'Concluídas']}
                itens={dados.top_receitas.map((r) => ({ rotulo: r.titulo, valores: [r.visualizadas, r.concluidas] }))}
              />
            </CartaoSecao>
          </Colunas>
        </>
      ) : null}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  aviso: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 14 },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 15, color: t.texto },
  secaoSub: { fontFamily: typography.bold, fontSize: 13, color: t.textoSuave },
  avisoTexto: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
}) as const;
