// src/features/adolescente/receitas-ingredientes/utils/__tests__/receitasSalvas.test.ts
import {
  alternarReceitaSalva,
  estaSalva,
  normalizarSalvas,
  receitasNaOrdemSalva,
  textoQuantidadeSalvas,
} from '../receitasSalvas';

describe('receitas salvas', () => {
  it('salva no topo e tira ao tocar de novo', () => {
    const um = alternarReceitaSalva([], 'a', '2026-11-20T10:00:00Z');
    const dois = alternarReceitaSalva(um, 'b', '2026-11-20T11:00:00Z');
    expect(dois.map((s) => s.id)).toEqual(['b', 'a']);
    expect(estaSalva(dois, 'a')).toBe(true);
    expect(alternarReceitaSalva(dois, 'a', 'x').map((s) => s.id)).toEqual(['b']);
  });

  it('não confia no que veio do armazenamento', () => {
    expect(normalizarSalvas(null)).toEqual([]);
    expect(normalizarSalvas([{ id: 'a', salvaEm: 't' }, { id: 'a', salvaEm: 't2' }, { id: 3 }, 'x'])).toEqual([{ id: 'a', salvaEm: 't' }]);
  });

  it('mantém a ordem salva e some com receita despublicada', () => {
    const receitas = [{ id: 'a', t: 'A' }, { id: 'c', t: 'C' }];
    const salvas = [{ id: 'c', salvaEm: '2' }, { id: 'b', salvaEm: '1' }, { id: 'a', salvaEm: '0' }];
    expect(receitasNaOrdemSalva(salvas, receitas).map((r) => r.id)).toEqual(['c', 'a']);
  });

  it('texto da quantidade', () => {
    expect(textoQuantidadeSalvas(0)).toBe('Nenhuma salva ainda');
    expect(textoQuantidadeSalvas(1)).toBe('1 receita salva');
    expect(textoQuantidadeSalvas(4)).toBe('4 receitas salvas');
  });
});
