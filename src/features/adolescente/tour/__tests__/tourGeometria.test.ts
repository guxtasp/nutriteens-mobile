import { caminhoSpotlight, escolherLado, inflar, misturar } from '../tourGeometria';
import { PASSOS_TOUR, numeroDoPasso, TOTAL_PASSOS_COM_ALVO } from '../tourPassos';

describe('inflar', () => {
  it('aumenta por todos os lados', () => {
    expect(inflar({ x: 10, y: 20, largura: 30, altura: 40 }, 5)).toEqual({ x: 5, y: 15, largura: 40, altura: 50 });
  });
  it('não sai da tela', () => {
    const r = inflar({ x: 2, y: 2, largura: 96, altura: 96 }, 8, { largura: 100, altura: 100 });
    expect(r).toEqual({ x: 0, y: 0, largura: 100, altura: 100 });
  });
});

describe('escolherLado', () => {
  it('alvo no topo: cartão abaixo', () => {
    expect(escolherLado({ x: 0, y: 50, largura: 100, altura: 50 }, 800)).toBe('abaixo');
  });
  it('alvo embaixo: cartão acima', () => {
    expect(escolherLado({ x: 0, y: 700, largura: 100, altura: 50 }, 800)).toBe('acima');
  });
});

describe('misturar', () => {
  it('interpola', () => {
    const a = { x: 0, y: 0, largura: 10, altura: 10 };
    const b = { x: 100, y: 50, largura: 30, altura: 20 };
    expect(misturar(a, b, 0.5)).toEqual({ x: 50, y: 25, largura: 20, altura: 15 });
    expect(misturar(a, b, 0)).toEqual(a);
    expect(misturar(a, b, 1)).toEqual(b);
  });
});

describe('caminhoSpotlight', () => {
  const tela = { largura: 400, altura: 800 };
  it('sem alvo é só a tela cheia', () => {
    expect(caminhoSpotlight(tela, null, 16)).toBe('M0,0 H400 V800 H0 Z');
  });
  it('com alvo tem dois subcaminhos (evenodd)', () => {
    const d = caminhoSpotlight(tela, { x: 20, y: 100, largura: 200, altura: 60 }, 16);
    expect(d.startsWith('M0,0 H400 V800 H0 Z M36,100')).toBe(true);
    expect((d.match(/Z/g) ?? []).length).toBe(2);
  });
  it('limita o raio à metade do menor lado', () => {
    const d = caminhoSpotlight(tela, { x: 0, y: 0, largura: 20, altura: 20 }, 99);
    expect(d).toContain('M10,0 H10');
  });
});

describe('roteiro', () => {
  it('ids únicos', () => {
    const ids = PASSOS_TOUR.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('abre e fecha na Home com tela cheia', () => {
    const primeiro = PASSOS_TOUR[0];
    const ultimo = PASSOS_TOUR[PASSOS_TOUR.length - 1];
    expect(primeiro.tela).toBe('Home');
    expect(ultimo.tela).toBe('Home');
    expect(primeiro.alvo).toBeUndefined();
    expect(ultimo.alvo).toBeUndefined();
  });
  it('as telas vêm em blocos Home -> Trilha -> Social -> Home', () => {
    const blocos: string[] = [];
    for (const p of PASSOS_TOUR) if (blocos[blocos.length - 1] !== p.tela) blocos.push(p.tela);
    expect(blocos).toEqual(['Home', 'Trilha', 'Social', 'Home']);
  });
  it('todo passo do meio tem alvo, título e texto', () => {
    for (const p of PASSOS_TOUR.slice(1, -1)) {
      expect(p.alvo).toBeTruthy();
      expect(p.titulo.length).toBeGreaterThan(0);
      expect(p.texto.length).toBeGreaterThan(0);
    }
  });
  it('numeração do progresso', () => {
    expect(numeroDoPasso(0)).toBe(0);
    expect(numeroDoPasso(1)).toBe(1);
    expect(numeroDoPasso(PASSOS_TOUR.length - 2)).toBe(TOTAL_PASSOS_COM_ALVO);
    expect(numeroDoPasso(PASSOS_TOUR.length - 1)).toBe(0);
  });
});
