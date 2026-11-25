import { calcularEstadoFase, faseParaCelebrar, indiceFase } from '../fasesMascote';

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

describe('faseParaCelebrar', () => {
  it('comemora quando a fase atual passou da última vista', () => {
    expect(faseParaCelebrar('jovem', 'filhote')).toBe('jovem');
    expect(faseParaCelebrar('adulto', 'jovem')).toBe('adulto');
  });

  it('pulando duas fases de uma vez, comemora só a mais nova', () => {
    expect(faseParaCelebrar('adulto', 'filhote')).toBe('adulto');
  });

  it('não comemora a mesma fase nem uma fase anterior', () => {
    expect(faseParaCelebrar('jovem', 'jovem')).toBeNull();
    expect(faseParaCelebrar('filhote', 'adulto')).toBeNull();
  });

  it('sem registro anterior (primeira vez), não comemora', () => {
    expect(faseParaCelebrar('adulto', null)).toBeNull();
  });
});

describe('indiceFase', () => {
  it('segue a ordem de XP mínimo, mesmo com a lista fora de ordem', () => {
    const fases = [
      { fase: 'adulto' as const, titulo: 'Super Broxis', xpMinimo: 1500 },
      { fase: 'filhote' as const, titulo: 'Broxinho', xpMinimo: 0 },
      { fase: 'jovem' as const, titulo: 'Broxis', xpMinimo: 500 },
    ];
    expect(indiceFase('filhote', fases)).toBe(0);
    expect(indiceFase('adulto', fases)).toBe(2);
  });
});
