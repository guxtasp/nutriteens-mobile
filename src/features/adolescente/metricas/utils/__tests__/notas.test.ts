import { calcularMetricas } from '../calcularMetricas';
import { notaMissoes } from '../notas';
import { dadosCompletos, dadosVazios, HOJE } from './fixtures';

const nota = (d = dadosCompletos()) => notaMissoes(calcularMetricas(d, 'semana'));

describe('notaMissoes', () => {
  it('missão de dia anterior sem pontos: avisa que pode não ter sido registrada', () => {
    const n = nota(dadosVazios({ missoesDiarias: [{ data: '2026-10-12', concluida: false }] }));
    expect(n).toContain('no mesmo dia');
  });

  it('missão de hoje ainda pendente não dispara a nota (ainda dá tempo de cumprir)', () => {
    expect(nota(dadosVazios({ missoesDiarias: [{ data: HOJE, concluida: false }] }))).toBeNull();
  });

  it('todas concluídas, ou nenhuma atribuída: sem nota', () => {
    expect(nota(dadosVazios({ missoesDiarias: [{ data: '2026-10-12', concluida: true }] }))).toBeNull();
    expect(nota(dadosVazios())).toBeNull();
  });

  it('missão sem registro fora da janela não conta para o período', () => {
    expect(nota(dadosVazios({ missoesDiarias: [{ data: '2026-09-01', concluida: false }] }))).toBeNull();
  });

  it('o contador separa dias anteriores de hoje', () => {
    const e = calcularMetricas(dadosVazios({ missoesDiarias: [
      { data: '2026-10-12', concluida: false }, { data: HOJE, concluida: false }, { data: '2026-10-13', concluida: true },
    ] }), 'semana').atual.engajamento;
    expect(e.missoes).toEqual({ atribuidas: 3, concluidas: 1 });
    expect(e.missoesSemRegistroAntesDeHoje).toBe(1);
  });
});
