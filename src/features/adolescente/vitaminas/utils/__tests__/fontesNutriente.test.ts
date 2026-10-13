import { nivelDoNutriente, detalheDoNutriente, selecionarFontes, nutrientesComFonte, AlimentoCatalogo } from '../fontesNutriente';

const a = (o: Partial<AlimentoCatalogo> & { id: string }): AlimentoCatalogo => ({
  nome: o.id, classificacao_nova: 'IN_NATURA', eh_prato_composto: false, grupos_alimentares: [], alimento_nutrientes: null, ...o,
});
const ids = (l: AlimentoCatalogo[]) => l.map((x) => x.id);

describe('nivelDoNutriente — dado gravado', () => {
  it('usa o valor gravado (objeto ou lista)', () => {
    expect(nivelDoNutriente(a({ id: '1', alimento_nutrientes: { ferro: 'ALTO_TEOR' } }), 'ferro')).toBe('ALTO_TEOR');
    expect(nivelDoNutriente(a({ id: '1', alimento_nutrientes: [{ ferro: 'FONTE' }] }), 'ferro')).toBe('FONTE');
  });
  it('AUSENTE gravado não vira fonte, mesmo que o grupo infira', () => {
    expect(nivelDoNutriente(a({ id: '1', grupos_alimentares: ['FRUTAS'], alimento_nutrientes: { vitamina_c: 'AUSENTE' } }), 'vitamina_c')).toBeNull();
  });
  it('dado gravado vale mesmo em prato composto', () => {
    const d = detalheDoNutriente(a({ id: '1', eh_prato_composto: true, grupos_alimentares: ['A', 'B'], alimento_nutrientes: { ferro: 'FONTE' } }), 'ferro');
    expect(d).toEqual({ nivel: 'FONTE', origem: 'DADO' });
  });
});

describe('nivelDoNutriente — fallback por grupo (só alimento simples)', () => {
  it('alimento simples sem linha cai no grupo, em nível conservador', () => {
    expect(detalheDoNutriente(a({ id: '1', grupos_alimentares: ['FRUTAS'] }), 'vitamina_c')).toEqual({ nivel: 'FONTE', origem: 'GRUPO' });
    expect(nivelDoNutriente(a({ id: '1', grupos_alimentares: ['FRUTAS'] }), 'ferro')).toBeNull();
  });
  it('carnes e ovos não inferem ferro nem zinco pelo grupo', () => {
    const ovo = a({ id: '1', grupos_alimentares: ['CARNES_E_OVOS'] });
    expect(nivelDoNutriente(ovo, 'ferro')).toBeNull();
    expect(nivelDoNutriente(ovo, 'zinco')).toBeNull();
  });
  it('laticínio sem linha: cálcio só como FONTE, nunca ALTO_TEOR', () => {
    expect(nivelDoNutriente(a({ id: '1', grupos_alimentares: ['LEITE_E_DERIVADOS'] }), 'calcio')).toBe('FONTE');
  });
  it('prato composto sem linha não herda do grupo', () => {
    expect(nivelDoNutriente(a({ id: '1', eh_prato_composto: true, grupos_alimentares: ['LEITE_E_DERIVADOS'] }), 'calcio')).toBeNull();
  });
  it('alimento com mais de um grupo sem linha não herda', () => {
    expect(nivelDoNutriente(a({ id: '1', grupos_alimentares: ['CEREAIS_E_TUBERCULOS', 'LEITE_E_DERIVADOS'] }), 'calcio')).toBeNull();
  });
  it('alimento processado sem linha não herda (banana frita, bolo)', () => {
    expect(nivelDoNutriente(a({ id: '1', classificacao_nova: 'PROCESSADO', grupos_alimentares: ['FRUTAS'] }), 'vitamina_c')).toBeNull();
  });
});

describe('nivelDoNutriente — NULL em linha confiável', () => {
  it('linha TACO com coluna NULL = "não sabemos": não herda do grupo', () => {
    const f = a({ id: '1', grupos_alimentares: ['FRUTAS'], alimento_nutrientes: { fonte: 'TACO_4ED', vitamina_c: null } });
    expect(nivelDoNutriente(f, 'vitamina_c')).toBeNull();
  });
  it('linha revisada pela nutricionista com NULL também não herda', () => {
    const f = a({ id: '1', grupos_alimentares: ['LEITE_E_DERIVADOS'], alimento_nutrientes: [{ fonte: 'REVISADO_NUTRICIONISTA', calcio: null }] });
    expect(nivelDoNutriente(f, 'calcio')).toBeNull();
  });
  it('linha INFERIDO_POR_GRUPO com NULL ainda pode usar o grupo', () => {
    const f = a({ id: '1', grupos_alimentares: ['FRUTAS'], alimento_nutrientes: { fonte: 'INFERIDO_POR_GRUPO', vitamina_c: null } });
    expect(nivelDoNutriente(f, 'vitamina_c')).toBe('FONTE');
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
  it('dado gravado vem antes de fallback, mesmo sendo FONTE contra ALTO_TEOR por grupo', () => {
    const r = selecionarFontes([
      a({ id: 'grupo', nome: 'Amêndoa', grupos_alimentares: ['OLEAGINOSAS_E_SEMENTES'] }), // zinco ALTO_TEOR por grupo
      a({ id: 'dado', nome: 'Zebra', alimento_nutrientes: { zinco: 'FONTE' } }),
    ], 'zinco', null);
    expect(ids(r)).toEqual(['dado', 'grupo']);
  });
  it('acessibilidade continua mandando mais que a origem do dado', () => {
    const r = selecionarFontes([
      a({ id: 'dado', alimento_nutrientes: { zinco: 'FONTE' } }),
      a({ id: 'grupo', grupos_alimentares: ['OLEAGINOSAS_E_SEMENTES'] }),
    ], 'zinco', new Set(['grupo']));
    expect(ids(r)).toEqual(['grupo', 'dado']);
  });
  it('respeita o limite', () => {
    const l = Array.from({ length: 20 }, (_, i) => frutas(String(i).padStart(2, '0')));
    expect(selecionarFontes(l, 'vitamina_c', null, 5).length).toBe(5);
  });
});

describe('nutrientesComFonte', () => {
  it('lista só os nutrientes que têm pelo menos um alimento-fonte (ignora ultraprocessado e AUSENTE)', () => {
    const lista = [
      a({ id: '1', alimento_nutrientes: { ferro: 'FONTE', calcio: 'AUSENTE' } }),
      a({ id: '2', classificacao_nova: 'ULTRAPROCESSADO', alimento_nutrientes: { vitamina_d: 'ALTO_TEOR' } }),
    ];
    expect([...nutrientesComFonte(lista, ['ferro', 'calcio', 'vitamina_d'])]).toEqual(['ferro']);
  });
});
