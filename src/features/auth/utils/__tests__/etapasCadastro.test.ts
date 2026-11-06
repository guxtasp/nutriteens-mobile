import {
  etapa1Erro,
  etapa1Valida,
  etapa2Erro,
  etapa2Valida,
  temDadosPreenchidos,
  primeiroNome,
  progressoDaEtapa,
  ERRO_GENERO,
  ERRO_ESCOLA,
  ERRO_TERMOS,
  type DadosCadastro,
} from '../etapasCadastro';
import { GENERO_OPTIONS } from '../../constants/generoOptions';
import { TIPO_ESCOLA_OPTIONS } from '../../constants/tipoEscolaOptions';

const vazio: DadosCadastro = {
  nome: '',
  dataNascimento: '',
  genero: null,
  tipoEscola: null,
  email: '',
  password: '',
  aceitouTermos: false,
};

const completo: DadosCadastro = {
  nome: 'Ana Souza',
  dataNascimento: '14/03/2010',
  genero: 'FEMININO',
  tipoEscola: 'PUBLICA',
  email: 'ana@email.com',
  password: 'senha1234',
  aceitouTermos: true,
};

describe('etapa 1', () => {
  it('com tudo vazio não é válida e começa pelo nome', () => {
    expect(etapa1Valida(vazio)).toBe(false);
    expect(etapa1Erro(vazio)).toMatch(/nome completo/i);
  });

  it('aponta os erros na ordem da tela: nome, data, gênero, escola', () => {
    const base = { ...vazio, nome: 'Ana Souza' };
    expect(etapa1Erro(base)).toMatch(/DD\/MM\/AAAA/);
    const comData = { ...base, dataNascimento: '14/03/2010' };
    expect(etapa1Erro(comData)).toBe(ERRO_GENERO);
    expect(etapa1Erro({ ...comData, genero: 'FEMININO' })).toBe(ERRO_ESCOLA);
  });

  it('rejeita data inexistente e data no futuro', () => {
    expect(etapa1Valida({ ...completo, dataNascimento: '31/02/2010' })).toBe(false);
    expect(etapa1Valida({ ...completo, dataNascimento: '01/01/2999' })).toBe(false);
  });

  it('é válida sem e-mail, senha e termos (são da etapa 2)', () => {
    expect(etapa1Valida({ ...completo, email: '', password: '', aceitouTermos: false })).toBe(true);
  });

  it('aceita todas as opções de gênero e de escola da tela', () => {
    for (const g of GENERO_OPTIONS) {
      expect(etapa1Valida({ ...completo, genero: g.value })).toBe(true);
    }
    for (const e of TIPO_ESCOLA_OPTIONS) {
      expect(etapa1Valida({ ...completo, tipoEscola: e.value })).toBe(true);
    }
  });
});

describe('etapa 2', () => {
  it('com tudo vazio não é válida e começa pelo e-mail', () => {
    expect(etapa2Valida(vazio)).toBe(false);
    expect(etapa2Erro(vazio)).toMatch(/e-mail/i);
  });

  it('exige senha de pelo menos 8 caracteres', () => {
    expect(etapa2Erro({ ...completo, password: '1234567' })).toMatch(/8 caracteres/);
    expect(etapa2Valida({ ...completo, password: '12345678' })).toBe(true);
  });

  it('exige o aceite dos termos', () => {
    expect(etapa2Erro({ ...completo, aceitouTermos: false })).toBe(ERRO_TERMOS);
  });

  it('é válida sem os dados da etapa 1 (são validados na etapa 1)', () => {
    expect(etapa2Valida({ ...completo, nome: '', genero: null, tipoEscola: null })).toBe(true);
  });
});

describe('opções (decisão 3.2)', () => {
  it('gênero tem só Feminino, Masculino e Prefiro não informar', () => {
    expect(GENERO_OPTIONS.map((o) => o.label)).toEqual(['Feminino', 'Masculino', 'Prefiro não informar']);
    expect(GENERO_OPTIONS.map((o) => o.value)).not.toContain('OUTRO');
  });

  it('mantém os valores atuais de escola (pública/privada/filantrópica)', () => {
    expect(TIPO_ESCOLA_OPTIONS.map((o) => o.value)).toEqual(['PUBLICA', 'PRIVADA', 'FILANTROPICA']);
  });
});

describe('temDadosPreenchidos', () => {
  it('é false com o formulário vazio ou só com espaços', () => {
    expect(temDadosPreenchidos(vazio)).toBe(false);
    expect(temDadosPreenchidos({ ...vazio, nome: '   ', email: '  ' })).toBe(false);
  });

  it.each([
    ['nome', { nome: 'A' }],
    ['data', { dataNascimento: '1' }],
    ['gênero', { genero: 'FEMININO' }],
    ['escola', { tipoEscola: 'PUBLICA' }],
    ['e-mail', { email: 'a' }],
    ['senha', { password: 'x' }],
    ['termos', { aceitouTermos: true }],
  ])('é true quando só %s foi preenchido', (_campo, parcial) => {
    expect(temDadosPreenchidos({ ...vazio, ...parcial })).toBe(true);
  });
});

describe('primeiroNome e progresso', () => {
  it('pega o primeiro nome', () => {
    expect(primeiroNome('  Ana Souza ')).toBe('Ana');
    expect(primeiroNome('Ana')).toBe('Ana');
    expect(primeiroNome('')).toBe('');
  });

  it('barra: etapa 1 = 50% e etapa 2 = 100%', () => {
    expect(progressoDaEtapa(1)).toBe(0.5);
    expect(progressoDaEtapa(2)).toBe(1);
    expect(progressoDaEtapa(5)).toBe(1);
  });
});
