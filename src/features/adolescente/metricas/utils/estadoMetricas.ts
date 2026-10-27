// src/features/adolescente/metricas/utils/estadoMetricas.ts
//
// Deriva o estado da tela (carregando / erro / pronto) a partir do que o hook tem.
// Pura: o hook só guarda dados, erro e período.
import type { EstadoMetricas } from '../types/estado';
import type { DadosBrutos, TipoPeriodo } from '../types/metricas';
import { calcularMetricas } from './calcularMetricas';
import { gerarFeedbacks } from './feedbackBroxis';
import { melhoresSemanas } from './melhorPeriodo';
import { calcularMisturaNova } from './misturaNova';
import { montarRetrospectiva } from './retrospectiva';

export function derivarEstado(dados: DadosBrutos | null, erro: boolean, periodo: TipoPeriodo, semente: string): EstadoMetricas {
  if (!dados) return erro ? { status: 'erro' } : { status: 'carregando' };
  const metricas = calcularMetricas(dados, periodo);
  return {
    status: 'pronto',
    metricas,
    feedbacks: gerarFeedbacks(metricas, { semente }),
    melhores: melhoresSemanas(dados),
    retrospectiva: montarRetrospectiva(metricas, semente),
    mistura: calcularMisturaNova(dados, metricas.atual.janela),
  };
}
