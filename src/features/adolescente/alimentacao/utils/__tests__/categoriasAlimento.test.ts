import {
  CATEGORIAS,
  GUIA_CADASTRO,
  alternarGrupo,
  gruposDosIngredientes,
  normalizarGrupos,
  regraGrupos,
  textoBotaoCadastro,
  validarGrupos,
} from '../categoriasAlimento';

describe('regraGrupos', () => {
  it('natural escolhe 1 grupo; preparado e industrializado marcam quantos quiserem', () => {
    expect(regraGrupos('NATURAL')).toEqual({ multiplo: false });
    expect(regraGrupos('PREPARADO_EM_CASA')).toEqual({ multiplo: true });
    expect(regraGrupos('INDUSTRIALIZADO')).toEqual({ multiplo: true });
  });
});

describe('alternarGrupo', () => {
  it('natural: tocar em outro grupo troca a escolha, tocar no mesmo mantém', () => {
    const a = alternarGrupo([], 'FRUTAS', 'NATURAL');
    expect(a).toEqual(['FRUTAS']);
    expect(alternarGrupo(a, 'LEGUMES_E_VERDURAS', 'NATURAL')).toEqual(['LEGUMES_E_VERDURAS']);
    expect(alternarGrupo(a, 'FRUTAS', 'NATURAL')).toEqual(['FRUTAS']);
  });

  it('preparado em casa: pode ter só 2 grupos (arroz com feijão)', () => {
    let g: string[] = [];
    for (const v of ['CEREAIS_E_TUBERCULOS', 'LEGUMINOSAS']) g = alternarGrupo(g, v, 'PREPARADO_EM_CASA');
    expect(g).toEqual(['CEREAIS_E_TUBERCULOS', 'LEGUMINOSAS']);
  });

  it('preparado em casa: sem teto, aceita todas as categorias e desmarca normalmente', () => {
    let g: string[] = [];
    for (const c of CATEGORIAS) g = alternarGrupo(g, c.valor, 'PREPARADO_EM_CASA');
    expect(g.length).toBe(CATEGORIAS.length);
    expect(alternarGrupo(g, CATEGORIAS[0].valor, 'PREPARADO_EM_CASA').length).toBe(CATEGORIAS.length - 1);
  });

  it('industrializado também marca vários', () => {
    expect(alternarGrupo(['CEREAIS_E_TUBERCULOS'], 'ACUCARES_E_DOCES', 'INDUSTRIALIZADO')).toEqual(['CEREAIS_E_TUBERCULOS', 'ACUCARES_E_DOCES']);
  });

  it('ignora valor que não é uma categoria', () => {
    expect(alternarGrupo(['FRUTAS'], 'QUALQUER_COISA', 'PREPARADO_EM_CASA')).toEqual(['FRUTAS']);
  });
});

describe('normalizarGrupos / validarGrupos', () => {
  it('tira repetidos e valores inválidos, mantendo a ordem', () => {
    expect(normalizarGrupos(['FRUTAS', 'X', 'FRUTAS', 'BEBIDAS'])).toEqual(['FRUTAS', 'BEBIDAS']);
  });
  it('exige só o mínimo de 1 grupo', () => {
    expect(validarGrupos([])).not.toBeNull();
    expect(validarGrupos(['FRUTAS'])).toBeNull();
    expect(validarGrupos(CATEGORIAS.map((c) => c.valor))).toBeNull();
  });
});

describe('guia de cadastro', () => {
  it('todo grupo citado nos exemplos existe nas categorias', () => {
    const validos = new Set(CATEGORIAS.map((c) => c.valor));
    for (const guia of Object.values(GUIA_CADASTRO)) {
      for (const ex of guia.exemplos) {
        for (const item of ex.itens) expect(validos.has(item.grupo)).toBe(true);
      }
    }
  });
  it('exemplo do natural tem 1 grupo só (segue a regra)', () => {
    for (const ex of GUIA_CADASTRO.NATURAL.exemplos) expect(ex.itens.length).toBe(1);
  });
  it('bolo de cenoura está no guia do preparado em casa', () => {
    expect(GUIA_CADASTRO.PREPARADO_EM_CASA.exemplos[0].nome).toBe('Bolo de cenoura');
  });
});

describe('textoBotaoCadastro', () => {
  it('diz o que falta, na ordem: nome, depois grupo', () => {
    expect(textoBotaoCadastro({ nomeValido: false, qtdGrupos: 2, multiplo: true })).toBe('Escreva o nome do alimento');
    expect(textoBotaoCadastro({ nomeValido: true, qtdGrupos: 0, multiplo: true })).toBe('Marque pelo menos 1 grupo');
    expect(textoBotaoCadastro({ nomeValido: true, qtdGrupos: 0, multiplo: false })).toBe('Escolha um grupo');
    expect(textoBotaoCadastro({ nomeValido: true, qtdGrupos: 1, multiplo: false })).toBe('Cadastrar alimento');
  });
});

describe('gruposDosIngredientes', () => {
  it('bolo de cenoura: ingredientes viram os grupos, sem repetir', () => {
    const r = gruposDosIngredientes([
      { grupos_alimentares: ['LEGUMES_E_VERDURAS'] }, // cenoura
      { grupos_alimentares: ['CARNES_E_OVOS'] }, // ovo
      { grupos_alimentares: ['CEREAIS_E_TUBERCULOS'] }, // farinha
      { grupos_alimentares: ['ACUCARES_E_DOCES'] }, // açúcar
      { grupos_alimentares: ['CARNES_E_OVOS'] }, // 2º ovo: não repete
    ]);
    expect(r).toEqual(['LEGUMES_E_VERDURAS', 'CARNES_E_OVOS', 'CEREAIS_E_TUBERCULOS', 'ACUCARES_E_DOCES']);
  });
  it('ingrediente com vários grupos soma todos; sem grupos não quebra', () => {
    expect(gruposDosIngredientes([{ grupos_alimentares: ['FRUTAS', 'LEITE_E_DERIVADOS'] }, { grupos_alimentares: null }, {}])).toEqual(['FRUTAS', 'LEITE_E_DERIVADOS']);
    expect(gruposDosIngredientes([])).toEqual([]);
  });
});
