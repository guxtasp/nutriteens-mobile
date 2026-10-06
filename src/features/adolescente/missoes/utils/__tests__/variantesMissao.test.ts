import {
  VARIANTES_MISSAO,
  obterVariante,
  sortearVariante,
  calcularProgressoAlimentar,
  metaAguaDaVariante,
  type RegraVariante,
} from '../variantesMissao';

const codigos = VARIANTES_MISSAO.map((v) => v.codigo);

const item = (refeicao_id: string, cls: string, grupos: string[], tipo = 'ALMOCO', quantidade = 1) => ({
  refeicao_id,
  quantidade,
  alimentos: { classificacao_nova: cls, grupos_alimentares: grupos, alimento_nutrientes: null },
  refeicoes: { tipo },
});

const itens = [
  item('r1', 'IN_NATURA', ['CARNES_E_OVOS']),
  item('r1', 'IN_NATURA', ['CEREAIS_E_TUBERCULOS'], 'ALMOCO', 2),
  item('r2', 'ULTRAPROCESSADO', ['ACUCARES_E_DOCES'], 'LANCHE_TARDE'),
  item('r2', 'IN_NATURA', ['FRUTAS'], 'LANCHE_TARDE'),
  item('r3', 'IN_NATURA', ['FRUTAS'], 'CAFE_DA_MANHA'),
];
const prog = (r: RegraVariante) => calcularProgressoAlimentar(r, itens)!;

describe('biblioteca de variantes', () => {
  it('tem várias variantes, com códigos únicos e tipo base válido', () => {
    expect(VARIANTES_MISSAO.length).toBeGreaterThanOrEqual(50);
    expect(new Set(codigos).size).toBe(codigos.length);
    const validos = ['AGUA_ML', 'ATIVIDADE_MIN', 'ALIMENTO_NATURAL_QTD', 'REFEICAO_SEM_ULTRAPROCESSADO'];
    expect(VARIANTES_MISSAO.every((v) => validos.includes(v.tipoBase))).toBe(true);
  });
  it('obterVariante', () => {
    expect(obterVariante('nut_proteina_2')?.regra.regra).toBe('FONTE_NUTRIENTE');
    expect(obterVariante('nao_existe')).toBeNull();
    expect(obterVariante(undefined)).toBeNull();
  });
  it('sortearVariante respeita área e evitar; sem opção, ignora evitar', () => {
    expect(sortearVariante({ areas: ['ATIVIDADE'], evitar: codigos.filter((c) => c !== 'ativ_min_30') }).codigo).toBe('ativ_min_30');
    expect(sortearVariante({ areas: ['AGUA'], evitar: codigos }).area).toBe('AGUA');
    expect(sortearVariante({ aleatorio: () => 0.9999999 })).toBeTruthy();
  });
});

describe('progresso alimentar das variantes', () => {
  it('naturais soma quantidade', () => expect(prog({ regra: 'NATURAIS_QTD', qtd: 5 }).concluida).toBe(true));
  it('sem ultra conta refeições inteiras', () => expect(prog({ regra: 'SEM_ULTRA', refeicoes: 2 }).atual).toBe(2));
  it('refeições distintas', () => expect(prog({ regra: 'REFEICOES_QTD', qtd: 3 }).atual).toBe(3));
  it('tipo de refeição', () => {
    expect(prog({ regra: 'REFEICAO_TIPO', tipo: 'CAFE_DA_MANHA' }).concluida).toBe(true);
    expect(prog({ regra: 'REFEICAO_TIPO', tipo: 'JANTAR' }).concluida).toBe(false);
  });
  it('variedade de grupos e grupo específico', () => {
    expect(prog({ regra: 'VARIEDADE_GRUPOS', grupos: 4 }).atual).toBe(4);
    expect(prog({ regra: 'GRUPO', grupo: 'FRUTAS', qtd: 2 }).concluida).toBe(true);
  });
  it('proteína vale por grupo mesmo sem linha em alimento_nutrientes', () => {
    expect(prog({ regra: 'FONTE_NUTRIENTE', nutriente: 'proteina', qtd: 1, rotulo: 'proteína' }).concluida).toBe(true);
  });
  it('água/atividade ficam pro serviço', () => {
    expect(metaAguaDaVariante({ regra: 'AGUA_PCT_META', pct: 70 }, 2000)).toBe(1400);
    expect(calcularProgressoAlimentar({ regra: 'AGUA_PCT_META', pct: 50 }, itens)).toBeNull();
  });
});
