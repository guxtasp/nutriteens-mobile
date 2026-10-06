// src/features/admin/dashboard/screens/AdminDashboardScreen.tsx
import React, { useState } from 'react';
import { PainelLayout } from '../../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../../shared/painel/components/IntroSecao';
import { CartaoKpi } from '../../../../shared/painel/components/CartaoKpi';
import { CartaoSecao } from '../../../../shared/painel/components/CartaoSecao';
import { Colunas } from '../../../../shared/painel/components/Colunas';
import { EstadoCarregando, EstadoErro } from '../../../../shared/painel/components/EstadosPainel';
import { FiltroPeriodo } from '../../../../shared/painel/components/FiltroPeriodo';
import { GraficoBarras } from '../../../../shared/painel/components/GraficoBarras';
import { GraficoLinha } from '../../../../shared/painel/components/GraficoLinha';
import { GridResponsiva } from '../../../../shared/painel/components/GridResponsiva';
import { ItemAtividade, ListaAtividades } from '../../../../shared/painel/components/ListaAtividades';
import { useDashboardPainel } from '../../../../shared/painel/hooks/useDashboardPainel';
import { ADMIN_PAINEL } from '../../navigation/adminMenu';

export default function AdminDashboardScreen() {
  const [dias, setDias] = useState(30);
  const { dados, carregando, erro, recarregar } = useDashboardPainel(dias);

  const atividades: ItemAtividade[] = (dados?.atividades ?? []).map((a, i) => ({
    chave: `${a.tipo}-${a.quando}-${i}`,
    icone: a.tipo === 'cadastro' ? 'person-add-outline' : 'clipboard-outline',
    titulo: a.titulo,
    quando: a.quando,
  }));

  return (
    <PainelLayout
      config={ADMIN_PAINEL}
      titulo="Dashboard"
      subtitulo="Visão geral do NutriTeens"
      acao={<FiltroPeriodo valor={dias} onChange={setDias} />}
    >
      {erro ? (
        <EstadoErro mensagem={erro} onTentar={recarregar} />
      ) : carregando && !dados ? (
        <EstadoCarregando />
      ) : dados ? (
        <>
          <IntroSecao
            chave="admin_dashboard"
            titulo="Bem-vindo à Administração"
            linhas={[
              'Aqui você acompanha o uso do aplicativo pelos adolescentes. Os números mostram apenas totais, sem dados pessoais.',
              'Troque o período (7, 30 ou 90 dias) no filtro do topo; os indicadores marcados com "dias" seguem esse período.',
              'Toque no ícone "i" de cada indicador para entender o que ele conta.',
              'Você consulta, organiza e envia conteúdos para revisão. Aprovar e publicar é sempre da nutricionista.',
            ]}
          />
          <GridResponsiva minItem={150}>
            <CartaoKpi titulo="Adolescentes cadastrados" ajuda="Total de contas de adolescentes criadas no aplicativo, em qualquer data." valor={dados.kpis.adolescentes} icone="people-outline" />
            <CartaoKpi titulo={`Usuários ativos (${dias} dias)`} ajuda="Adolescentes que registraram algo no dia a dia ou concluíram uma lição no período escolhido. Cada pessoa conta uma vez." valor={dados.kpis.ativos} icone="pulse-outline" />
            <CartaoKpi titulo={`Novos usuários (${dias} dias)`} ajuda="Contas de adolescentes criadas dentro do período escolhido." valor={dados.kpis.novos} icone="person-add-outline" />
            <CartaoKpi titulo="Conteúdos publicados" ajuda="Trilhas e receitas já aprovadas pela nutricionista e visíveis para os adolescentes." valor={dados.kpis.conteudos_publicados} icone="document-text-outline" />
            <CartaoKpi
              titulo="Aguardando aprovação"
              ajuda="Conteúdos enviados para revisão que esperam decisão da nutricionista. Enquanto não forem aprovados e publicados, os adolescentes não os veem."
              valor={dados.kpis.conteudos_aguardando}
              icone="hourglass-outline"
              alerta={dados.kpis.conteudos_aguardando > 0}
            />
            <CartaoKpi titulo="Nutricionistas" ajuda="Contas com perfil de nutricionista, que validam o conteúdo nutricional." valor={dados.kpis.nutricionistas} icone="medkit-outline" />
            <CartaoKpi titulo="Desafios ativos" ajuda="Desafios diários e periódicos disponíveis hoje no aplicativo." valor={dados.kpis.desafios_ativos} icone="trophy-outline" />
          </GridResponsiva>

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Uso ao longo do tempo" subtitulo="Usuários ativos e registros por dia" ajuda="Evolução diária: quantos adolescentes usaram o app e quantos registros (refeições, água, atividades) fizeram.">
              <GraficoLinha
                dias={dados.serie_uso.map((p) => p.dia)}
                series={[
                  { nome: 'Usuários ativos', valores: dados.serie_uso.map((p) => p.usuarios) },
                  { nome: 'Registros', valores: dados.serie_uso.map((p) => p.registros) },
                ]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Recursos mais utilizados" subtitulo={`Últimos ${dias} dias`} ajuda="Funcionalidades mais usadas no período, para saber onde os adolescentes mais interagem.">
              <GraficoBarras itens={dados.recursos.map((r) => ({ rotulo: r.recurso, valores: [r.total] }))} />
            </CartaoSecao>
          </Colunas>

          <CartaoSecao titulo="Atividades recentes" ajuda="Últimos movimentos relevantes do aplicativo e do fluxo de conteúdo.">
            <ListaAtividades itens={atividades} vazio="Nenhuma atividade recente." />
          </CartaoSecao>
        </>
      ) : null}
    </PainelLayout>
  );
}
