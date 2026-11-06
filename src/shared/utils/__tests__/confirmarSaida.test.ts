import { mensagemSairDaConta } from '../confirmarSaida';

describe('mensagemSairDaConta', () => {
  it('mensagem simples quando não há registros pendentes', () => {
    expect(mensagemSairDaConta(0)).toContain('entrar de novo');
  });
  it('avisa 1 registro no singular', () => {
    const m = mensagemSairDaConta(1);
    expect(m).toContain('1 registro ainda não foi enviado');
    expect(m).toContain('ele será perdido');
  });
  it('avisa vários registros no plural', () => {
    const m = mensagemSairDaConta(3);
    expect(m).toContain('3 registros ainda não foram enviados');
    expect(m).toContain('eles serão perdidos');
  });
});
