import { limparProps, sessaoExpirou } from '../analytics';

jest.mock('../../../lib/supabase', () => ({ supabase: {} }));

describe('analytics', () => {
  it('sessão expira após 30 min sem atividade', () => {
    expect(sessaoExpirou(0, 29 * 60 * 1000)).toBe(false);
    expect(sessaoExpirou(0, 31 * 60 * 1000)).toBe(true);
  });
  it('limpa props: corta texto longo e descarta objetos', () => {
    const r = limparProps({ a: 'x'.repeat(200), b: 3, c: true, d: { x: 1 } as any });
    expect((r.a as string).length).toBe(80);
    expect(r.b).toBe(3);
    expect(r.c).toBe(true);
    expect('d' in r).toBe(false);
  });
});
