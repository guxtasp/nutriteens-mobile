// src/features/nutricionista/dashboard/screens/NutricionistaDashboardScreen.tsx
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
import type { IconeNome } from '../../../../shared/painel/types';
import {
  conclusaoPorTrilha,
  mediaPorDiaSemana,
  saudacao,
  somar,
  taxaPercentual,
  tendenciaPct,
} from '../../../../shared/painel/utils/widgets';
import { NUTRICIONISTA_PAINEL } from '../../navigation/nutricionistaMenu';
import { usePendentesScanner } from '../../../adolescente/scanner/hooks/usePendentesScanner';

const REGISTRO: Record<string, { icone: IconeNome; texto: string }> = {
  alimentacao: { icone: 'restaurant-outline', texto: 'Alimentação registrada' },
  agua: { icone: 'water-outline', texto: 'Água registrada' },
  atividade: { icone: 'fitness-outline', texto: 'Atividade física registrada' },
};

const ATALHOS: AtalhoHero[] = [
  { rota: 'NutriAprovacoes', label: 'Aprovações', icone: 'checkmark-done-outline', destaque: true },
  { rota: 'NutriReceitas', label: 'Receitas', icone: 'restaurant-outline' },
  { rota: 'NutriTrilhas', label: 'Trilhas', icone: 'map-outline' },
  { rota: 'ParticipantesList', label: 'Participantes', icone: 'people-outline' },
  { rota: 'NutriAnalytics', label: 'Analytics', icone: 'stats-chart-outline' },
];

