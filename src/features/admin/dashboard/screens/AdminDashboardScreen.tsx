// src/features/admin/dashboard/screens/AdminDashboardScreen.tsx
import React, { useMemo, useState } from 'react';
import { PainelLayout } from '../../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../../shared/painel/components/IntroSecao';
import { CartaoKpi } from '../../../../shared/painel/components/CartaoKpi';
import { CartaoSecao } from '../../../../shared/painel/components/CartaoSecao';
import { Colunas } from '../../../../shared/painel/components/Colunas';
import { EstadoCarregando, EstadoErro } from '../../../../shared/painel/components/EstadosPainel';
import { FiltroPeriodo } from '../../../../shared/painel/components/FiltroPeriodo';
import { GraficoLinha } from '../../../../shared/painel/components/GraficoLinha';
import { GridResponsiva } from '../../../../shared/painel/components/GridResponsiva';
import { ItemAtividade, ListaAtividades } from '../../../../shared/painel/components/ListaAtividades';
import { HeroPainel, type AtalhoHero } from '../../../../shared/painel/components/widgets/HeroPainel';
import { PendenciasPainel, type Pendencia } from '../../../../shared/painel/components/widgets/PendenciasPainel';
import { useDashboardPainel } from '../../../../shared/painel/hooks/useDashboardPainel';
import { formatarNumero } from '../../../../shared/painel/formatadores';
import { saudacao, tendenciaPct } from '../../../../shared/painel/utils/widgets';
import { ADMIN_PAINEL } from '../../navigation/adminMenu';
import { usePendentesScanner } from '../../../adolescente/scanner/hooks/usePendentesScanner';

