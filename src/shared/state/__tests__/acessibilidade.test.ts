import { interpretarPreferencias, PREFERENCIAS_PADRAO } from '../acessibilidade';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(undefined) },
}));

describe('interpretarPreferencias', () => {
  it('sem nada salvo usa o padrão (animações normais, vibração ligada)', () => {
    expect(interpretarPreferencias(null)).toEqual(PREFERENCIAS_PADRAO);
  });
  it('lê os valores salvos', () => {
    expect(interpretarPreferencias(JSON.stringify({ reduzirAnimacoes: true, vibracao: false }))).toEqual({
      reduzirAnimacoes: true,
      vibracao: false,
    });
  });
  it('valor corrompido volta ao padrão', () => {
    expect(interpretarPreferencias('{quebrado')).toEqual(PREFERENCIAS_PADRAO);
  });
  it('campo ausente mantém o padrão daquele campo', () => {
    expect(interpretarPreferencias('{"reduzirAnimacoes":true}')).toEqual({ reduzirAnimacoes: true, vibracao: true });
  });
});
