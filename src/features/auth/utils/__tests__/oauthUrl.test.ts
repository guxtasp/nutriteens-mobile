import { extrairParamsOAuth } from '../oauthUrl';

describe('extrairParamsOAuth', () => {
  it('lê tokens que vêm depois do # (retorno do Google no app nativo)', () => {
    const r = extrairParamsOAuth('nutriteens://auth/callback#access_token=AAA&refresh_token=BBB&token_type=bearer');
    expect(r.access_token).toBe('AAA');
    expect(r.refresh_token).toBe('BBB');
    expect(r.erro).toBeNull();
  });

  it('lê o type=recovery do link de redefinição de senha', () => {
    const r = extrairParamsOAuth('https://app.test/#access_token=A&refresh_token=B&type=recovery');
    expect(r.type).toBe('recovery');
  });

  it('lê tokens na query string como alternativa', () => {
    const r = extrairParamsOAuth('nutriteens://auth/callback?access_token=A&refresh_token=B');
    expect(r.access_token).toBe('A');
    expect(r.refresh_token).toBe('B');
  });

  it('captura erro do provedor (usuário negou acesso)', () => {
    const r = extrairParamsOAuth('nutriteens://auth/callback#error=access_denied&error_description=User+denied');
    expect(r.access_token).toBeNull();
    expect(r.erro).toBe('User denied');
  });

  it('devolve tudo nulo quando não há parâmetros', () => {
    expect(extrairParamsOAuth('nutriteens://auth/callback')).toEqual({
      access_token: null, refresh_token: null, type: null, erro: null,
    });
  });
});
