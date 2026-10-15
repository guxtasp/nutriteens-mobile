import { agruparEmSemanas, humanizarGrupo, rotuloComparacao, serieRefeicoes, textoAcessivelDias } from '../apresentacao';
import { criarJanelas, listarDias } from '../periodos';
import type { DiaHabito } from '../../types/metricas';

const dia = (data: string, refeicoes: number): DiaHabito => ({ data, refeicoes, aguaMeta: null, aguaRegistrada: false, atividade: false });
const diasSemana = listarDias(criarJanelas('semana', '2026-10-15').atual).map((d, i) => dia(d, i));
const diasMes = listarDias(criarJanelas('mes', '2026-10-15').atual).map((d) => dia(d, 1));

describe('apresentacao', () => {
  it('serie da semana: 7 barras, rótulo de dia, destaque no último', () => {
    const s = serieRefeicoes(diasSemana, 'semana');
    expect(s).toHaveLength(7);
    expect(s[0].rotulo).toBe('Sex');
    expect(s[6]).toEqual({ rotulo: 'Qui', valor: 6, destaque: true });
    expect(s.filter((p) => p.destaque)).toHaveLength(1);
  });
  it('serie do mês: 4 semanas somadas', () => {
    const s = serieRefeicoes(diasMes, 'mes');
    expect(s.map((p) => p.valor)).toEqual([7, 7, 7, 7]);
    expect(s[3].destaque).toBe(true);
    expect(s[0].rotulo).toBe('Sem 1');
  });
  it('agruparEmSemanas', () => {
    expect(agruparEmSemanas([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('rotuloComparacao: queda não alarma, sem base some', () => {
    expect(rotuloComparacao({ direcao: 'sem_base', atual: 1, anterior: 0, diferenca: 1 })).toBeNull();
    expect(rotuloComparacao({ direcao: 'subiu', atual: 5, anterior: 3, diferenca: 2 })).toEqual({ texto: '+2 vs período anterior', tom: 'positivo' });
    expect(rotuloComparacao({ direcao: 'igual', atual: 3, anterior: 3, diferenca: 0 })?.tom).toBe('neutro');
    expect(rotuloComparacao({ direcao: 'desceu', atual: 1, anterior: 4, diferenca: -3 })).toEqual({ texto: 'Período anterior: 4', tom: 'neutro' });
  });
  it('humanizarGrupo e texto acessível', () => {
    expect(humanizarGrupo('CEREAIS_E_TUBERCULOS')).toBe('Cereais e tuberculos');
    expect(textoAcessivelDias(5, 7, 'com registro')).toBe('5 de 7 dias com registro');
  });
});