export default function NutricionistaDashboardScreen() {
  const [dias, setDias] = useState(30);
  const { dados, carregando, erro, recarregar } = useDashboardPainel(dias);
  const pendentesScanner = usePendentesScanner();

  // só o código do participante (NT-000001) — sem nome, por privacidade
  const recentes: ItemAtividade[] = (dados?.recentes ?? []).map((r, i) => ({
    chave: `${r.tipo}-${r.quando}-${i}`,
    icone: REGISTRO[r.tipo]?.icone ?? 'ellipse-outline',
    titulo: REGISTRO[r.tipo]?.texto ?? r.tipo,
    detalhe: r.codigo ?? undefined,
    quando: r.quando,
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
      icone: 'checkmark-done-outline',
      titulo: 'Conteúdos para você revisar',
      detalhe: 'Leia tudo antes de aprovar, rejeitar ou publicar.',
      rota: 'NutriAprovacoes',
      quantidade: aguardando,
    },
    {
      chave: 'scanner',
      icone: 'barcode-outline',
      titulo: 'Pedidos de produtos (scanner)',
      detalhe: 'Produtos escaneados que não estavam na base.',
      rota: 'NutriProdutosScanner',
      quantidade: pendentesScanner ?? 0,
    },
  ];

  const resumo = dados
    ? aguardando > 0
      ? `${formatarNumero(aguardando)} conteúdo(s) esperam a sua decisão · ${formatarNumero(dados.kpis.ativos)} participante(s) ativo(s) nos últimos ${dias} dias`
      : `Nenhuma aprovação pendente · ${formatarNumero(dados.kpis.ativos)} participante(s) ativo(s) nos últimos ${dias} dias`
    : 'Carregando o resumo...';

  return (
    <PainelLayout
      config={NUTRICIONISTA_PAINEL}
      titulo="Dashboard"
      subtitulo="Acompanhamento e validação nutricional"
      acao={<FiltroPeriodo valor={dias} onChange={setDias} />}
    >
      {erro ? (
        <EstadoErro mensagem={erro} onTentar={recarregar} />
      ) : carregando && !dados ? (
        <EstadoCarregando />
      ) : dados ? (
        <>
          <HeroPainel saudacao={saudacao(new Date().getHours())} papel="Nutricionista" resumo={resumo} atalhos={ATALHOS} />
          <IntroSecao
            chave="nutri_dashboard"
            titulo="Seu painel de acompanhamento"
            linhas={[
              'Você é a responsável técnica pelo conteúdo nutricional: nada vai para os adolescentes sem a sua aprovação.',
              'Em "Aprovações" fica a fila do que espera a sua decisão. Abra cada item e leia tudo antes de aprovar ou rejeitar.',
              'Os números mostram totais e participantes pelo código (NT-xxxxxx), sem nomes ou dados pessoais.',
              'Toque no ícone "i" de cada indicador para ver o que ele conta. A seta de tendência compara a segunda metade do período com a primeira.',
              'O botão de lua/sol no menu troca entre o tema claro e o escuro.',
            ]}
          />
          <GridResponsiva minItem={150}>
            <CartaoKpi titulo="Participantes" ajuda="Adolescentes cadastrados no aplicativo." valor={dados.kpis.adolescentes} icone="people-outline" />
            <CartaoKpi
              titulo={`Participantes ativos (${dias} dias)`}
              ajuda="Adolescentes que registraram algo ou concluíram uma lição no período escolhido. O minigráfico mostra quantos usaram o app a cada dia."
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
            <CartaoKpi
              titulo="Conteúdos aguardando aprovação"
              valor={dados.kpis.conteudos_aguardando}
              icone="hourglass-outline"
              alerta={dados.kpis.conteudos_aguardando > 0}
            />
            <CartaoKpi titulo="Trilhas ativas" ajuda="Trilhas educativas publicadas e visíveis para os adolescentes." valor={dados.kpis.trilhas_ativas} icone="map-outline" />
            <CartaoKpi titulo="Desafios ativos" ajuda="Desafios disponíveis hoje no aplicativo." valor={dados.kpis.desafios_ativos} icone="trophy-outline" />
          </GridResponsiva>

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Utilização do aplicativo" subtitulo="Participantes ativos por dia" ajuda="Quantos adolescentes usaram o app em cada dia do período.">
              <GraficoLinha
                dias={(dados.serie_uso ?? []).map((p) => p.dia)}
                series={[{ nome: 'Participantes ativos', valores: derivados.usuarios }]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Precisa da sua atenção" subtitulo="Toque para abrir" ajuda="O que está esperando uma ação. Some da lista quando não houver pendências.">
              <PendenciasPainel itens={pendencias} />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[300, 300, 300]}>
            <CartaoSecao titulo="Dias mais ativos" subtitulo="Média de participantes ativos por dia da semana" ajuda="Média de adolescentes ativos em cada dia da semana dentro do período escolhido. O dia mais forte fica em verde. Bom para escolher quando publicar conteúdo novo.">
              <BarrasSemana medias={derivados.semana} />
            </CartaoSecao>
            <CartaoSecao titulo="Conclusão de desafios" subtitulo="Missões diárias concluídas ÷ atribuídas" ajuda="Iniciado = missão atribuída ao adolescente. Concluído = missão cumprida, com pontos concedidos.">
              <AnelProgresso
                pct={derivados.taxaDesafios}
                rotulo="concluídas"
                legenda={derivados.iniciados === 0 ? 'Nenhuma missão atribuída no período.' : `${formatarNumero(derivados.concluidos)} de ${formatarNumero(derivados.iniciados)} missões`}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Recursos mais utilizados" subtitulo={`Últimos ${dias} dias`} ajuda="Funcionalidades mais usadas: alimentação, água, atividade, trilhas e outras.">
              <GraficoBarras itens={dados.recursos.map((r) => ({ rotulo: r.recurso, valores: [r.total] }))} />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Desafios iniciados e concluídos" subtitulo="Missões diárias atribuídas x concluídas" ajuda="Iniciado = missão atribuída ao adolescente. Concluído = missão cumprida, com pontos concedidos.">
              <GraficoLinha
                dias={(dados.serie_desafios ?? []).map((p) => p.dia)}
                series={[
                  { nome: 'Iniciados', valores: (dados.serie_desafios ?? []).map((p) => p.iniciados) },
                  { nome: 'Concluídos', valores: (dados.serie_desafios ?? []).map((p) => p.concluidos) },
                ]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Conclusão das trilhas" subtitulo="Quem concluiu entre quem iniciou" ajuda="Iniciada = o adolescente concluiu ao menos uma lição. Concluída = concluiu todas as lições da trilha.">
              <RankingTrilhas itens={derivados.trilhas} />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Trilhas iniciadas e concluídas" subtitulo="Total acumulado por trilha" ajuda="Iniciada = o adolescente concluiu ao menos uma lição. Concluída = concluiu todas as lições da trilha.">
              <GraficoBarras
                series={['Iniciadas', 'Concluídas']}
                itens={(dados.trilhas ?? []).map((t) => ({ rotulo: t.titulo, valores: [t.iniciadas, t.concluidas] }))}
                vazio="Nenhuma trilha ativa."
              />
            </CartaoSecao>
            <CartaoSecao titulo="Registros recentes" subtitulo="Identificados apenas pelo código do participante" ajuda="Últimos registros feitos pelos adolescentes. Por privacidade aparece só o código, nunca o nome.">
              <ListaAtividades itens={recentes} vazio="Nenhum registro recente." />
            </CartaoSecao>
          </Colunas>
        </>
      ) : null}
    </PainelLayout>
  );
}
