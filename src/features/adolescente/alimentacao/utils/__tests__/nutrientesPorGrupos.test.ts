import {
  inferirNutrientesPorGrupo,
  inferirNutrientesPorGrupos,
  inferirAtencaoPorGrupo,
  inferirAtencaoPorGrupos,
} from '../nutrientesPorGrupo';

describe('inferirNutrientesPorGrupos', () => {
  it('com 1 grupo é igual à inferência antiga (nada muda pro alimento natural)', () => {
    expect(inferirNutrientesPorGrupos(['CARNES_E_OVOS'])).toEqual(inferirNutrientesPorGrupo('CARNES_E_OVOS'));
    expect(inferirNutrientesPorGrupos(['FRUTAS'])).toEqual({ vitamina_c: 'ALTO_TEOR' });
  });

  it('bolo de cenoura: junta os grupos, mas nunca passa de "fonte"', () => {
    const r = inferirNutrientesPorGrupos(['LEGUMES_E_VERDURAS', 'CARNES_E_OVOS', 'CEREAIS_E_TUBERCULOS', 'ACUCARES_E_DOCES']);
    expect(r.vitamina_a).toBe('FONTE'); // cenoura
    expect(r.proteina).toBe('FONTE'); // ovo, mas diluído no bolo: ALTO_TEOR -> FONTE
    expect(r.ferro).toBe('FONTE');
    expect(Object.values(r)).not.toContain('ALTO_TEOR');
  });

  it('fica com o maior nível quando dois grupos inferem o mesmo nutriente', () => {
    const r = inferirNutrientesPorGrupos(['LEGUMINOSAS', 'CARNES_E_OVOS']); // proteína FONTE e ALTO_TEOR
    expect(r.proteina).toBe('FONTE'); // maior (ALTO_TEOR) rebaixado por ser mistura
    expect(r.fibra).toBe('FONTE');
  });

  it('grupos repetidos contam como um (não vira mistura)', () => {
    expect(inferirNutrientesPorGrupos(['FRUTAS', 'FRUTAS'])).toEqual({ vitamina_c: 'ALTO_TEOR' });
  });

  it('lista vazia ou só grupos sem inferência não preenche nada', () => {
    expect(inferirNutrientesPorGrupos([])).toEqual({});
    expect(inferirNutrientesPorGrupos(['BEBIDAS'])).toEqual({});
  });
});

describe('inferirAtencaoPorGrupos', () => {
  it('com 1 grupo é igual à inferência antiga', () => {
    expect(inferirAtencaoPorGrupos(['ACUCARES_E_DOCES'])).toEqual(inferirAtencaoPorGrupo('ACUCARES_E_DOCES'));
    expect(inferirAtencaoPorGrupos(['ACUCARES_E_DOCES'])).toEqual({ carboidrato: 'ALTO' });
  });
  it('em mistura, o grupo deixa de definir a quantidade: ALTO vira MODERADO', () => {
    expect(inferirAtencaoPorGrupos(['CEREAIS_E_TUBERCULOS', 'ACUCARES_E_DOCES', 'OLEOS_E_GORDURAS'])).toEqual({
      carboidrato: 'MODERADO',
      lipideos: 'MODERADO',
    });
  });
  it('mistura sem grupo de atenção não inventa nada', () => {
    expect(inferirAtencaoPorGrupos(['FRUTAS', 'LEITE_E_DERIVADOS'])).toEqual({});
  });
});
