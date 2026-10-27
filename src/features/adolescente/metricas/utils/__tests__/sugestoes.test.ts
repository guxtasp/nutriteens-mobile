import { gruposAusentes, restricaoRecursos, selecionarSugestoes, type AlimentoSugestao } from '../sugestoes';

const catalogo: AlimentoSugestao[] = [
  { nome: 'Banana', grupos: ['FRUTAS'] }, { nome: 'Laranja', grupos: ['FRUTAS'] }, { nome: 'Mamão', grupos: ['FRUTAS'] }, { nome: 'Manga', grupos: ['FRUTAS'] },
  { nome: 'Couve', grupos: ['LEGUMES_E_VERDURAS'] }, { nome: 'Cenoura', grupos: ['LEGUMES_E_VERDURAS'] },
  { nome: 'Feijão', grupos: ['LEGUMINOSAS'] },
  { nome: 'Ovo', grupos: ['CARNES_E_OVOS'] },
  { nome: 'Castanha', grupos: ['OLEAGINOSAS_E_SEMENTES'] },
];

describe('restricaoRecursos (EBIA só ajusta o tom)', () => {
  it.each([
    ['SEGURANCA_ALIMENTAR', false], ['INSEGURANCA_LEVE', false],
    ['INSEGURANCA_MODERADA', true], ['INSEGURANCA_GRAVE', true],
  ] as const)('%s -> %s', (c, esperado) => expect(restricaoRecursos(c)).toBe(esperado));

  it('sem triagem: precaução (true)', () => {
    expect(restricaoRecursos(null)).toBe(true);
    expect(restricaoRecursos(undefined)).toBe(true);
  });
});

describe('gruposAusentes', () => {
  it('lista só grupos do catálogo que não apareceram, em ordem estável', () => {
    expect(gruposAusentes(['FRUTAS'], catalogo)).toEqual(['CARNES_E_OVOS', 'LEGUMES_E_VERDURAS', 'LEGUMINOSAS', 'OLEAGINOSAS_E_SEMENTES']);
  });
  it('grupo presente fora do catálogo não atrapalha', () => {
    expect(gruposAusentes(['OUTRO'], [{ nome: 'Banana', grupos: ['FRUTAS'] }])).toEqual(['FRUTAS']);
  });
});

describe('selecionarSugestoes', () => {
  it('só sugere grupos ausentes, no máximo 3 grupos e 3 alimentos por grupo', () => {
    const s = selecionarSugestoes(catalogo, ['LEGUMINOSAS'], 'u1|2026-10-15');
    expect(s.length).toBeLessThanOrEqual(3);
    s.forEach((g) => {
      expect(g.grupo).not.toBe('LEGUMINOSAS');
      expect(g.alimentos.length).toBeLessThanOrEqual(3);
      expect(g.alimentos.length).toBeGreaterThan(0);
    });
  });
  it('é estável para a mesma semente e pode mudar com outra', () => {
    const a = selecionarSugestoes(catalogo, [], 'u1|2026-10-15');
    expect(selecionarSugestoes(catalogo, [], 'u1|2026-10-15')).toEqual(a);
  });
  it('só devolve alimentos que vieram do catálogo (já filtrado pela EBIA no serviço)', () => {
    const nomes = new Set(catalogo.map((c) => c.nome));
    selecionarSugestoes(catalogo, [], 'x').forEach((g) => g.alimentos.forEach((n) => expect(nomes.has(n)).toBe(true)));
  });
  it('não repete alimento entre grupos', () => {
    const multi: AlimentoSugestao[] = [{ nome: 'Amendoim', grupos: ['LEGUMINOSAS', 'OLEAGINOSAS_E_SEMENTES'] }, { nome: 'Feijão', grupos: ['LEGUMINOSAS'] }];
    const todos = selecionarSugestoes(multi, [], 'x').flatMap((g) => g.alimentos);
    expect(new Set(todos).size).toBe(todos.length);
  });
  it('catálogo vazio ou tudo presente: nenhuma sugestão', () => {
    expect(selecionarSugestoes([], [], 'x')).toEqual([]);
    expect(selecionarSugestoes(catalogo, ['FRUTAS', 'LEGUMES_E_VERDURAS', 'LEGUMINOSAS', 'CARNES_E_OVOS', 'OLEAGINOSAS_E_SEMENTES'], 'x')).toEqual([]);
  });
});
