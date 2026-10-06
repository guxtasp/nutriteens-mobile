// src/features/nutricionista/dashboard/screens/NutricionistaDashboardScreen.tsx
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
import type { IconeNome } from '../../../../shared/painel/types';
import { NUTRICIONISTA_PAINEL } from '../../navigation/nutricionistaMenu';

const REGISTRO: Record<string, { icone: IconeNome; texto: string }> = {
  alimentacao: { icone: 'restaurant-outline', texto: 'Alimentação registrada' },
  agua: { icone: 'water-outline', texto: 'Água registrada' },
  atividade: { icone: 'fitness-outline', texto: 'Atividade física registrada' },
};

export default function NutricionistaDashboardScreen() {
  const [dias, setDias] = useState(30);
  const { dados, carregando, erro, recarregar } = useDashboardPainel(dias);

  // só o código do participante (NT-000001) — sem nome, por privacidade
  const recentes: ItemAtividade[] = (dados?.recentes ?? []).map((r, i) => ({
    chave: `${r.tipo}-${r.quando}-${i}`,
    icone: REGISTRO[r.tipo]?.icone ?? 'ellipse-outline',
    titulo: REGISTRO[r.tipo]?.texto ?? r.tipo,
    detalhe: r.codigo ?? undefined,
    quando: r.quando,
  }));

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
          <IntroSecao
            chave="nutri_dashboard"
            titulo="Seu painel de acompanhamento"
            linhas={[
              'Você é a responsável técnica pelo conteúdo nutricional: nada vai para os adolescentes sem a sua aprovação.',
              'Em "Aprovações" fica a fila do que espera a sua decisão. Abra cada item e leia tudo antes de aprovar ou rejeitar.',
              'Os números mostram totais e participantes pelo código (NT-xxxxxx), sem nomes ou dados pessoais.',
              'Toque no ícone "i" de cada indicador para ver o que ele conta.',
            ]}
          />
          <GridResponsiva minItem={150}>
            <CartaoKpi titulo="Participantes" ajuda="Adolescentes cadastrados no aplicativo." valor={dados.kpis.adolescentes} icone="people-outline" />
            <CartaoKpi titulo={`Participantes ativos (${dias} dias)`} ajuda="Adolescentes que registraram algo ou concluíram uma lição no período escolhido." valor={dados.kpis.ativos} icone="pulse-outline" />
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
                dias={dados.serie_uso.map((p) => p.dia)}
                series={[{ nome: 'Participantes ativos', valores: dados.serie_uso.map((p) => p.usuarios) }]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Recursos mais utilizados" subtitulo={`Últimos ${dias} dias`} ajuda="Funcionalidades mais usadas: alimentação, água, atividade, trilhas e outras.">
              <GraficoBarras itens={dados.recursos.map((r) => ({ rotulo: r.recurso, valores: [r.total] }))} />
            </CartaoSecao>
          </Colunas>

          <Colunas bases={[460, 300]}>
            <CartaoSecao titulo="Desafios iniciados e concluídos" subtitulo="Missões diárias atribuídas x concluídas" ajuda="Iniciado = missão atribuída ao adolescente. Concluído = missão cumprida, com pontos concedidos.">
              <GraficoLinha
                dias={dados.serie_desafios.map((p) => p.dia)}
                series={[
                  { nome: 'Iniciados', valores: dados.serie_desafios.map((p) => p.iniciados) },
                  { nome: 'Concluídos', valores: dados.serie_desafios.map((p) => p.concluidos) },
                ]}
              />
            </CartaoSecao>
            <CartaoSecao titulo="Trilhas iniciadas e concluídas" subtitulo="Total acumulado por trilha" ajuda="Iniciada = o adolescente concluiu ao menos uma lição. Concluída = concluiu todas as lições da trilha.">
              <GraficoBarras
                series={['Iniciadas', 'Concluídas']}
                itens={dados.trilhas.map((t) => ({ rotulo: t.titulo, valores: [t.iniciadas, t.concluidas] }))}
                vazio="Nenhuma trilha ativa."
              />
            </CartaoSecao>
          </Colunas>

          <CartaoSecao titulo="Registros recentes" subtitulo="Identificados apenas pelo código do participante" ajuda="Últimos registros feitos pelos adolescentes. Por privacidade aparece só o código, nunca o nome.">
            <ListaAtividades itens={recentes} vazio="Nenhum registro recente." />
          </CartaoSecao>
        </>
      ) : null}
    </PainelLayout>
  );
}
