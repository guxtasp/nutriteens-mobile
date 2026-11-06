import { decidirAcaoSessao, deveIgnorarEventoDeAuth } from '../decisaoSessao';

describe('decidirAcaoSessao', () => {
  it('perfil carregado entra no app', () => {
    expect(decidirAcaoSessao('logado', false)).toBe('entrar');
    expect(decidirAcaoSessao('logado', true)).toBe('entrar');
  });

  it('sessão órfã / cadastro em andamento sai (comportamento que já existia)', () => {
    expect(decidirAcaoSessao('deslogado', false)).toBe('sair');
    expect(decidirAcaoSessao('deslogado', true)).toBe('sair');
  });

  it('REGRESSÃO #1: rede caiu com o usuário dentro do app NÃO desloga', () => {
    // antes: carregarPerfil devolvia false -> setIsLoggedIn(false) -> tela de login
    expect(decidirAcaoSessao('indisponivel', true)).toBe('manter');
  });

  it('abertura do app sem rede e sem cópia local espera a conexão (não vai para o login)', () => {
    expect(decidirAcaoSessao('indisponivel', false)).toBe('aguardar_conexao');
  });
});

describe('deveIgnorarEventoDeAuth', () => {
  it('ignora só INITIAL_SESSION (o getSession da abertura já cobre)', () => {
    expect(deveIgnorarEventoDeAuth('INITIAL_SESSION')).toBe(true);
  });

  it('NÃO ignora TOKEN_REFRESHED: refreshSession() é como useSignup e a triagem avisam que a etapa mudou', () => {
    expect(deveIgnorarEventoDeAuth('TOKEN_REFRESHED')).toBe(false);
  });

  it('não ignora login, logout nem atualização de usuário', () => {
    for (const e of ['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'PASSWORD_RECOVERY']) {
      expect(deveIgnorarEventoDeAuth(e)).toBe(false);
    }
  });
});