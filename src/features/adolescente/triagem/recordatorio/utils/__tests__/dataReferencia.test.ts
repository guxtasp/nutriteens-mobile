import { ontemLocalISO, rotuloOntem } from '../dataReferencia';

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

describe('rotuloOntem', () => {
  it('escreve o dia da semana e a data de ontem', () => {
    // 9/nov/2026 é segunda-feira → ontem foi domingo, 8
    expect(rotuloOntem(new Date(2026, 10, 9, 10, 0))).toBe('domingo, 8 de novembro');
  });
  it('vira o mês e o ano', () => {
    expect(rotuloOntem(new Date(2027, 0, 1, 8, 0))).toBe('quinta-feira, 31 de dezembro');
  });
  it('bate com a data gravada (ontemLocalISO)', () => {
    const agora = new Date(2026, 2, 1, 23, 50);
    expect(ontemLocalISO(agora)).toBe('2026-02-28');
    expect(rotuloOntem(agora)).toContain('28 de fevereiro');
  });
});
