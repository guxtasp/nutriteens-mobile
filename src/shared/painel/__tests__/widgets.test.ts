import {
  conclusaoPorTrilha,
  formatarVariacao,
  indiceDiaSemana,
  mediaPorDiaSemana,
  saudacao,
  somar,
  taxaPercentual,
  tendenciaPct,
} from '../utils/widgets';

describe('widgets do dashboard', () => {
  it('somar ignora valores inválidos', () => {
    expect(somar([1, 2, NaN, 3])).toBe(6);
    expect(somar([])).toBe(0);
  });

  it('tendência compara a segunda metade com a primeira', () => {
    expect(tendenciaPct([10, 10, 20, 20])).toBe(100);
    expect(tendenciaPct([20, 20, 10, 10])).toBe(-50);
    expect(tendenciaPct([5, 5, 5, 5])).toBe(0);
    // série ímpar: o dia do meio não entra em nenhuma metade
    expect(tendenciaPct([10, 10, 99, 20, 20])).toBe(100);
  });

  it('tendência é null com poucos dias ou base zero', () => {
    expect(tendenciaPct([1, 2, 3])).toBeNull();
    expect(tendenciaPct([0, 0, 5, 5])).toBeNull();
    expect(tendenciaPct([0, 0, 0, 0])).toBe(0);
  });

  it('formata variação com sinal e vírgula decimal', () => {
    expect(formatarVariacao(12)).toBe('+12%');
    expect(formatarVariacao(-8.5)).toBe('−8,5%');
    expect(formatarVariacao(0)).toBe('0%');
  });

  it('dia da semana começa na segunda', () => {
    expect(indiceDiaSemana('2026-10-26')).toBe(0); // segunda
    expect(indiceDiaSemana('2026-10-29')).toBe(3); // quinta
    expect(indiceDiaSemana('2026-11-01')).toBe(6); // domingo
    expect(indiceDiaSemana('lixo')).toBeNull();
  });

  it('média por dia da semana', () => {
    const dias = ['2026-10-26', '2026-10-27', '2026-11-02']; // seg, ter, seg
    expect(mediaPorDiaSemana(dias, [10, 4, 20])).toEqual([15, 4, 0, 0, 0, 0, 0]);
  });

  it('taxa percentual', () => {
    expect(taxaPercentual(3, 4)).toBe(75);
    expect(taxaPercentual(5, 0)).toBeNull();
    expect(taxaPercentual(9, 3)).toBe(100);
  });

  it('saudação por hora', () => {
    expect(saudacao(8)).toBe('Bom dia');
    expect(saudacao(14)).toBe('Boa tarde');
    expect(saudacao(21)).toBe('Boa noite');
    expect(saudacao(2)).toBe('Boa noite');
  });

  it('conclusão por trilha ordena por iniciadas', () => {
    const r = conclusaoPorTrilha([
      { titulo: 'B', iniciadas: 2, concluidas: 1 },
      { titulo: 'A', iniciadas: 10, concluidas: 5 },
      { titulo: 'C', iniciadas: 0, concluidas: 0 },
    ]);
    expect(r.map((t) => t.titulo)).toEqual(['A', 'B', 'C']);
    expect(r.map((t) => t.pct)).toEqual([50, 50, null]);
  });
});
