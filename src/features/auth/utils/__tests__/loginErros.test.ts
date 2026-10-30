import {
  mensagemErroLogin,
  validarCredenciais,
  MENSAGEM_FALHA_CONEXAO,
  MENSAGEM_LOGIN_INVALIDO,
} from '../loginErros';

describe('mensagemErroLogin', () => {
  it('usa a mesma mensagem para senha errada e conta inexistente', () => {
    expect(mensagemErroLogin({ name: 'AuthApiError', status: 400 })).toBe(MENSAGEM_LOGIN_INVALIDO);
    expect(mensagemErroLogin({})).toBe(MENSAGEM_LOGIN_INVALIDO);
  });

  it('avisa de falha de conexão e de erro do servidor', () => {
    expect(mensagemErroLogin({ name: 'AuthRetryableFetchError' })).toBe(MENSAGEM_FALHA_CONEXAO);
    expect(mensagemErroLogin({ status: 0 })).toBe(MENSAGEM_FALHA_CONEXAO);
    expect(mensagemErroLogin({ status: 503 })).toBe(MENSAGEM_FALHA_CONEXAO);
  });
});

describe('validarCredenciais', () => {
  it('aceita e-mail e senha preenchidos', () => {
    expect(validarCredenciais('ana@ufv.br', 'qualquer')).toEqual({});
  });

  it('ignora espaços nas pontas do e-mail (teclados de celular costumam deixar um)', () => {
    expect(validarCredenciais('  ana@ufv.br ', 'x')).toEqual({});
  });

  it('pede e-mail e senha quando estão vazios', () => {
    expect(validarCredenciais('', '')).toEqual({ email: 'Digite seu e-mail', senha: 'Digite sua senha' });
    expect(validarCredenciais('   ', 'x').email).toBe('Digite seu e-mail');
  });

  it('recusa e-mail em formato inválido', () => {
    expect(validarCredenciais('ana@', 'x').email).toBe('Digite um e-mail em um formato válido');
  });

  it('não exige tamanho mínimo de senha no login', () => {
    expect(validarCredenciais('ana@ufv.br', '123')).toEqual({});
  });
});
