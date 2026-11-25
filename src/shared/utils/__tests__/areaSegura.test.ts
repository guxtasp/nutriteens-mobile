// src/shared/utils/__tests__/areaSegura.test.ts
import { respiroInferior } from '../areaSegura';

describe('respiroInferior', () => {
  it('sem barra do sistema mantém o respiro original da peça', () => {
    expect(respiroInferior(0, 32)).toBe(32);
  });
  it('Android com 3 botões (≈48) passa por cima da barra com folga', () => {
    expect(respiroInferior(48, 32)).toBe(64);
  });
  it('barra de gestos e home indicator do iPhone', () => {
    expect(respiroInferior(24, 32)).toBe(40);
    expect(respiroInferior(34, 24)).toBe(50);
  });
  it('valor estranho de inset vira 0', () => {
    expect(respiroInferior(Number.NaN, 20)).toBe(20);
    expect(respiroInferior(-5, 20)).toBe(20);
  });
});

describe('respiroSuperior', () => {
  it('mantém o respiro original com barra de status comum e soma o notch quando ele é maior', () => {
    const { respiroSuperior } = require('../areaSegura');
    expect(respiroSuperior(24, 72)).toBe(72);
    expect(respiroSuperior(59, 40)).toBe(75);
    expect(respiroSuperior(0, 40)).toBe(40);
  });
});
