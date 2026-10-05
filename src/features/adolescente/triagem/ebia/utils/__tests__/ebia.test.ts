import { calcularPontuacaoEbia, classificarEbia } from '../../data/ebiaData';
import { montarRespostasEbia } from '../montarRespostas';

describe('EBIA', () => {
  it('classifica pelos cortes 0 / 1-2 / 3-4 / 5', () => {
    expect(classificarEbia(0)).toBe('SEGURANCA_ALIMENTAR');
    expect(classificarEbia(2)).toBe('INSEGURANCA_LEVE');
    expect(classificarEbia(4)).toBe('INSEGURANCA_MODERADA');
    expect(classificarEbia(5)).toBe('INSEGURANCA_GRAVE');
  });
  it('pontua contando os "sim"', () => {
    expect(calcularPontuacaoEbia([true, false, true, true, false])).toBe(3);
  });
  it('monta as respostas com as colunas reais da tabela', () => {
    const linhas = montarRespostasEbia('ebia-1', [true, false, false, true, true]);
    expect(linhas).toHaveLength(5);
    expect(linhas[0]).toEqual({ avaliacao_ebia_id: 'ebia-1', numero_pergunta: 1, resposta: true });
    expect(linhas[4]).toEqual({ avaliacao_ebia_id: 'ebia-1', numero_pergunta: 5, resposta: true });
    expect(Object.keys(linhas[0]).sort()).toEqual(['avaliacao_ebia_id', 'numero_pergunta', 'resposta']);
  });
});
