// src/features/nutricionista/dashboard/screens/NutricionistaDashboardScreen.tsx
//
// Visão geral da Nutricionista: o que espera a decisão dela vem primeiro (a fila de
// aprovações é a principal responsabilidade do papel), depois indicadores clicáveis,
// o pulso de uso e os registros recentes (só pelo código do participante, LGPD).
import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../../shared/painel/components/IntroSecao';
import { CartaoKpi } from '../../../../shared/painel/components/CartaoKpi';
import { CartaoSecao } from '../../../../shared/painel/components/CartaoSecao';
import { Colunas } from '../../../../shared/painel/components/Colunas';
import { ControlesDashboard } from '../../../../shared/painel/components/ControlesDashboard';
import { EstadoCarregando, EstadoErro } from '../../../../shared/painel/components/EstadosPainel';
import { GraficoLinha } from '../../../../shared/painel/components/GraficoLinha';
import { GridResponsiva } from '../../../../shared/painel/components/GridResponsiva';
import { ItemAtividade, ListaAtividades } from '../../../../shared/painel/components/ListaAtividades';
import { HeroPainel, type AtalhoHero } from '../../../../shared/painel/components/widgets/HeroPainel';
import { PendenciasPainel, type Pendencia } from '../../../../shared/painel/components/widgets/PendenciasPainel';
import { useDashboardPainel } from '../../../../shared/painel/hooks/useDashboardPainel';
import { formatarNumero } from '../../../../shared/painel/formatadores';
import type { IconeNome } from '../../../../shared/painel/types';
import { saudacao, tendenciaPct } from '../../../../shared/painel/utils/widgets';
import { NUTRICIONISTA_PAINEL } from '../../navigation/nutricionistaMenu';
import { usePendentesScanner } from '../../../adolescente/scanner/hooks/usePendentesScanner';

const REGISTRO: Record<string, { icone: IconeNome; texto: string }> = {
  alimentacao: { icone: 'restaurant-outline', texto: 'Alimentação registrada' },
  agua: { icone: 'water-outline', texto: 'Água registrada' },
  atividade: { icone: 'fitness-outline', texto: 'Atividade física registrada' },
};

const ATALHOS: AtalhoHero[] = [
  { rota: 'NutriAprovacoes', label: 'Aprovações', icone: 'checkmark-done-outline', destaque: true },
  { rota: 'ParticipantesList', label: 'Participantes', icone: 'people-outline' },
  { rota: 'NutriTrilhas', label: 'Trilhas', icone: 'map-outline' },
  { rota: 'NutriReceitas', label: 'Receitas', icone: 'restaurant-outline' },
  { rota: 'NutriAnalytics', label: 'Analytics', icone: 'stats-chart-outline' },
];

