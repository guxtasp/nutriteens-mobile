// src/shared/painel/screens/AnalyticsScreen.tsx
// Analytics de utilização (Admin e Nutricionista). Só agregados; sem dados pessoais.
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { useAnalyticsPainel } from '../hooks/useAnalyticsPainel';
import { taxaAbandono } from '../services/analyticsService';
import { ultimosDias } from '../periodo';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import type { ConfigPainel } from '../types';

const ROTULO_ABANDONO = { licao: 'Lições', receita: 'Receitas' } as const;

function pct(parte: number, base: number): string {
  return base > 0 ? `${Math.round((parte / base) * 100)}%` : '—';
}

export default function AnalyticsScreen({ config }: { config: ConfigPainel }) {
  const [escolha, setEscolha] = useState<EscolhaPeriodo>({ tipo: 'dias', dias: 30 });
  const intervalo = useMemo(
    () => (escolha.tipo === 'dias' ? ultimosDias(escolha.dias) : escolha.intervalo),
    [escolha]
  );
  const { dados, carregando, erro, recarregar } = useAnalyticsPainel(intervalo);
  const dias = dados?.serie.map((p) => p.dia) ?? [];

  const semDados = !!dados && dados.kpis.eventos === 0;

  return (
    <PainelLayout
      config={config}
      titulo="Analytics"
      subtitulo="Utilização do aplicativo (dados agregados)"
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
            ]}
          />
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

const styles = StyleSheet.create({
  aviso: { backgroundColor: painel.card, borderRadius: painel.cardRaio, borderWidth: 2, borderColor: painel.cardBorda, padding: 14 },
  avisoTexto: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
});
