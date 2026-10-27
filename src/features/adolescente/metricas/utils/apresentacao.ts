// src/features/adolescente/metricas/utils/apresentacao.ts
//
// Transformações puras entre as métricas e o que os gráficos desenham.
// Ficam fora dos componentes para poderem ser testadas.
import type { Comparacao, DiaHabito, TipoPeriodo } from '../types/metricas';
import { rotuloDiaSemana } from './periodos';

export type PontoSerie = { rotulo: string; valor: number; destaque: boolean };

export function agruparEmSemanas<T>(itens: T[], tamanho = 7): T[][] {
  const grupos: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) grupos.push(itens.slice(i, i + tamanho));
  return grupos;
}

/** Refeições registradas: 1 barra por dia (7 dias) ou 1 por semana (28 dias). O último ponto é o mais recente. */
export function serieRefeicoes(porDia: DiaHabito[], tipo: TipoPeriodo): PontoSerie[] {
  if (tipo === 'semana') {
    return porDia.map((d, i) => ({ rotulo: rotuloDiaSemana(d.data), valor: d.refeicoes, destaque: i === porDia.length - 1 }));
  }
  const semanas = agruparEmSemanas(porDia);
  return semanas.map((s, i) => ({
    rotulo: `Sem ${i + 1}`,
    valor: s.reduce((soma, d) => soma + d.refeicoes, 0),
    destaque: i === semanas.length - 1,
  }));
}

/**
 * Selo de evolução. Tom sempre neutro ou positivo: queda mostra só o número anterior,
 * sem seta nem cor de alerta, para não gerar culpa. `sem_base` não mostra nada.
 */
export function rotuloComparacao(c: Comparacao): { texto: string; tom: 'positivo' | 'neutro' } | null {
  if (c.direcao === 'sem_base') return null;
  if (c.direcao === 'subiu') return { texto: `+${c.diferenca} vs período anterior`, tom: 'positivo' };
  if (c.direcao === 'igual') return { texto: 'Igual ao período anterior', tom: 'neutro' };
  return { texto: `Período anterior: ${c.anterior}`, tom: 'neutro' };
}

/** CEREAIS_E_TUBERCULOS -> "Cereais e tuberculos" (fallback quando não há título amigável no banco). */
export function humanizarGrupo(codigo: string): string {
  const t = codigo.replace(/_/g, ' ').toLowerCase().trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function pluralizar(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

export function textoAcessivelDias(marcados: number, total: number, o_que: string): string {
  return `${marcados} de ${total} dias ${o_que}`;
}

// A nota sobre missões possivelmente subcontadas vive em utils/notas.ts (notaMissoes).
