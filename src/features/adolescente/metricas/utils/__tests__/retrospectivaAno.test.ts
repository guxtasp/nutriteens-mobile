import { janelaDoAno } from '../retrospectivaAno';

describe('janelaDoAno', () => {
  it('conta do mesmo dia do ano passado até hoje', () => {
    expect(janelaDoAno('2026-10-27', '2024-01-10')).toEqual({ inicio: '2025-10-27', fim: '2026-10-27', anoCompleto: true });
  });

  it('conta nova: começa na criação e não é "ano completo"', () => {
    expect(janelaDoAno('2026-10-27', '2026-07-27')).toEqual({ inicio: '2026-07-27', fim: '2026-10-27', anoCompleto: false });
  });

  it('sem data de criação usa o ano inteiro', () => {
    expect(janelaDoAno('2026-10-27')?.inicio).toBe('2025-10-27');
    expect(janelaDoAno('2026-10-27', null)?.inicio).toBe('2025-10-27');
  });

  it('aceita timestamp na criação usando só a parte da data', () => {
    expect(janelaDoAno('2026-10-27', '2026-09-01T03:20:00+00:00')?.inicio).toBe('2026-09-01');
  });

  it('29/02: o ano anterior não bissexto começa em 28/02', () => {
    expect(janelaDoAno('2028-02-29', '2020-01-01')?.inicio).toBe('2027-02-28');
  });

  it('data inválida ou criação no futuro → null', () => {
    expect(janelaDoAno('abc')).toBeNull();
    expect(janelaDoAno('2026-10-27', '2026-12-01')).toBeNull();
  });

  it('criada há menos de um ano mas quase: ainda é "jornada até aqui"', () => {
    expect(janelaDoAno('2026-10-27', '2025-11-10')?.anoCompleto).toBe(false);
  });
});
