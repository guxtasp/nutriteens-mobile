import { caminhoFatia, fatiasPrato, pontoNoCirculo } from '../prato';

describe('prato da semana', () => {
  it('pontoNoCirculo: 0° é o topo e 90° é a direita', () => {
    const topo = pontoNoCirculo(100, 100, 50, 0);
    const dir = pontoNoCirculo(100, 100, 50, 90);
    expect(Math.round(topo.x)).toBe(100);
    expect(Math.round(topo.y)).toBe(50);
    expect(Math.round(dir.x)).toBe(150);
    expect(Math.round(dir.y)).toBe(100);
  });

  it('as frações somam 1 e a ordem é natural, processado, ultra', () => {
    const f = fatiasPrato({ natural: 6, processado: 3, ultra: 1 }, 90, 90, 70);
    expect(f.map((x) => x.chave)).toEqual(['natural', 'processado', 'ultra']);
    expect(f.reduce((s, x) => s + x.fracao, 0)).toBeCloseTo(1);
    expect(Math.round(f[0].fim)).toBe(216); // 60% de 360°
    expect(Math.round(f[2].fim)).toBe(360);
  });

  it('parte sem itens não vira fatia; sem nenhum item não há prato', () => {
    expect(fatiasPrato({ natural: 2, processado: 0, ultra: 2 }, 90, 90, 70).map((x) => x.chave)).toEqual(['natural', 'ultra']);
    expect(fatiasPrato({ natural: 0, processado: 0, ultra: 0 }, 90, 90, 70)).toEqual([]);
  });

  it('uma parte só desenha o prato inteiro (dois arcos, sem linha até o centro)', () => {
    const [unica] = fatiasPrato({ natural: 5, processado: 0, ultra: 0 }, 90, 90, 70);
    expect(unica.fracao).toBe(1);
    expect(unica.d.match(/A /g)).toHaveLength(2);
    expect(unica.d).not.toMatch(/L /);
  });

  it('o arco usa o flag de arco grande só quando a fatia passa de 180°', () => {
    expect(caminhoFatia(90, 90, 70, 0, 200)).toMatch(/A 70 70 0 1 1/);
    expect(caminhoFatia(90, 90, 70, 0, 120)).toMatch(/A 70 70 0 0 1/);
  });
});
