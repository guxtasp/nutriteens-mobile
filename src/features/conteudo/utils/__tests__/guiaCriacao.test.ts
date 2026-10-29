import { PASSOS_GUIA, passoValido } from '../guiaCriacao';

describe('guiaCriacao', () => {
  it('todo passo tem título, resumo, ações, dica e ids únicos', () => {
    expect(PASSOS_GUIA.length).toBeGreaterThanOrEqual(5);
    expect(new Set(PASSOS_GUIA.map((p) => p.id)).size).toBe(PASSOS_GUIA.length);
    for (const p of PASSOS_GUIA) {
      expect(p.titulo.length).toBeGreaterThan(0);
      expect(p.resumo.length).toBeGreaterThan(0);
      expect(p.faca.length).toBeGreaterThan(0);
      expect(p.dica.length).toBeGreaterThan(0);
    }
  });
  it('cada ilustração é usada uma vez (o desenho acompanha o passo)', () => {
    expect(new Set(PASSOS_GUIA.map((p) => p.ilustracao)).size).toBe(PASSOS_GUIA.length);
  });
  it('passoValido limita ao intervalo e aceita lixo', () => {
    expect(passoValido(0)).toBe(0);
    expect(passoValido(3)).toBe(3);
    expect(passoValido(99)).toBe(PASSOS_GUIA.length - 1);
    expect(passoValido(-4)).toBe(0);
    expect(passoValido(2.9)).toBe(2);
    expect(passoValido('x')).toBe(0);
    expect(passoValido(undefined)).toBe(0);
    expect(passoValido(NaN)).toBe(0);
  });
});
