import { dataInicioJanela } from '../janelaHabito';

describe('dataInicioJanela', () => {
  it('janela de 24h começa hoje, mesmo à noite (sem virar o dia por causa do UTC)', () => {
    // 22h30 locais: em UTC-3 isso já é o dia seguinte em UTC
    expect(dataInicioJanela(24, new Date(2026, 9, 5, 22, 30))).toBe('2026-10-05');
  });

  it('janela de 24h logo após a meia-noite continua sendo hoje', () => {
    expect(dataInicioJanela(24, new Date(2026, 9, 5, 0, 10))).toBe('2026-10-05');
  });

  it('janelas maiores recuam dias inteiros (48h = hoje e ontem)', () => {
    expect(dataInicioJanela(48, new Date(2026, 9, 5, 22, 30))).toBe('2026-10-04');
    expect(dataInicioJanela(72, new Date(2026, 9, 5, 10, 0))).toBe('2026-10-03');
  });

  it('atravessa virada de mês e de ano', () => {
    expect(dataInicioJanela(48, new Date(2026, 9, 1, 12, 0))).toBe('2026-09-30');
    expect(dataInicioJanela(48, new Date(2027, 0, 1, 12, 0))).toBe('2026-12-31');
  });

  it('janela menor que 24h ou inválida conta pelo menos o dia de hoje', () => {
    expect(dataInicioJanela(6, new Date(2026, 9, 5, 22, 30))).toBe('2026-10-05');
    expect(dataInicioJanela(0, new Date(2026, 9, 5, 22, 30))).toBe('2026-10-05');
  });
});
