import { criarJanelas, dentro, formatarDiaMes, listarDias, rotuloDiaSemana, somarDias } from '../periodos';

describe('periodos', () => {
  it('somarDias atravessa mês, ano e bissexto', () => {
    expect(somarDias('2026-10-31', 1)).toBe('2026-11-01');
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31');
    expect(somarDias('2024-02-28', 1)).toBe('2024-02-29');
  });
  it('janela de semana: 7 dias terminando hoje, anterior colada e do mesmo tamanho', () => {
    const { atual, anterior } = criarJanelas('semana', '2026-10-15');
    expect(atual).toEqual({ inicio: '2026-10-09', fim: '2026-10-15', dias: 7 });
    expect(anterior).toEqual({ inicio: '2026-10-02', fim: '2026-10-08', dias: 7 });
  });
  it('janela de mês: 28 dias', () => {
    const { atual, anterior } = criarJanelas('mes', '2026-10-15');
    expect(listarDias(atual)).toHaveLength(28);
    expect(somarDias(anterior.fim, 1)).toBe(atual.inicio);
  });
  it('dentro é inclusivo nas pontas', () => {
    const { atual } = criarJanelas('semana', '2026-10-15');
    expect(dentro('2026-10-09', atual)).toBe(true);
    expect(dentro('2026-10-15', atual)).toBe(true);
    expect(dentro('2026-10-08', atual)).toBe(false);
  });
  it('rejeita data inválida', () => {
    let erro = false;
    try { somarDias('15/10/2026', 1); } catch { erro = true; }
    expect(erro).toBe(true);
  });
  it('formatadores', () => {
    expect(formatarDiaMes('2026-10-05')).toBe('05/10');
    expect(rotuloDiaSemana('2026-10-15')).toBe('Qui');
  });
});
