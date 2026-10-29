// src/features/adolescente/metricas/utils/resumoHome.ts
//
// Dados do widget da Home a partir das métricas reais dos últimos 7 dias. A frase é a mesma
// do cartão de resumo da tela (um só motor de mensagens, sem texto solto). Sem dado, o texto
// é a orientação do Bróxis para começar, e o widget não desenha o rastreador.
import type { MetricasCompletas } from '../types/metricas';
import { gerarFeedbacks, type PoseBroxis } from './feedbackBroxis';
import type { MisturaNova } from './misturaNova';

/** Um dia do mini rastreador: o que aconteceu em cada hábito. Vazio = só um dia sem registro. */
export type DiaRastreador = { data: string; hoje: boolean; comida: boolean; agua: boolean; movimento: boolean };

export type ResumoHomeDados = {
  texto: string;
  pose: PoseBroxis;
  semDados: boolean;
  dias: { data: string; marcado: boolean }[];
  diasAtivos: number;
  total: number;
  /** mini rastreador: um item por dia, do mais antigo para hoje */
  semana: DiaRastreador[];
  diasComida: number;
  diasAgua: number;
  diasMovimento: number;
  conquistasNoPeriodo: number;
  /** termômetro da regra de ouro na mesma janela (versão mini do cartão de Minha jornada) */
  mistura: MisturaNova;
};

export function montarResumoHome(m: MetricasCompletas, semente: string, mistura: MisturaNova): ResumoHomeDados {
  const fb = gerarFeedbacks(m, { semente }).resumo;
  const a = m.atual;
  const porDia = a.habitos.porDia;
  const semana: DiaRastreador[] = porDia.map((d, i) => ({
    data: d.data,
    hoje: i === porDia.length - 1,
    comida: d.refeicoes > 0,
    agua: d.aguaRegistrada,
    movimento: d.atividade,
  }));
  return {
    texto: fb.texto,
    pose: fb.pose,
    semDados: a.nivelDados === 'nenhum',
    dias: a.engajamento.porDia.map((d) => ({ data: d.data, marcado: d.ativo })),
    diasAtivos: a.diasAtivos,
    total: a.janela.dias,
    semana,
    diasComida: semana.filter((d) => d.comida).length,
    diasAgua: semana.filter((d) => d.agua).length,
    diasMovimento: semana.filter((d) => d.movimento).length,
    conquistasNoPeriodo: a.evolucao.conquistasNoPeriodo,
    mistura,
  };
}
