import { filtrarAlimentosPorBusca, normalizarBusca } from '../buscaAlimentos';

const lista = [{ nome: 'Arroz integral' }, { nome: 'Arroz branco' }, { nome: 'Feijão' }, { nome: 'Maçã' }, { nome: 'Pão francês' }];

describe('filtrarAlimentosPorBusca', () => {
  it('busca vazia ou só espaços devolve tudo', () => {
    expect(filtrarAlimentosPorBusca(lista, '')).toBe(lista);
    expect(filtrarAlimentosPorBusca(lista, '   ')).toBe(lista);
  });

  it('ignora acento e maiúsculas, nos dois lados', () => {
    expect(filtrarAlimentosPorBusca(lista, 'feijao').map((a) => a.nome)).toEqual(['Feijão']);
    expect(filtrarAlimentosPorBusca(lista, 'MAÇA').map((a) => a.nome)).toEqual(['Maçã']);
    expect(filtrarAlimentosPorBusca(lista, 'pao frances').map((a) => a.nome)).toEqual(['Pão francês']);
  });

  it('todas as palavras precisam aparecer, em qualquer ordem', () => {
    expect(filtrarAlimentosPorBusca(lista, 'arroz int').map((a) => a.nome)).toEqual(['Arroz integral']);
    expect(filtrarAlimentosPorBusca(lista, 'integral arroz').map((a) => a.nome)).toEqual(['Arroz integral']);
  });

  it('trecho no meio da palavra também encontra', () => {
    expect(filtrarAlimentosPorBusca(lista, 'rroz').length).toBe(2);
  });

  it('sem resultado devolve lista vazia', () => {
    expect(filtrarAlimentosPorBusca(lista, 'pizza')).toEqual([]);
  });
});

describe('normalizarBusca', () => {
  it('remove acentos e baixa a caixa', () => {
    expect(normalizarBusca('  Açaí ')).toBe('acai');
  });
});
