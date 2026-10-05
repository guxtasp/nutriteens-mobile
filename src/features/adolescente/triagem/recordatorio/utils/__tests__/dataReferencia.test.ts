import { ontemLocalISO } from '../dataReferencia';

describe('ontemLocalISO', () => {
  it('devolve o dia anterior', () => {
    expect(ontemLocalISO(new Date(2026, 9, 4, 10, 0))).toBe('2026-10-03');
  });
  it('à noite (depois das 21h) continua sendo o dia anterior ao dia LOCAL, não ao UTC', () => {
    expect(ontemLocalISO(new Date(2026, 9, 4, 23, 30))).toBe('2026-10-03');
  });
  it('vira o mês e o ano corretamente', () => {
    expect(ontemLocalISO(new Date(2026, 2, 1, 8, 0))).toBe('2026-02-28');
    expect(ontemLocalISO(new Date(2027, 0, 1, 8, 0))).toBe('2026-12-31');
  });
});
