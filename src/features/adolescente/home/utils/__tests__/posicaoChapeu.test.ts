import { posicaoChapeu } from '../posicaoChapeu';

describe('posicaoChapeu', () => {
  it('chapéu tem pouco menos da metade do avatar e sobe acima do círculo', () => {
    const p = posicaoChapeu(300);
    expect(p.largura).toBe(138);
    expect(p.topo).toBeLessThan(0); // a ponta passa da borda de cima do avatar
    expect(p.esquerda).toBeGreaterThan(0);
    expect(p.giroGraus).toBe(18);
  });

  it('escala junto com o avatar (proporcional ao diâmetro)', () => {
    const g = posicaoChapeu(300);
    const m = posicaoChapeu(150);
    expect(m.largura).toBe(Math.round(g.largura / 2));
    expect(Math.abs(m.esquerda * 2 - g.esquerda)).toBeLessThanOrEqual(2);
    expect(Math.abs(m.topo * 2 - g.topo)).toBeLessThanOrEqual(2);
  });

  it('sem giro, a base do cone cai exatamente no ponto alvo', () => {
    const d = 200;
    const p = posicaoChapeu(d, 0);
    const baseX = p.esquerda + 0.52 * p.largura;
    const baseY = p.topo + 0.84 * p.largura;
    expect(baseX).toBeCloseTo(d * 0.6, 0);
    expect(baseY).toBeCloseTo(d * 0.3, 0);
  });
});
