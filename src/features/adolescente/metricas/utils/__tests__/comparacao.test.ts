import { baseConfiavel, comparar, nivelDados } from '../comparacao';

describe('comparacao', () => {
  it('nivelDados', () => {
    expect(nivelDados(0)).toBe('nenhum');
    expect(nivelDados(2)).toBe('pouco');
    expect(nivelDados(3)).toBe('suficiente');
  });
  it('baseConfiavel exige 2 dias ativos', () => {
    expect(baseConfiavel(1)).toBe(false);
    expect(baseConfiavel(2)).toBe(true);
  });
  it('sem base nunca afirma tendência', () => {
    expect(comparar(5, 0, false).direcao).toBe('sem_base');
  });
  it('subiu, igual, desceu', () => {
    expect(comparar(5, 3, true)).toEqual({ direcao: 'subiu', atual: 5, anterior: 3, diferenca: 2 });
    expect(comparar(3, 3, true).direcao).toBe('igual');
    expect(comparar(1, 3, true).direcao).toBe('desceu');
  });
});
