// src/features/adolescente/metricas/utils/comparacao.ts
import type { Comparacao, NivelDados } from '../types/metricas';

/** Dias ativos mínimos no período anterior para ele servir de base de comparação. */
export const MIN_DIAS_BASE = 2;
/** Dias ativos mínimos no período para falarmos em padrão. */
export const MIN_DIAS_PADRAO = 3;

export function nivelDados(diasAtivos: number): NivelDados {
  if (diasAtivos <= 0) return 'nenhum';
  if (diasAtivos < MIN_DIAS_PADRAO) return 'pouco';
  return 'suficiente';
}

export function baseConfiavel(diasAtivosAnterior: number): boolean {
  return diasAtivosAnterior >= MIN_DIAS_BASE;
}

/** Sem base confiável não existe "subiu/desceu": devolve `sem_base` e não inventa tendência. */
export function comparar(atual: number, anterior: number, temBase: boolean): Comparacao {
  const diferenca = atual - anterior;
  if (!temBase) return { direcao: 'sem_base', atual, anterior, diferenca };
  return { direcao: diferenca > 0 ? 'subiu' : diferenca < 0 ? 'desceu' : 'igual', atual, anterior, diferenca };
}
