import { calcularEstadoFase } from '../fasesMascote';

describe('calcularEstadoFase', () => {
  it('começa como filhote e fica assim até 499 XP', () => {
    expect(calcularEstadoFase(0).atual.fase).toBe('filhote');
    expect(calcularEstadoFase(499).atual.fase).toBe('filhote');
    expect(calcularEstadoFase(499).xpFaltando).toBe(1);
  });

  it('evolui exatamente nos limiares', () => {
    expect(calcularEstadoFase(500).atual.fase).toBe('jovem');
    expect(calcularEstadoFase(1499).atual.fase).toBe('jovem');
    expect(calcularEstadoFase(1500).atual.fase).toBe('adulto');
  });

  it('progresso é relativo à fase atual', () => {
    expect(calcularEstadoFase(250).progresso).toBeCloseTo(0.5);
    expect(calcularEstadoFase(1000).progresso).toBeCloseTo(0.5);
  });

  it('na última fase não há próxima e a barra fica cheia', () => {
    const e = calcularEstadoFase(9999);
    expect(e.proxima).toBeNull();
    expect(e.progresso).toBe(1);
  });

  it('ignora valores inválidos', () => {
    expect(calcularEstadoFase(-5).atual.fase).toBe('filhote');
    expect(calcularEstadoFase(NaN).atual.fase).toBe('filhote');
  });
});
