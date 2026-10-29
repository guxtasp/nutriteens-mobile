import { escalaDoCartao } from '../escalaCartao';

describe('escalaDoCartao', () => {
  it('telas altas não mudam (fator 1)', () => {
    expect(escalaDoCartao(900)).toBe(1);
    expect(escalaDoCartao(932)).toBe(1);
    expect(escalaDoCartao(1200)).toBe(1);
  });

  it('telas médias encolhem um pouco', () => {
    expect(escalaDoCartao(852)).toBeCloseTo(0.88, 2);
    expect(escalaDoCartao(800)).toBeCloseTo(0.75, 2);
  });

  it('telas muito baixas param em 0,7 (nunca some nem fica ilegível)', () => {
    expect(escalaDoCartao(700)).toBe(0.7);
    expect(escalaDoCartao(0)).toBe(0.7);
  });

  it('é monotônico: tela maior nunca tem fator menor', () => {
    let anterior = 0;
    for (let h = 400; h <= 1000; h += 20) {
      const e = escalaDoCartao(h);
      expect(e).toBeGreaterThanOrEqual(anterior);
      anterior = e;
    }
  });
});
