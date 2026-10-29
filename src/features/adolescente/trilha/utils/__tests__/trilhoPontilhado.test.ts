import { pontosDoTrilho } from '../trilhoPontilhado';

describe('pontosDoTrilho', () => {
  const a = { x: 100, y: 0 };
  const b = { x: 100, y: 108 };

  it('desenha pontinhos entre os dois nós, na linha reta entre eles', () => {
    const p = pontosDoTrilho(a, b, 37, 37);
    expect(p.length).toBeGreaterThanOrEqual(2);
    p.forEach((ponto) => {
      expect(ponto.x).toBeCloseTo(100);
      expect(ponto.y).toBeGreaterThan(37);
      expect(ponto.y).toBeLessThan(108 - 37);
    });
  });

  it('os pontinhos têm espaçamento igual e crescem no sentido do destino', () => {
    const p = pontosDoTrilho(a, b, 37, 37);
    const passos = p.slice(1).map((ponto, i) => ponto.y - p[i].y);
    passos.forEach((s) => {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeCloseTo(passos[0]);
    });
  });

  it('funciona na diagonal e nunca invade o raio de afastamento dos nós', () => {
    const de = { x: 40, y: 0 };
    const para = { x: 150, y: 120 };
    const p = pontosDoTrilho(de, para, 38, 38);
    expect(p.length).toBeGreaterThan(0);
    p.forEach((ponto) => {
      expect(Math.hypot(ponto.x - de.x, ponto.y - de.y)).toBeGreaterThan(38);
      expect(Math.hypot(ponto.x - para.x, ponto.y - para.y)).toBeGreaterThan(38);
    });
  });

  it('sem espaço livre (nós quase encostados) ou nós no mesmo ponto: nenhum pontinho', () => {
    expect(pontosDoTrilho(a, { x: 100, y: 70 }, 37, 37)).toEqual([]);
    expect(pontosDoTrilho(a, a, 10, 10)).toEqual([]);
  });

  it('espaço pequeno mas suficiente: ao menos um pontinho, no meio', () => {
    const p = pontosDoTrilho(a, { x: 100, y: 90 }, 37, 37, 13);
    expect(p).toHaveLength(1);
    expect(p[0].y).toBeCloseTo(45);
  });
});
