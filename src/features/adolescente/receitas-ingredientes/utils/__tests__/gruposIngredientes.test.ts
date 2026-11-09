import { agruparIngredientes, alternarAtalho, atalhoNaDespensa, contarMarcados, grupoCasaDe } from '../gruposIngredientes';
import { nomeLegivel, separarPorFalta, unirUniversos, type IngredienteCasa } from '../combinarReceitas';

const universo: IngredienteCasa[] = [
  { id: 'a1', nome: 'Arroz, integral, cozido', grupos: ['CEREAIS_E_TUBERCULOS'] },
  { id: 'a2', nome: 'Arroz, tipo 1, cru', grupos: ['CEREAIS_E_TUBERCULOS'] },
  { id: 'b1', nome: 'Banana, prata, crua', grupos: ['FRUTAS'] },
  { id: 'c1', nome: 'Cenoura, crua', grupos: ['LEGUMES_E_VERDURAS'] },
  { id: 'o1', nome: 'Ovo, de galinha, cozido', grupos: ['CARNES_E_OVOS'] },
  { id: 'f1', nome: 'Feijão, carioca, cozido', grupos: ['LEGUMINOSAS'] },
  { id: 'z1', nome: 'Abobrinha, cozida', grupos: ['LEGUMES_E_VERDURAS'] },
  { id: 'z2', nome: 'Azeite de oliva', grupos: ['OLEOS_E_GORDURAS'] },
  { id: 'z3', nome: 'Sal refinado' },
];

describe('agruparIngredientes', () => {
  const g = agruparIngredientes(universo);

  it('mostra todos os ingredientes, cada um no seu grupo', () => {
    const todos = Object.values(g).flat();
    expect(todos).toHaveLength(8); // arroz (2 variações) vira 1 atalho
    expect(g.FRUTAS_VERDURAS.map((a) => a.nome)).toEqual(['Banana', 'Cenoura', 'Abobrinha']);
    expect(g.PROTEINAS_LATICINIOS.map((a) => a.nome)).toEqual(['Ovo', 'Feijão']);
    expect(g.CEREAIS_PAES.map((a) => a.nome)).toEqual(['Arroz']);
    expect(g.TEMPEROS_BASICOS.map((a) => a.nome)).toEqual(['Azeite', 'Sal']);
  });
  it('o atalho cobre todas as variações', () => {
    expect(g.CEREAIS_PAES[0].ids).toEqual(['a1', 'a2']);
  });
  it('grupo vem da maioria; sem grupo cai em temperos e básicos', () => {
    expect(grupoCasaDe([['FRUTAS'], ['FRUTAS'], ['CARNES_E_OVOS']])).toBe('FRUTAS_VERDURAS');
    expect(grupoCasaDe([[]])).toBe('TEMPEROS_BASICOS');
    expect(grupoCasaDe([['ACUCARES_E_DOCES', 'CEREAIS_E_TUBERCULOS']])).toBe('CEREAIS_PAES');
  });
  it('marcar e desmarcar o atalho', () => {
    const arroz = g.CEREAIS_PAES[0];
    const marcada = alternarAtalho(arroz, []);
    expect(atalhoNaDespensa(arroz, marcada)).toBe(true);
    expect(contarMarcados(g.CEREAIS_PAES, marcada)).toBe(1);
    expect(alternarAtalho(arroz, marcada)).toEqual([]);
  });
  it('desmarcar também tira o ingrediente que foi adicionado pela busca', () => {
    const arroz = g.CEREAIS_PAES[0];
    const pelaBusca = [{ id: 'a2', nome: 'Arroz, tipo 1, cru' }];
    expect(atalhoNaDespensa(arroz, pelaBusca)).toBe(true);
    expect(alternarAtalho(arroz, pelaBusca)).toEqual([]);
  });
});

describe('combinarReceitas (novos)', () => {
  it('unirUniversos mantém o grupo do catálogo', () => {
    const r = unirUniversos([{ id: 'x', nome: 'Ovo' }], [{ id: 'x', nome: 'Ovo', grupos: ['CARNES_E_OVOS'] }]);
    expect(r[0].grupos).toEqual(['CARNES_E_OVOS']);
  });
  it('nomeLegivel', () => {
    expect(nomeLegivel('Arroz, integral, cozido')).toBe('arroz integral cozido');
  });
  it('separarPorFalta', () => {
    const mk = (id: string, faltam: number) => ({
      receita: { id, titulo: id, dificuldade: 'FACIL', ingredientes: [] },
      tenho: [],
      faltam: Array.from({ length: faltam }, () => ({ alimentoId: 'x', nome: 'x', quantidadeTexto: null })),
    });
    const s = separarPorFalta([mk('a', 0), mk('b', 2), mk('c', 3)]);
    expect([s.agora.length, s.pouquinho.length, s.emParte.length]).toEqual([1, 1, 1]);
  });
});
