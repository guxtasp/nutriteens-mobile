import { contarPontuadas, ehPassoPontuado, filaAposResposta, montarFila } from '../sessaoPassos';

const q = (id: string, formato: string) => ({ id, formato });

describe('sessaoPassos', () => {
  it('cartão, enquete e meta não são pontuados; os demais formatos são', () => {
    ['cartao', 'enquete', 'meta'].forEach((f) => expect(ehPassoPontuado(f)).toBe(false));
    ['multipla_escolha', 'verdadeiro_falso', 'completar', 'ordene', 'associe', 'classifique'].forEach((f) =>
      expect(ehPassoPontuado(f)).toBe(true)
    );
  });

  it('conta só as questões pontuadas', () => {
    expect(contarPontuadas([q('1', 'cartao'), q('2', 'associe'), q('3', 'meta'), q('4', 'completar')])).toBe(2);
  });

  it('erro na 1ª tentativa devolve a questão UMA vez no fim', () => {
    const fila = montarFila([q('1', 'multipla_escolha'), q('2', 'completar')]);
    const depois = filaAposResposta(fila, 0, false);
    expect(depois).toHaveLength(3);
    expect(depois[2]).toEqual({ questao: q('1', 'multipla_escolha'), ehRetentativa: true });
    expect(fila).toHaveLength(2); // não altera a fila original
  });

  it('acerto não repete nada', () => {
    const fila = montarFila([q('1', 'multipla_escolha')]);
    expect(filaAposResposta(fila, 0, true)).toBe(fila);
  });

  it('erro na retentativa NÃO repete de novo (ninguém fica preso)', () => {
    const fila = filaAposResposta(montarFila([q('1', 'multipla_escolha')]), 0, false);
    expect(filaAposResposta(fila, 1, false)).toBe(fila);
    expect(fila).toHaveLength(2);
  });

  it('passo sem nota nunca gera retentativa', () => {
    const fila = montarFila([q('1', 'enquete')]);
    expect(filaAposResposta(fila, 0, false)).toBe(fila);
  });
});