export default function NutricionistaDashboardScreen() {
  const navigation = useNavigation<any>();
  const [dias, setDias] = useState(30);
  const { dados, carregando, erro, recarregar, atualizadoEm } = useDashboardPainel(dias);
  const pendentesScanner = usePendentesScanner();
  const abrir = (rota: string) => () => navigation.navigate(rota);

  // só o código do participante (NT-000001) — sem nome, por privacidade
  const recentes: ItemAtividade[] = (dados?.recentes ?? []).map((r, i) => ({
    chave: `${r.tipo}-${r.quando}-${i}`,
    icone: REGISTRO[r.tipo]?.icone ?? 'ellipse-outline',
    titulo: REGISTRO[r.tipo]?.texto ?? r.tipo,
    detalhe: r.codigo ?? undefined,
    quando: r.quando,
  }));

  const derivados = useMemo(() => {
    const usuarios = (dados?.serie_uso ?? []).map((p) => p.usuarios);
    return { usuarios, tendUsuarios: tendenciaPct(usuarios) };
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
      acao={<ControlesDashboard dias={dias} onDias={setDias} atualizadoEm={atualizadoEm} carregando={carregando} onAtualizar={recarregar} />}
    >
      {erro && !dados ? (
        <EstadoErro mensagem={erro} onTentar={recarregar} />
      ) : !dados ? (
        <EstadoCarregando texto="Carregando o seu painel…" />
      ) : (
        <>
          {!!erro && <EstadoErro mensagem={erro} onTentar={recarregar} />}
          <HeroPainel saudacao={saudacao(new Date().getHours())} papel="Nutricionista" resumo={resumo} atalhos={ATALHOS} />
          <IntroSecao
            chave="nutri_dashboard"
            titulo="Seu painel de acompanhamento"
            linhas={[
              'Você é a responsável técnica pelo conteúdo nutricional: nada vai para os adolescentes sem a sua aprovação.',
              'Em "Aprovações" fica a fila do que espera a sua decisão. Abra cada item e leia tudo antes de aprovar ou rejeitar.',
              'Toque em um indicador para abrir a lista relacionada (participantes, aprovações, trilhas, desafios).',
              'Os números mostram totais e participantes pelo código (NT-xxxxxx), sem nomes ou dados pessoais.',
              'Para entender como o app é usado (retenção, recursos, funis, trilhas e desafios), abra Analytics.',
              'Toque no ícone "i" de cada indicador para ver o que ele conta. A seta de tendência compara a segunda metade do período com a primeira.',
            ]}
          />

          <Colunas bases={[300, 460]}>
            <CartaoSecao titulo="Precisa da sua atenção" subtitulo="Toque para abrir" ajuda={{ oque: 'Lista do que está esperando uma ação sua.', como: 'Toque no item para abrir. Some da lista quando não houver pendências.', origem: 'Fluxo de conteúdo e solicitações do painel.' }}>
              <PendenciasPainel itens={pendencias} />
            </CartaoSecao>
            <CartaoSecao titulo="Utilização do aplicativo" subtitulo="Participantes ativos por dia" ajuda={{ oque: 'Quantos adolescentes usaram o app em cada dia do período.', como: 'Picos costumam coincidir com novidades de conteúdo e desafios.', origem: 'Registros de refeição, água e atividade física e lições concluídas, por dia.' }}>
              <GraficoLinha dias={(dados.serie_uso ?? []).map((p) => p.dia)} series={[{ nome: 'Participantes ativos', valores: derivados.usuarios }]} />
            </CartaoSecao>
          </Colunas>

          <CartaoSecao titulo="Indicadores" subtitulo="Toque em um cartão para ver os detalhes">
            <GridResponsiva minItem={160}>
              <CartaoKpi
                titulo="Aguardando aprovação"
                ajuda={{ oque: 'Conteúdos enviados para revisão que esperam a sua decisão.', como: 'O ideal é próximo de zero. Enquanto você não aprovar, os adolescentes não os veem.', origem: 'Fluxo de conteúdo (status em revisão).' }}
                valor={dados.kpis.conteudos_aguardando}
                icone="hourglass-outline"
                alerta={dados.kpis.conteudos_aguardando > 0}
                onPress={abrir('NutriAprovacoes')}
                rotuloAcao="Abrir aprovações"
              />
              <CartaoKpi titulo="Participantes" ajuda={{ oque: 'Adolescentes cadastrados no aplicativo.', como: 'Número acumulado: só cresce. Para ver quem está ativo, use “Participantes ativos”.', origem: 'Tabela de perfis (profiles), papel adolescente.' }} valor={dados.kpis.adolescentes} icone="people-outline" onPress={abrir('ParticipantesList')} rotuloAcao="Ver participantes" />
              <CartaoKpi
                titulo={`Participantes ativos (${dias} dias)`}
                ajuda={{ oque: 'Adolescentes que registraram algo ou concluíram uma lição no período escolhido.', como: 'Cada pessoa conta uma vez. O minigráfico mostra quantos usaram o app a cada dia; a etiqueta compara a 2ª metade do período com a 1ª.', origem: 'Registros de refeição, água e atividade física e lições concluídas.' }}
                valor={dados.kpis.ativos}
                icone="pulse-outline"
                sparkline={derivados.usuarios}
                tendencia={derivados.tendUsuarios}
                onPress={abrir('NutriAnalytics')}
                rotuloAcao="Abrir Analytics"
              />
              <CartaoKpi titulo="Trilhas ativas" ajuda={{ oque: 'Trilhas educativas publicadas e visíveis para os adolescentes.', como: 'Mais trilhas significam mais conteúdo disponível; itens em revisão não entram.', origem: 'Fluxo de conteúdo (status publicado).' }} valor={dados.kpis.trilhas_ativas} icone="map-outline" onPress={abrir('NutriTrilhas')} rotuloAcao="Ver trilhas" />
              <CartaoKpi titulo="Desafios ativos" ajuda={{ oque: 'Desafios diários e periódicos disponíveis hoje no aplicativo.', como: 'Se ficar muito baixo, os adolescentes ficam sem missões para cumprir.', origem: 'Catálogos de missões diárias e periódicas (somente as ativas).' }} valor={dados.kpis.desafios_ativos} icone="trophy-outline" onPress={abrir('NutriDesafios')} rotuloAcao="Ver desafios" />
            </GridResponsiva>
          </CartaoSecao>

          <CartaoSecao titulo="Registros recentes" subtitulo="Identificados apenas pelo código do participante" ajuda={{ oque: 'Últimos registros feitos pelos adolescentes.', como: 'Por privacidade aparece só o código do participante, nunca o nome.', origem: 'Registros de refeição, água e atividade física.' }}>
            <ListaAtividades itens={recentes} vazio="Nenhum registro recente." />
          </CartaoSecao>
        </>
      )}
    </PainelLayout>
  );
}