const ATALHOS: AtalhoHero[] = [
  { rota: 'AdminConteudos', label: 'Conteúdos', icone: 'document-text-outline', destaque: true },
  { rota: 'AdminReceitas', label: 'Receitas', icone: 'restaurant-outline' },
  { rota: 'AlimentosList', label: 'Alimentos', icone: 'nutrition-outline' },
  { rota: 'Usuarios', label: 'Usuários', icone: 'people-outline' },
  { rota: 'Metricas', label: 'Analytics', icone: 'stats-chart-outline' },
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

  // só o necessário para a visão geral; a análise de uso (dias, recursos, desafios, trilhas) fica em Analytics
  const derivados = useMemo(() => {
    const serieUso = dados?.serie_uso ?? [];
    const usuarios = serieUso.map((p) => p.usuarios);
    return { usuarios, tendUsuarios: tendenciaPct(usuarios) };
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
              'Esta é a visão geral e o que precisa da sua ação hoje. Os números mostram apenas totais, sem dados pessoais.',
              'Para entender como o app é usado (retenção, recursos mais usados, funis, trilhas e desafios), abra Analytics no menu.',
              'Troque o período (7, 30 ou 90 dias) no filtro do topo; os indicadores marcados com "dias" seguem esse período.',
              'Toque no ícone "i" de cada indicador para entender o que ele conta. A seta de tendência compara a segunda metade do período com a primeira.',
              'Você consulta, organiza e envia conteúdos para revisão. Aprovar e publicar é sempre da nutricionista.',
              'O botão de lua/sol no menu troca entre o tema claro e o escuro.',
            ]}
          />
          <GridResponsiva minItem={150}>
            <CartaoKpi titulo="Adolescentes cadastrados" ajuda={{ oque: "Total de contas de adolescentes criadas no aplicativo, em qualquer data.", como: "Número acumulado: só cresce. Para ver o ritmo de entrada, use “Novos usuários”.", origem: "Tabela de perfis (profiles), papel adolescente." }} valor={dados.kpis.adolescentes} icone="people-outline" />
            <CartaoKpi
              titulo={`Usuários ativos (${dias} dias)`}
              ajuda={{ oque: "Adolescentes que registraram algo ou concluíram uma lição no período escolhido.", como: "Cada pessoa conta uma vez. O minigráfico mostra quantos usaram o app a cada dia; a etiqueta compara a 2ª metade do período com a 1ª.", origem: "Registros de refeição, água e atividade física e lições concluídas." }}
              valor={dados.kpis.ativos}
              icone="pulse-outline"
              sparkline={derivados.usuarios}
              tendencia={derivados.tendUsuarios}
            />
            <CartaoKpi titulo={`Novos usuários (${dias} dias)`} ajuda={{ oque: "Contas de adolescentes criadas dentro do período escolhido.", como: "Compare com o total de cadastrados para ver o ritmo de crescimento.", origem: "Tabela de perfis (profiles), pela data de criação." }} valor={dados.kpis.novos} icone="person-add-outline" />
            <CartaoKpi titulo="Conteúdos publicados" ajuda={{ oque: "Trilhas e receitas aprovadas pela nutricionista e visíveis para os adolescentes.", como: "Número maior significa mais conteúdo disponível. Itens em revisão não entram.", origem: "Fluxo de conteúdo (status publicado) de trilhas e receitas." }} valor={dados.kpis.conteudos_publicados} icone="document-text-outline" />
            <CartaoKpi
              titulo="Aguardando aprovação"
              ajuda={{ oque: "Conteúdos enviados para revisão que aguardam decisão da nutricionista.", como: "O ideal é próximo de zero. Enquanto não forem aprovados, os adolescentes não os veem.", origem: "Fluxo de conteúdo (status em revisão)." }}
              valor={dados.kpis.conteudos_aguardando}
              icone="hourglass-outline"
              alerta={dados.kpis.conteudos_aguardando > 0}
            />
            <CartaoKpi titulo="Nutricionistas" ajuda={{ oque: "Contas com perfil de nutricionista, que validam o conteúdo nutricional.", como: "Mostra a equipe disponível para revisar conteúdo e acompanhar participantes.", origem: "Tabela de perfis (profiles), papel nutricionista." }} valor={dados.kpis.nutricionistas} icone="medkit-outline" />
            <CartaoKpi titulo="Desafios ativos" ajuda={{ oque: "Desafios diários e periódicos disponíveis hoje no aplicativo.", como: "Se ficar muito baixo, os adolescentes ficam sem missões para cumprir.", origem: "Catálogos de missões diárias e periódicas (somente as ativas)." }} valor={dados.kpis.desafios_ativos} icone="trophy-outline" />
          </GridResponsiva>

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Usuários ativos por dia" subtitulo={`Últimos ${dias} dias`} ajuda={{ oque: "Quantos adolescentes usaram o app em cada dia do período.", como: "Serve só como pulso rápido. Para retenção, funis e recursos mais usados, abra Analytics.", origem: "Registros de refeição, água e atividade física e lições concluídas, por dia." }}>
              <GraficoLinha
                dias={(dados.serie_uso ?? []).map((p) => p.dia)}
                series={[{ nome: 'Usuários ativos', valores: derivados.usuarios }]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Precisa da sua atenção" subtitulo="Toque para abrir" ajuda={{ oque: "Lista do que está esperando uma ação sua.", como: "Toque no item para abrir. Some da lista quando não houver pendências.", origem: "Fluxo de conteúdo e solicitações do painel." }}>
              <PendenciasPainel itens={pendencias} />
            </CartaoSecao>
          </Colunas>

          <CartaoSecao titulo="Atividades recentes" ajuda={{ oque: "Últimos movimentos relevantes do aplicativo e do fluxo de conteúdo.", como: "Do mais recente para o mais antigo; serve para acompanhar o que acabou de acontecer.", origem: "Fluxo de conteúdo, cadastros e registros recentes." }}>
            <ListaAtividades itens={atividades} vazio="Nenhuma atividade recente." />
          </CartaoSecao>
        </>
      ) : null}
    </PainelLayout>
  );
}
