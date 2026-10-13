import { nutrientesAlcancaveis } from '../nutrientesPorGrupo';

describe('nutrientesAlcancaveis', () => {
  it('nutriente sem nenhum alimento-fonte (ex.: vitamina D sem dado) não é alcançável', () => {
    const catalogo = [
      { grupos_alimentares: ['CARNES_E_OVOS'], alimento_nutrientes: null },
      { grupos_alimentares: ['LEITE_E_DERIVADOS'], alimento_nutrientes: { calcio: 'ALTO_TEOR' } },
    ];
    const r = nutrientesAlcancaveis(catalogo, ['vitamina_d', 'calcio', 'proteina']);
    expect(r.has('vitamina_d')).toBe(false);
    expect(r.has('calcio')).toBe(true);
    expect(r.has('proteina')).toBe(true); // carnes e ovos inferem proteína pelo grupo
  });
  it('AUSENTE gravado não conta, mesmo com grupo que inferiria', () => {
    const catalogo = [{ grupos_alimentares: ['FRUTAS'], alimento_nutrientes: { vitamina_c: 'AUSENTE' } }];
    expect(nutrientesAlcancaveis(catalogo, ['vitamina_c']).size).toBe(0);
  });
});
