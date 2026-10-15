import { detectarPerdaSequencia } from '../perdaSequencia';

describe('detectarPerdaSequencia', () => {
  it('não avisa no primeiro acesso (sem registro anterior)', () => {
    expect(detectarPerdaSequencia(null, 0)).toEqual({ perdeu: false, diasPerdidos: 0 });
    expect(detectarPerdaSequencia(null, 3)).toEqual({ perdeu: false, diasPerdidos: 0 });
  });

  it('não avisa quando a sequência anterior já era zero', () => {
    expect(detectarPerdaSequencia(0, 0)).toEqual({ perdeu: false, diasPerdidos: 0 });
  });

  it('não avisa quando a sequência se manteve ou cresceu', () => {
    expect(detectarPerdaSequencia(5, 5).perdeu).toBe(false);
    expect(detectarPerdaSequencia(5, 6).perdeu).toBe(false);
  });

  it('avisa quando caiu para zero, informando o tamanho perdido', () => {
    expect(detectarPerdaSequencia(5, 0)).toEqual({ perdeu: true, diasPerdidos: 5 });
  });

  it('avisa quando quebrou e já recomeçou em 1', () => {
    expect(detectarPerdaSequencia(12, 1)).toEqual({ perdeu: true, diasPerdidos: 12 });
  });
});