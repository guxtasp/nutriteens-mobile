// src/features/adolescente/metricas/utils/melhorPeriodo.ts
//
// "Sua melhor semana": compara o adolescente com o PRÓPRIO histórico carregado.
// Só afirma algo com pelo menos 3 semanas de histórico carregado e 2 semanas com valor,
// para nunca declarar "melhor" por falta de dado.
import type { DadosBrutos, DataISO } from '../types/metricas';
import { pluralizar } from './apresentacao';
import { acoesPorDia } from './engajamento';
import { calcularHabitos } from './habitos';
import { criarJanela, formatarDiaMes, somarDias } from './periodos';

export type ChaveMelhor = 'variedade' | 'diasAtivos';
export type MelhorSemana = {
  chave: ChaveMelhor;
  inicio: DataISO;
  fim: DataISO;
  valor: number;
  /** a melhor semana é a que está em andamento (últimos 7 dias) */
  atual: boolean;
  /** quantas semanas foram comparadas */
  semanas: number;
};

export function melhoresSemanas(dados: DadosBrutos): MelhorSemana[] {
  const semanas = Math.floor((dados.diasCarregados ?? 0) / 7);
  if (semanas < 3) return [];

  const janelas = Array.from({ length: semanas }, (_, i) => criarJanela(somarDias(dados.hoje, -7 * i), 7)); // 0 = mais recente
  const medidas: Record<ChaveMelhor, number[]> = {
    variedade: janelas.map((j) => calcularHabitos(dados, j).alimentosDistintos),
    diasAtivos: janelas.map((j) => acoesPorDia(dados, j).size),
  };

  const saida: MelhorSemana[] = [];
  (Object.keys(medidas) as ChaveMelhor[]).forEach((chave) => {
    const v = medidas[chave];
    if (v.filter((x) => x > 0).length < 2) return;
    const max = Math.max(...v);
    const i = v.indexOf(max); // empate: a mais recente
    saida.push({ chave, inicio: janelas[i].inicio, fim: janelas[i].fim, valor: max, atual: i === 0, semanas });
  });
  return saida;
}

const ROTULO: Record<ChaveMelhor, { sing: string; plur: string; titulo: string }> = {
  variedade: { sing: 'alimento diferente', plur: 'alimentos diferentes', titulo: 'Sua semana com mais variedade' },
  diasAtivos: { sing: 'dia ativo', plur: 'dias ativos', titulo: 'Sua semana com mais dias ativos' },
};

export function linhaMelhorSemana(m: MelhorSemana) {
  const r = ROTULO[m.chave];
  const quanto = `${m.valor} ${pluralizar(m.valor, r.sing, r.plur)}`;
  return {
    rotulo: r.titulo,
    valor: m.atual ? `Esta semana · ${quanto}` : `${formatarDiaMes(m.inicio)} a ${formatarDiaMes(m.fim)} · ${quanto}`,
  };
}

export function celebracaoMelhorSemana(m: MelhorSemana): string {
  return m.chave === 'variedade'
    ? `Esta é a sua semana com mais variedade nas últimas ${m.semanas} semanas!`
    : `Esta é a sua semana com mais dias ativos nas últimas ${m.semanas} semanas!`;
}

