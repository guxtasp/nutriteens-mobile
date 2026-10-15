// src/features/adolescente/metricas/utils/periodos.ts
//
// Janelas de comparação. Decisão: janelas MÓVEIS terminando hoje (7 ou 28 dias) e a
// janela anterior com o mesmo tamanho. Assim a comparação é justa: uma "semana"
// de calendário em andamento seria comparada com uma semana inteira e pareceria queda.
// Aritmética em UTC sobre o texto AAAA-MM-DD, sem depender do fuso do aparelho.
import type { DataISO, Janela, Janelas, TipoPeriodo } from '../types/metricas';

export const DIAS_DO_PERIODO: Record<TipoPeriodo, number> = { semana: 7, mes: 28 };

const FORMATO = /^\d{4}-\d{2}-\d{2}$/;

function paraUtc(d: DataISO): number {
  if (!FORMATO.test(d)) throw new Error(`Data inválida: ${d}`);
  const [a, m, dia] = d.split('-').map(Number);
  return Date.UTC(a, m - 1, dia);
}

function deUtc(ms: number): DataISO {
  const dt = new Date(ms);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

export function somarDias(d: DataISO, n: number): DataISO {
  return deUtc(paraUtc(d) + n * 86_400_000);
}

export function criarJanela(fim: DataISO, dias: number): Janela {
  return { inicio: somarDias(fim, -(dias - 1)), fim, dias };
}

export function criarJanelas(tipo: TipoPeriodo, hoje: DataISO): Janelas {
  const dias = DIAS_DO_PERIODO[tipo];
  const atual = criarJanela(hoje, dias);
  const anterior = criarJanela(somarDias(atual.inicio, -1), dias);
  return { atual, anterior };
}

/** Comparação lexicográfica é segura para AAAA-MM-DD. */
export function dentro(d: DataISO, j: Janela): boolean {
  return d >= j.inicio && d <= j.fim;
}

export function listarDias(j: Janela): DataISO[] {
  return Array.from({ length: j.dias }, (_, i) => somarDias(j.inicio, i));
}

/** 2026-10-15 -> "15/10" */
export function formatarDiaMes(d: DataISO): string {
  const [, m, dia] = d.split('-');
  return `${dia}/${m}`;
}

/** Rótulo curto do dia da semana (Dom..Sáb) para o eixo dos gráficos. */
export function rotuloDiaSemana(d: DataISO): string {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(paraUtc(d)).getUTCDay()];
}
