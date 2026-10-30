import { acessoProfissionalDisponivel } from '../acessoProfissional';

describe('acessoProfissionalDisponivel', () => {
  it('aparece no computador (web em janela larga)', () => {
    expect(acessoProfissionalDisponivel('web', 1280)).toBe(true);
    expect(acessoProfissionalDisponivel('web', 900)).toBe(true);
  });

  it('não aparece no navegador do celular (web em tela estreita)', () => {
    expect(acessoProfissionalDisponivel('web', 390)).toBe(false);
    expect(acessoProfissionalDisponivel('web', 899)).toBe(false);
  });

  it('não aparece no app de celular, mesmo em tablet largo', () => {
    expect(acessoProfissionalDisponivel('android', 1200)).toBe(false);
    expect(acessoProfissionalDisponivel('ios', 1024)).toBe(false);
  });
});
