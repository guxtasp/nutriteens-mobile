// src/features/adolescente/receitas-ingredientes/utils/__tests__/guiaReceitas.test.ts
import { falaGuiaReceitas, rotuloBotaoReceitas } from '../guiaReceitas';

const base = { ingredientes: 0, combinam: 0, agora: 0, semReceitas: false };

describe('falaGuiaReceitas', () => {
  it('explica o que fazer quando chega', () => {
    expect(falaGuiaReceitas(base)).toMatch(/o que tem aí/);
  });
  it('dá retorno na hora a cada ingrediente', () => {
    expect(falaGuiaReceitas({ ...base, ingredientes: 2, combinam: 4, agora: 1 })).toBe('Boa! Com isso já dá pra fazer 1 receita agora.');
    expect(falaGuiaReceitas({ ...base, ingredientes: 2, combinam: 4, agora: 3 })).toMatch(/3 receitas agora/);
    expect(falaGuiaReceitas({ ...base, ingredientes: 1, combinam: 1 })).toMatch(/1 receita que usa/);
    expect(falaGuiaReceitas({ ...base, ingredientes: 1 })).toMatch(/Ainda não achei/);
  });
  it('sem receitas publicadas avisa sem travar', () => {
    expect(falaGuiaReceitas({ ...base, semReceitas: true, ingredientes: 3 })).toMatch(/Ainda não tem receita/);
  });
});

describe('rotuloBotaoReceitas', () => {
  it('mostra quantas receitas vai ver', () => {
    expect(rotuloBotaoReceitas({ ingredientes: 0, combinam: 0 })).toBe('MARQUE PELO MENOS 1 INGREDIENTE');
    expect(rotuloBotaoReceitas({ ingredientes: 2, combinam: 0 })).toBe('VER RECEITAS');
    expect(rotuloBotaoReceitas({ ingredientes: 2, combinam: 1 })).toBe('VER 1 RECEITA');
    expect(rotuloBotaoReceitas({ ingredientes: 2, combinam: 7 })).toBe('VER 7 RECEITAS');
  });
});
