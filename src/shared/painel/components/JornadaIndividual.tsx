// src/shared/painel/components/JornadaIndividual.tsx
// Jornada de UM adolescente: insights, calendário de uso (12 semanas), marcos, recursos usados e
// período do dia. Só dados de USO (painel_participante_jornada): nada do que a pessoa comeu,
// medidas ou avaliações. Por isso aparece para a nutricionista e para a administração.
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { CartaoSecao } from './CartaoSecao';
import { Colunas } from './Colunas';
import { EstadoCarregando, EstadoErro } from './EstadosPainel';
import { GraficoBarras } from './GraficoBarras';
import { CalendarioAtividade, ListaInsights, MarcosJornada } from './graficos/GraficosJornada';
import { buscarJornadaParticipante, type JornadaParticipante } from '../services/jornadaService';
import { ROTULO_RECURSO, insightsIndividuais, maiorSequencia, usouNoDia } from '../utils/jornada';
import { paraISO } from '../periodo';

const ROTULO_PERIODO = { madrugada: 'Madrugada (0–6h)', manha: 'Manhã (6–12h)', tarde: 'Tarde (12–18h)', noite: 'Noite (18–24h)' } as const;

export function JornadaIndividual({ id }: { id: string }) {
  const [j, setJ] = useState<JornadaParticipante | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    setErro(null);
    buscarJornadaParticipante(id)
      .then(setJ)
      .catch((e) => setErro(e?.message ?? 'Não foi possível carregar a jornada.'));
  }, [id]);
  useEffect(() => { carregar(); }, [carregar]);

  if (erro && !j) return <EstadoErro mensagem={erro} onTentar={carregar} />;
  if (!j) return <EstadoCarregando texto="Montando a jornada…" />;

  const cal = j.calendario.filter((d) => !d.antes_do_cadastro);
  const diasAtivos = cal.filter(usouNoDia).length;
  const insights = insightsIndividuais(j, paraISO(new Date()));
  const recursos = [...j.recursos].sort((a, b) => b.dias_12_semanas - a.dias_12_semanas);

  return (
    <View style={{ gap: 16 }}>
      <CartaoSecao titulo="Resumo da jornada" subtitulo="Observações geradas a partir do uso do app" ajuda="Frases automáticas sobre o USO do app (frequência, horários, recursos). Não avaliam alimentação nem saúde.">
        <ListaInsights itens={insights} vazio="Ainda não há uso suficiente para gerar observações." />
      </CartaoSecao>

      <CartaoSecao
        titulo="Calendário de uso"
        subtitulo={`Últimas 12 semanas · ${diasAtivos} dia(s) com uso · maior sequência: ${maiorSequencia(cal)} dia(s)`}
        ajuda={{
          oque: 'Cada quadrado é um dia; cada coluna, uma semana (segunda a domingo).',
          como: 'Quanto mais escuro, mais tipos de uso no dia (abrir o app, registrar, concluir lição). Pontilhado = antes do cadastro.',
          origem: 'Eventos do app, registros do dia e lições concluídas.',
        }}
      >
        <CalendarioAtividade calendario={j.calendario} />
      </CartaoSecao>

      <Colunas bases={[320, 380]}>
        <CartaoSecao titulo="Marcos da jornada" subtitulo="Primeira vez de cada etapa importante">
          <MarcosJornada marcos={j.marcos} cadastro={j.cadastro} />
        </CartaoSecao>
        <View style={{ gap: 16 }}>
          <CartaoSecao titulo="Recursos usados" subtitulo="Dias com uso nas últimas 12 semanas" ajuda="Em quantos dias diferentes a pessoa usou cada parte do app. Zero = ainda não experimentou nesse período.">
            <GraficoBarras itens={recursos.map((r) => ({ rotulo: ROTULO_RECURSO[r.recurso], valores: [r.dias_12_semanas] }))} vazio="Sem uso registrado." />
          </CartaoSecao>
          <CartaoSecao titulo="Período do dia" subtitulo="Ações no app, últimas 12 semanas" ajuda="Ajuda a escolher o melhor horário para lembretes.">
            <GraficoBarras
              itens={(Object.keys(ROTULO_PERIODO) as (keyof typeof ROTULO_PERIODO)[]).map((k) => ({ rotulo: ROTULO_PERIODO[k], valores: [j.periodos[k]] }))}
              vazio="Sem uso registrado."
            />
          </CartaoSecao>
        </View>
      </Colunas>
    </View>
  );
}
