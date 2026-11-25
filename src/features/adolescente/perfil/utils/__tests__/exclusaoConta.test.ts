// src/features/adolescente/perfil/utils/__tests__/exclusaoConta.test.ts
import { chavesLocaisDaConta, classificarErroExclusao } from '../exclusaoConta';
import { ITENS_APAGADOS, PRONTO_TEXTO, FALA_APAGAR, ERRO_GENERICO } from '../../data/textosExclusao';

describe('classificarErroExclusao', () => {
  it('falha de envio da Edge Function conta como sem internet', () => {
    const e = Object.assign(new Error('Failed to send a request to the Edge Function'), { name: 'FunctionsFetchError' });
    expect(classificarErroExclusao(e)).toBe('rede');
  });
  it('olha a causa guardada em context', () => {
    expect(classificarErroExclusao({ name: 'Outro', message: 'x', context: new Error('Network request failed') })).toBe('rede');
  });
  it('erro do servidor (HTTP) não é de rede', () => {
    const e = Object.assign(new Error('Edge Function returned a non-2xx status code'), { name: 'FunctionsHttpError', context: {} });
    expect(classificarErroExclusao(e)).toBe('outro');
    expect(classificarErroExclusao(null)).toBe('outro');
  });
});

describe('chavesLocaisDaConta', () => {
  const uid = '8f0c1a2b-1111-2222-3333-444455556666';
  const chaves = [
    `nt:offline:fila:${uid}`,
    `lembrete:${uid}:config`,
    'nt:cache:perfil:outra-coisa',
    'nt:som:mudo',
    'sb-projeto-auth-token',
    'nt:offline:fila:outro-usuario',
  ];
  it('pega o que leva o id e o cache; deixa preferências, sessão e outras contas', () => {
    expect(chavesLocaisDaConta(chaves, uid)).toEqual([
      `nt:offline:fila:${uid}`,
      `lembrete:${uid}:config`,
      'nt:cache:perfil:outra-coisa',
    ]);
  });
  it('sem id não apaga nada', () => {
    expect(chavesLocaisDaConta(chaves, '')).toEqual([]);
  });
});

describe('textos da exclusão', () => {
  it('lista os 4 grupos e não julga', () => {
    expect(ITENS_APAGADOS).toHaveLength(4);
    const tudo = [FALA_APAGAR, PRONTO_TEXTO, ERRO_GENERICO, ...ITENS_APAGADOS.map((i) => i.titulo)].join(' ').toLowerCase();
    expect(tudo).not.toMatch(/errad|culpa|pena|tem certeza/);
  });
});
