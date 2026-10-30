// src/features/admin/dashboard/screens/AdminDashboardScreen.tsx
import React, { useMemo, useState } from 'react';
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
import { AnelProgresso } from '../../../../shared/painel/components/widgets/AnelProgresso';
import { BarrasSemana } from '../../../../shared/painel/components/widgets/BarrasSemana';
import { HeroPainel, type AtalhoHero } from '../../../../shared/painel/components/widgets/HeroPainel';
import { PendenciasPainel, type Pendencia } from '../../../../shared/painel/components/widgets/PendenciasPainel';
import { RankingTrilhas } from '../../../../shared/painel/components/widgets/RankingTrilhas';
import { useDashboardPainel } from '../../../../shared/painel/hooks/useDashboardPainel';
import { formatarNumero } from '../../../../shared/painel/formatadores';
import {
  conclusaoPorTrilha,
  mediaPorDiaSemana,
  saudacao,
  somar,
  taxaPercentual,
  tendenciaPct,
} from '../../../../shared/painel/utils/widgets';
import { ADMIN_PAINEL } from '../../navigation/adminMenu';
import { usePendentesScanner } from '../../../adolescente/scanner/hooks/usePendentesScanner';

const ATALHOS: AtalhoHero[] = [
  { rota: 'AdminConteudos', label: 'Conteúdos', icone: 'document-text-outline', destaque: true },
  { rota: 'AdminReceitas', label: 'Receitas', icone: 'restaurant-outline' },
  { rota: 'AlimentosList', label: 'Alimentos', icone: 'nutrition-outline' },
  { rota: 'Usuarios', label: 'Usuários', icone: 'people-outline' },
  { rota: 'AdminExportar', label: 'Exportar dados', icone: 'download-outline' },
];

