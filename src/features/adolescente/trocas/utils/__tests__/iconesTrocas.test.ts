import { ICONE_ALTERNATIVA, ICONE_CATEGORIA } from '../iconesTrocas';
import { CATEGORIAS_TROCA } from '../trocas';

describe('ícones das trocas', () => {
  it('toda categoria tem ícone', () => {
    CATEGORIAS_TROCA.forEach((c) => expect(typeof ICONE_CATEGORIA[c]).toBe('string'));
  });
  it('alternativas usam um ícone único', () => {
    expect(ICONE_ALTERNATIVA).toBe('leaf');
  });
});

import { iconeDoDestino } from '../iconesTrocas';
import { rotulosNutrientes } from '../trocas';

describe('iconeDoDestino', () => {
  it('acha pelo início do nome, sem acento nem caixa', () => {
    expect(iconeDoDestino('Água de coco')).toBe('palm-tree');
    expect(iconeDoDestino('Água')).toBe('water-outline');
    expect(iconeDoDestino('Maçã')).toBe('food-apple-outline');
    expect(iconeDoDestino('Pão de queijo')).toBe('muffin');
  });
  it('cai na folha quando não conhece', () => {
    expect(iconeDoDestino('Alimento qualquer')).toBe(ICONE_ALTERNATIVA);
  });
});

describe('rotulosNutrientes', () => {
  it('traduz, ordena por prioridade e limita', () => {
    expect(rotulosNutrientes(['vitamina_c', 'calcio', 'proteina', 'fibra'])).toEqual(['proteína', 'fibra', 'cálcio']);
    expect(rotulosNutrientes(['calcio', 'xyz'], 2)).toEqual(['cálcio']);
  });
  it('tolera vazio/nulo', () => {
    expect(rotulosNutrientes(undefined)).toEqual([]);
    expect(rotulosNutrientes(null)).toEqual([]);
  });
});
