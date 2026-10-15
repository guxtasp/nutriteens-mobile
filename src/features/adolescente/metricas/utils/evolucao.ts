// src/features/adolescente/metricas/utils/evolucao.ts
import type { DadosBrutos, Janela, MetricasEvolucao } from '../types/metricas';
import { dentro } from './periodos';

export function calcularEvolucao(dados: DadosBrutos, janela: Janela): MetricasEvolucao {
  const ordenadas = [...dados.conquistas].sort((a, b) => b.data.localeCompare(a.data) || a.nome.localeCompare(b.nome));
  return {
    conquistasNoPeriodo: dados.conquistas.filter((c) => dentro(c.data, janela)).length,
    conquistasRecentes: ordenadas.slice(0, 5),
  };
}
