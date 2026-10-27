// src/features/adolescente/metricas/utils/resumoHome.ts
//
// Dados do widget da Home a partir das métricas reais dos últimos 7 dias. A frase é a mesma
// do cartão de resumo da tela (um só motor de mensagens, sem texto solto). Sem dado, o texto
// é a orientação do Bróxis para começar, e o widget não desenha os 7 dias.
import type { MetricasCompletas } from '../types/metricas';
import { gerarFeedbacks, type PoseBroxis } from './feedbackBroxis';

export type ResumoHomeDados = {
  texto: string;
  pose: PoseBroxis;
  semDados: boolean;
  dias: { data: string; marcado: boolean }[];
  diasAtivos: number;
  total: number;
};

export function montarResumoHome(m: MetricasCompletas, semente: string): ResumoHomeDados {
  const fb = gerarFeedbacks(m, { semente }).resumo;
  const a = m.atual;
  return {
    texto: fb.texto,
    pose: fb.pose,
    semDados: a.nivelDados === 'nenhum',
    dias: a.engajamento.porDia.map((d) => ({ data: d.data, marcado: d.ativo })),
    diasAtivos: a.diasAtivos,
    total: a.janela.dias,
  };
}
