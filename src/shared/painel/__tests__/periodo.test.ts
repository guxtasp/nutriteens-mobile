import { mascaraDataBR, parseDataBR, ultimosDias, validarIntervalo } from '../periodo';

describe('periodo', () => {
  const hoje = new Date(2026, 9, 6);
  it('últimos 7 dias inclui hoje', () => {
    expect(ultimosDias(7, hoje)).toEqual({ inicio: '2026-09-30', fim: '2026-10-06' });
  });
  it('parse e máscara', () => {
    expect(parseDataBR('05/10/2026')).toBe('2026-10-05');
    expect(parseDataBR('31/02/2026')).toBeNull();
    expect(mascaraDataBR('05102026')).toBe('05/10/2026');
  });
  it('valida intervalo', () => {
    expect(validarIntervalo('2026-10-01', '2026-10-05', hoje)).toBeNull();
    expect(validarIntervalo('2026-10-05', '2026-10-01', hoje)).not.toBeNull();
    expect(validarIntervalo('2026-10-01', '2026-10-09', hoje)).not.toBeNull();
    expect(validarIntervalo('2025-01-01', '2026-10-05', hoje)).not.toBeNull();
  });
});
