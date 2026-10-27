import { calcularMetricas } from '../calcularMetricas';
import { celebracaoMelhorSemana, linhaMelhorSemana, melhoresSemanas } from '../melhorPeriodo';
import { dadosVazios, alim, HOJE } from './fixtures';
import { somarDias } from '../periodos';
import type { DadosBrutos, RefeicaoRegistrada } from '../../types/metricas';

// semana i = 7 dias terminando em HOJE - 7*i (0 = mais recente)
const diaDaSemana = (i: number, k = 0) => somarDias(HOJE, -7 * i - k);
const refeicao = (id: string, data: string, n: number): RefeicaoRegistrada => ({
  id, data, tipo: 'ALMOCO', alimentos: Array.from({ length: n }, (_, j) => alim(`${id}-${j}`, `Alimento ${id}-${j}`, ['FRUTAS'])),
});
const com = (o: Partial<DadosBrutos>, dias = 56): DadosBrutos => dadosVazios({ diasCarregados: dias, ...o });

describe('melhoresSemanas', () => {
  it('sem histórico carregado suficiente (< 3 semanas): não afirma nada', () => {
    expect(melhoresSemanas(com({ refeicoes: [refeicao('a', diaDaSemana(0), 3), refeicao('b', diaDaSemana(1), 5)] }, 14))).toEqual([]);
    expect(melhoresSemanas(dadosVazios({ refeicoes: [refeicao('a', diaDaSemana(0), 3)] }))).toEqual([]); // sem diasCarregados
  });

  it('só uma semana com valor: não há com o que comparar', () => {
    expect(melhoresSemanas(com({ refeicoes: [refeicao('a', diaDaSemana(0), 3)] }))).toEqual([]);
  });

  it('acha a semana com mais variedade no próprio histórico', () => {
    const r = melhoresSemanas(com({ refeicoes: [refeicao('a', diaDaSemana(0), 2), refeicao('b', diaDaSemana(2), 6), refeicao('c', diaDaSemana(3), 3)] }));
    const v = r.find((x) => x.chave === 'variedade')!;
    expect(v.valor).toBe(6);
    expect(v.atual).toBe(false);
    expect(v.fim).toBe(diaDaSemana(2));
    expect(v.semanas).toBe(8);
  });

  it('empate: vale a semana mais recente', () => {
    const r = melhoresSemanas(com({ refeicoes: [refeicao('a', diaDaSemana(0), 4), refeicao('b', diaDaSemana(3), 4)] }));
    const v = r.find((x) => x.chave === 'variedade')!;
    expect(v.atual).toBe(true);
  });

  it('dias ativos contam refeição, água, atividade e lição', () => {
    const r = melhoresSemanas(com({
      agua: [{ data: diaDaSemana(1, 0), ml: 300 }, { data: diaDaSemana(1, 1), ml: 300 }, { data: diaDaSemana(1, 2), ml: 300 }],
      licoes: [{ data: diaDaSemana(0), licaoId: 'l1', trilhaId: 't' }],
    }));
    const d = r.find((x) => x.chave === 'diasAtivos')!;
    expect(d.valor).toBe(3);
    expect(d.fim).toBe(diaDaSemana(1));
  });

  it('textos: período e quantidade corretos, sem comparar com outras pessoas', () => {
    const [m] = melhoresSemanas(com({ refeicoes: [refeicao('a', diaDaSemana(0), 2), refeicao('b', diaDaSemana(2), 6)] }));
    const linha = linhaMelhorSemana(m);
    expect(linha.rotulo).toBe('Sua semana com mais variedade');
    expect(linha.valor).toContain('6 alimentos diferentes');
    expect(celebracaoMelhorSemana({ ...m, atual: true })).toContain('últimas 8 semanas');
    expect(celebracaoMelhorSemana({ ...m, atual: true })).not.toMatch(/\b(outros|amigos|ranking|melhor que)\b/i);
  });

  it('é coerente com as métricas da janela (mesma conta de dias ativos)', () => {
    const d = com({ refeicoes: [refeicao('a', diaDaSemana(0, 1), 2), refeicao('b', diaDaSemana(0, 3), 2), refeicao('c', diaDaSemana(1), 1)] });
    const atual = calcularMetricas(d, 'semana').atual.diasAtivos;
    const dias = melhoresSemanas(d).find((x) => x.chave === 'diasAtivos')!;
    expect(dias.valor).toBe(atual);
  });
});