export default function AdminDashboardScreen() {
  const [dias, setDias] = useState(30);
  const { dados, carregando, erro, recarregar } = useDashboardPainel(dias);
  const pendentesScanner = usePendentesScanner();

  const atividades: ItemAtividade[] = (dados?.atividades ?? []).map((a, i) => ({
    chave: `${a.tipo}-${a.quando}-${i}`,
    icone: a.tipo === 'cadastro' ? 'person-add-outline' : 'clipboard-outline',
    titulo: a.titulo,
    quando: a.quando,
  }));

  // tudo abaixo vem dos números que a RPC já devolve (sem consulta nova)
  const derivados = useMemo(() => {
    const serieUso = dados?.serie_uso ?? [];
    const usuarios = serieUso.map((p) => p.usuarios);
    const registros = serieUso.map((p) => p.registros);
    const desafios = dados?.serie_desafios ?? [];
    const iniciados = somar(desafios.map((p) => p.iniciados));
    const concluidos = somar(desafios.map((p) => p.concluidos));
    return {
      usuarios,
      registros,
      totalRegistros: somar(registros),
      tendUsuarios: tendenciaPct(usuarios),
      tendRegistros: tendenciaPct(registros),
      semana: mediaPorDiaSemana(serieUso.map((p) => p.dia), usuarios),
      iniciados,
      concluidos,
      taxaDesafios: taxaPercentual(concluidos, iniciados),
      trilhas: conclusaoPorTrilha(dados?.trilhas ?? []),
    };
  }, [dados]);

  const aguardando = dados?.kpis.conteudos_aguardando ?? 0;
  const pendencias: Pendencia[] = [
    {
      chave: 'aprovacao',
      icone: 'hourglass-outline',
      titulo: 'Conteúdos aguardando aprovação',
      detalhe: 'Enviados para a nutricionista. Acompanhe o andamento.',
      rota: 'AdminConteudos',
      quantidade: aguardando,
    },
    {
      chave: 'scanner',
      icone: 'barcode-outline',
      titulo: 'Pedidos de produtos (scanner)',
      detalhe: 'Produtos escaneados que não estavam na base.',
      rota: 'AdminProdutosScanner',
      quantidade: pendentesScanner ?? 0,
    },
  ];

  const resumo = dados
    ? `${formatarNumero(aguardando)} conteúdo(s) em aprovação · ${formatarNumero(dados.kpis.ativos)} adolescente(s) ativo(s) nos últimos ${dias} dias`
    : 'Carregando o resumo...';

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
          <HeroPainel saudacao={saudacao(new Date().getHours())} papel="Administração" resumo={resumo} atalhos={ATALHOS} />
          <IntroSecao
            chave="admin_dashboard"
            titulo="Bem-vindo à Administração"
            linhas={[
              'Aqui você acompanha o uso do aplicativo pelos adolescentes. Os números mostram apenas totais, sem dados pessoais.',
              'Troque o período (7, 30 ou 90 dias) no filtro do topo; os indicadores marcados com "dias" seguem esse período.',
              'Toque no ícone "i" de cada indicador para entender o que ele conta. A seta de tendência compara a segunda metade do período com a primeira.',
              'Você consulta, organiza e envia conteúdos para revisão. Aprovar e publicar é sempre da nutricionista.',
              'O botão de lua/sol no menu troca entre o tema claro e o escuro.',
            ]}
          />
          <GridResponsiva minItem={150}>
            <CartaoKpi titulo="Adolescentes cadastrados" ajuda="Total de contas de adolescentes criadas no aplicativo, em qualquer data." valor={dados.kpis.adolescentes} icone="people-outline" />
            <CartaoKpi
              titulo={`Usuários ativos (${dias} dias)`}
              ajuda="Adolescentes que registraram algo no dia a dia ou concluíram uma lição no período escolhido. Cada pessoa conta uma vez. O minigráfico mostra quantos usaram o app a cada dia."
              valor={dados.kpis.ativos}
              icone="pulse-outline"
              sparkline={derivados.usuarios}
              tendencia={derivados.tendUsuarios}
            />
            <CartaoKpi
              titulo={`Registros (${dias} dias)`}
              ajuda="Soma das refeições, água e atividades registradas no período. O minigráfico mostra o total por dia."
              valor={derivados.totalRegistros}
              icone="create-outline"
              sparkline={derivados.registros}
              tendencia={derivados.tendRegistros}
            />
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
                dias={(dados.serie_uso ?? []).map((p) => p.dia)}
                series={[
                  { nome: 'Usuários ativos', valores: derivados.usuarios },
                  { nome: 'Registros', valores: derivados.registros },
                ]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Precisa da sua atenção" subtitulo="Toque para abrir" ajuda="O que está esperando uma ação. Some da lista quando não houver pendências.">
              <PendenciasPainel itens={pendencias} />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[300, 300, 300]}>
            <CartaoSecao titulo="Dias mais ativos" subtitulo="Média de usuários ativos por dia da semana" ajuda="Média de adolescentes ativos em cada dia da semana dentro do período escolhido. O dia mais forte fica em verde.">
              <BarrasSemana medias={derivados.semana} />
            </CartaoSecao>
            <CartaoSecao titulo="Conclusão de desafios" subtitulo="Missões diárias concluídas ÷ atribuídas" ajuda="Das missões diárias atribuídas aos adolescentes no período, quantas foram cumpridas.">
              <AnelProgresso
                pct={derivados.taxaDesafios}
                rotulo="concluídas"
                legenda={derivados.iniciados === 0 ? 'Nenhuma missão atribuída no período.' : `${formatarNumero(derivados.concluidos)} de ${formatarNumero(derivados.iniciados)} missões`}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Recursos mais utilizados" subtitulo={`Últimos ${dias} dias`} ajuda="Funcionalidades mais usadas no período, para saber onde os adolescentes mais interagem.">
              <GraficoBarras itens={dados.recursos.map((r) => ({ rotulo: r.recurso, valores: [r.total] }))} />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Conclusão das trilhas" subtitulo="Quem concluiu entre quem iniciou" ajuda="Para cada trilha: das pessoas que concluíram ao menos uma lição, quantas chegaram ao fim.">
              <RankingTrilhas itens={derivados.trilhas} />
            </CartaoSecao>
            <CartaoSecao titulo="Atividades recentes" ajuda="Últimos movimentos relevantes do aplicativo e do fluxo de conteúdo.">
              <ListaAtividades itens={atividades} vazio="Nenhuma atividade recente." />
            </CartaoSecao>
          </Colunas>
        </>
      ) : null}
    </PainelLayout>
  );
}
