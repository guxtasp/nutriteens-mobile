import { nivelDoNutriente, selecionarFontes, AlimentoCatalogo } from '../fontesNutriente';

const a = (o: Partial<AlimentoCatalogo> & { id: string }): AlimentoCatalogo => ({
  nome: o.id, classificacao_nova: 'IN_NATURA', grupos_alimentares: [], alimento_nutrientes: null, ...o,
});
const ids = (l: AlimentoCatalogo[]) => l.map((x) => x.id);

describe('nivelDoNutriente', () => {
  it('usa o valor gravado (objeto ou lista)', () => {
    expect(nivelDoNutriente(a({ id: '1', alimento_nutrientes: { ferro: 'ALTO_TEOR' } }), 'ferro')).toBe('ALTO_TEOR');
    expect(nivelDoNutriente(a({ id: '1', alimento_nutrientes: [{ ferro: 'FONTE' }] }), 'ferro')).toBe('FONTE');
  });
  it('AUSENTE gravado não vira fonte, mesmo que o grupo infira', () => {
    expect(nivelDoNutriente(a({ id: '1', grupos_alimentares: ['FRUTAS'], alimento_nutrientes: { vitamina_c: 'AUSENTE' } }), 'vitamina_c')).toBeNull();
  });
  it('sem dado, cai no fallback por grupo', () => {
    expect(nivelDoNutriente(a({ id: '1', grupos_alimentares: ['FRUTAS'] }), 'vitamina_c')).toBe('ALTO_TEOR');
    expect(nivelDoNutriente(a({ id: '1', grupos_alimentares: ['FRUTAS'] }), 'ferro')).toBeNull();
  });
});

describe('selecionarFontes', () => {
  const frutas = (id: string, extra: Partial<AlimentoCatalogo> = {}) => a({ id, grupos_alimentares: ['FRUTAS'], ...extra });
  it('exclui ultraprocessados e quem não é fonte', () => {
    const r = selecionarFontes([frutas('a'), frutas('b', { classificacao_nova: 'ULTRAPROCESSADO' }), a({ id: 'c' })], 'vitamina_c', null);
    expect(ids(r)).toEqual(['a']);
  });
  it('acessíveis primeiro, sem remover os demais', () => {
    const r = selecionarFontes([frutas('a'), frutas('b')], 'vitamina_c', new Set(['b']));
    expect(ids(r)).toEqual(['b', 'a']);
  });
  it('alto teor antes de fonte, depois nome A–Z', () => {
    const r = selecionarFontes([
      a({ id: '1', nome: 'Zebra', alimento_nutrientes: { ferro: 'FONTE' } }),
      a({ id: '2', nome: 'Beta', alimento_nutrientes: { ferro: 'FONTE' } }),
      a({ id: '3', nome: 'Omega', alimento_nutrientes: { ferro: 'ALTO_TEOR' } }),
    ], 'ferro', null);
    expect(ids(r)).toEqual(['3', '2', '1']);
  });
  it('respeita o limite', () => {
    const l = Array.from({ length: 20 }, (_, i) => frutas(String(i).padStart(2, '0')));
    expect(selecionarFontes(l, 'vitamina_c', null, 5).length).toBe(5);
  });
});
