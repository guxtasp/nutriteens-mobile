// src/features/adolescente/metricas/utils/calcularMetricas.ts
//
// Ponto único de cálculo: recebe os fatos do usuário e devolve o período atual,
// o anterior e as comparações. Pura e determinística (sem rede, sem relógio).
import type { ChaveComparacao, Comparacao, DadosBrutos, Janela, MetricasCompletas, MetricasPeriodo, TipoPeriodo } from '../types/metricas';
import { baseConfiavel, comparar, nivelDados } from './comparacao';
import { calcularEngajamento, acoesPorDia } from './engajamento';
import { calcularEvolucao } from './evolucao';
import { calcularHabitos } from './habitos';
import { criarJanelas } from './periodos';

export function calcularMetricasPeriodo(dados: DadosBrutos, janela: Janela): MetricasPeriodo {
  const diasAtivos = acoesPorDia(dados, janela).size;
  return {
    janela,
    diasAtivos,
    nivelDados: nivelDados(diasAtivos),
    habitos: calcularHabitos(dados, janela),
    engajamento: calcularEngajamento(dados, janela),
    evolucao: calcularEvolucao(dados, janela),
  };
}

export function calcularMetricas(dados: DadosBrutos, tipo: TipoPeriodo): MetricasCompletas {
  const { atual: ja, anterior: jp } = criarJanelas(tipo, dados.hoje);
  const atual = calcularMetricasPeriodo(dados, ja);
  const anterior = calcularMetricasPeriodo(dados, jp);
  const base = baseConfiavel(anterior.diasAtivos);

  const c = (a: number, p: number) => comparar(a, p, base);
  // meta de água pode não existir (perfil sem peso): sem meta não há o que comparar
  const metaAgua: Comparacao =
    atual.habitos.agua.diasComMeta === null || anterior.habitos.agua.diasComMeta === null
      ? comparar(0, 0, false)
      : c(atual.habitos.agua.diasComMeta, anterior.habitos.agua.diasComMeta);

  const comparacoes: Record<ChaveComparacao, Comparacao> = {
    diasAtivos: c(atual.diasAtivos, anterior.diasAtivos),
    diasComRefeicao: c(atual.habitos.diasComRefeicao, anterior.habitos.diasComRefeicao),
    alimentosDistintos: c(atual.habitos.alimentosDistintos, anterior.habitos.alimentosDistintos),
    gruposPresentes: c(atual.habitos.grupos.length, anterior.habitos.grupos.length),
    diasComAgua: c(atual.habitos.agua.diasComRegistro, anterior.habitos.agua.diasComRegistro),
    diasComMetaAgua: metaAgua,
    diasAtividade: c(atual.habitos.atividade.diasAtivos, anterior.habitos.atividade.diasAtivos),
    minutosAtividade: c(atual.habitos.atividade.minutos, anterior.habitos.atividade.minutos),
    licoes: c(atual.engajamento.licoes, anterior.engajamento.licoes),
    missoesConcluidas: c(atual.engajamento.missoes.concluidas, anterior.engajamento.missoes.concluidas),
    conquistas: c(atual.evolucao.conquistasNoPeriodo, anterior.evolucao.conquistasNoPeriodo),
  };
  return { tipo, atual, anterior, comparacoes };
}
