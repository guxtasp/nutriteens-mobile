// src/shared/painel/screens/JornadaAnalytics.tsx
// Aba "Jornada" do Analytics: como o uso do app evolui com o tempo, sempre agregado.
// Insights → estágios por semana → retenção por turma → adoção de recursos → horários → trilhas.
import React from 'react';
import { View } from 'react-native';
import { CartaoSecao } from '../components/CartaoSecao';
import { Colunas } from '../components/Colunas';
import { EstadoCarregando, EstadoErro } from '../components/EstadosPainel';
import { GraficoBarras } from '../components/GraficoBarras';
import { GraficoEstagios, ListaInsights, MapaCalor } from '../components/graficos/GraficosJornada';
import { useJornada } from '../hooks/useJornada';
import type { Intervalo } from '../periodo';
import { DIAS_SEMANA, FAIXAS_HORARIO, ROTULO_RECURSO, diaMes, insightsGerais } from '../utils/jornada';

const MARCOS_ADOCAO = [1, 2, 4, 8];

export function JornadaAnalytics({ intervalo }: { intervalo: Intervalo }) {
  const { dados, carregando, erro, recarregar } = useJornada(intervalo, true);

  if (erro && !dados) return <EstadoErro mensagem={erro} onTentar={recarregar} />;
  if (!dados) return <EstadoCarregando texto="Calculando a jornada dos adolescentes…" />;

  const insights = insightsGerais(dados);
  const maxHorario = Math.max(1, ...dados.horarios.map((h) => h.pessoas ?? 0));
  const horario = (dia: number, faixa: number) => {
    const c = dados.horarios.find((h) => h.dia === dia && h.faixa === faixa);
    return c ? c.pessoas : 0; // sem célula = ninguém usou; célula null = poucos dados
  };

  return (
    <View style={{ gap: 16, opacity: carregando ? 0.6 : 1 }}>
      <CartaoSecao
        titulo="O que os números mostram"
        subtitulo={`${dados.total_adolescentes} adolescentes cadastrados · ${dados.semanas} semanas analisadas`}
        ajuda="Frases geradas automaticamente a partir dos gráficos abaixo. Nenhuma pessoa é identificada."
      >
        <ListaInsights itens={insights} vazio="Ainda não há dados suficientes para gerar observações neste período." />
      </CartaoSecao>

      <CartaoSecao
        titulo="Estágios de engajamento por semana"
        subtitulo="Como o grupo se distribui entre uso frequente, ocasional, pausa e inatividade"
        ajuda={{
          oque: 'Cada barra é uma semana e soma todos os adolescentes já cadastrados até ela.',
          como: 'Frequentes = usaram em 3+ dias; ocasionais = 1 ou 2 dias; em pausa = não usaram nesta semana, mas sim nas 3 anteriores; inativos = sem uso há 4+ semanas; novos = cadastro na semana. A base verde mais escura crescendo é sinal de hábito se formando.',
          origem: 'Eventos do app e registros de água, atividade e refeição.',
        }}
      >
        <GraficoEstagios semanas={dados.estagios} />
      </CartaoSecao>

      <Colunas bases={[420, 420]}>
        <CartaoSecao
          titulo="Retenção por turma de entrada"
          subtitulo="% de cada turma que usou o app em cada semana após o cadastro"
          ajuda={{
            oque: 'Cada linha é a turma de adolescentes que se cadastrou numa mesma semana; cada coluna, uma semana de conta (S0 = a do cadastro).',
            como: 'Leia da esquerda para a direita: quanto mais escuro, mais gente da turma continua usando. Turmas com menos de 5 pessoas não mostram número.',
            origem: 'Data de cadastro e dias com uso.',
          }}
        >
          {dados.coortes.length === 0 ? (
            <EstadoVazio />
          ) : (
            <MapaCalor
              linhas={dados.coortes.map((c) => `${diaMes(c.semana)} (${c.tamanho})`)}
              colunas={Array.from({ length: 8 }, (_, k) => `S${k}`)}
              valor={(r, c) => dados.coortes[r].retencao[c]}
              max={100}
              larguraRotulo={78}
              formatar={(v) => `${v}%`}
              rotuloSemDado="Sem número (turma pequena ou semana futura)"
              descrever={(r, c, v) => {
                const t = dados.coortes[r];
                return v === null || v === undefined
                  ? `Turma de ${diaMes(t.semana)}, semana ${c}: sem número (turma com menos de 5 pessoas ou semana que ainda não chegou).`
                  : `Turma de ${diaMes(t.semana)} (${t.tamanho} pessoas): ${v}% usaram o app na semana ${c} de conta.`;
              }}
            />
          )}
        </CartaoSecao>

        <CartaoSecao
          titulo="Adoção dos recursos ao longo da jornada"
          subtitulo="% que já usou cada recurso até a semana N de conta"
          ajuda={{
            oque: 'Mostra em que ritmo os adolescentes descobrem cada parte do app.',
            como: 'Só entra quem já tem aquela idade de conta. Recurso que fica claro até a 8ª semana é pouco descoberto e pode merecer destaque.',
            origem: 'Primeiro uso de cada recurso, contado a partir do cadastro.',
          }}
        >
          <MapaCalor
            linhas={dados.adocao.map((a) => ROTULO_RECURSO[a.recurso])}
            colunas={MARCOS_ADOCAO.map((s) => `${s}ª sem`)}
            valor={(r, c) => dados.adocao[r].pontos.find((p) => p.semana === MARCOS_ADOCAO[c])?.pct}
            max={100}
            larguraRotulo={110}
            formatar={(v) => `${v}%`}
            descrever={(r, c, v) => {
              const a = dados.adocao[r];
              const p = a.pontos.find((x) => x.semana === MARCOS_ADOCAO[c]);
              return v === null || v === undefined
                ? `${ROTULO_RECURSO[a.recurso]} até a ${MARCOS_ADOCAO[c]}ª semana: poucos dados (${p?.elegiveis ?? 0} pessoas com essa idade de conta).`
                : `${v}% dos ${p?.elegiveis} adolescentes já tinham usado ${ROTULO_RECURSO[a.recurso]} até a ${MARCOS_ADOCAO[c]}ª semana de conta.`;
            }}
          />
        </CartaoSecao>
      </Colunas>

      <Colunas bases={[460, 320]}>
        <CartaoSecao
          titulo="Quando usam o app"
          subtitulo={`Pessoas ativas por dia e horário · ${dados.pessoas_periodo} no período`}
          ajuda={{
            oque: 'Quantos adolescentes diferentes usaram o app em cada dia da semana e faixa de 3 horas, no período escolhido.',
            como: 'Os horários mais escuros são os melhores para lembretes e novidades. Células com menos de 5 pessoas não mostram número.',
            origem: 'Eventos do app (horário de Brasília).',
          }}
        >
          <MapaCalor
            linhas={DIAS_SEMANA}
            colunas={FAIXAS_HORARIO}
            valor={horario}
            max={maxHorario}
            larguraRotulo={40}
            formatar={(v) => String(v)}
            descrever={(r, c, v) =>
              v === null
                ? `${DIAS_SEMANA[r]}, ${FAIXAS_HORARIO[c]}: poucos dados (menos de 5 pessoas).`
                : `${DIAS_SEMANA[r]}, ${FAIXAS_HORARIO[c]}: ${v ?? 0} pessoa(s) usaram o app.`
            }
          />
        </CartaoSecao>

        <CartaoSecao
          titulo="Progresso nas trilhas"
          subtitulo="Adolescentes por quantidade de lições concluídas (desde o cadastro)"
          ajuda="Mostra até onde o grupo chega nas trilhas. Uma faixa '0' grande indica que vale facilitar o primeiro passo."
        >
          <GraficoBarras
            itens={dados.progresso_trilhas.map((f) => ({ rotulo: f.faixa === '0' ? 'Nenhuma lição' : `${f.faixa} lições`, valores: [f.pessoas] }))}
            vazio="Sem adolescentes cadastrados."
          />
        </CartaoSecao>
      </Colunas>
    </View>
  );
}

function EstadoVazio() {
  return <ListaInsights itens={[]} vazio="Nenhuma turma se cadastrou no período escolhido." />;
}
