import { calcularMetricas } from '../calcularMetricas';
import { montarResumoHome } from '../resumoHome';
import { dadosCompletos, dadosVazios } from './fixtures';

const resumo = (d = dadosCompletos()) => montarResumoHome(calcularMetricas(d, 'semana'), 'u1');

describe('montarResumoHome', () => {
  it('com dados: 7 dias marcados conforme os registros reais', () => {
    const r = resumo();
    expect(r.semDados).toBe(false);
    expect(r.total).toBe(7);
    expect(r.dias).toHaveLength(7);
    expect(r.dias.filter((d) => d.marcado).length).toBe(r.diasAtivos);
    expect(r.dias[0].data).toBe('2026-10-09');
    expect(r.dias[6].data).toBe('2026-10-15');
  });

  it('o texto é o do resumo da tela (mesmo motor de mensagens)', () => {
    expect(resumo().texto.length).toBeGreaterThan(0);
    expect(resumo().texto).toBe(resumo().texto);
  });

  it('sem registros: semDados, nenhum dia marcado e o texto não cita números', () => {
    const r = resumo(dadosVazios());
    expect(r.semDados).toBe(true);
    expect(r.diasAtivos).toBe(0);
    expect(r.dias.some((d) => d.marcado)).toBe(false);
    expect(/\d/.test(r.texto)).toBe(false);
  });

  it('não usa linguagem de cobrança nem de juízo', () => {
    for (const d of [dadosCompletos(), dadosVazios(), dadosVazios({ agua: [{ data: '2026-10-14', ml: 300 }] })]) {
      expect(resumo(d).texto).not.toMatch(/\b(bom|ruim|falhou|culpa|ranking|perdeu|caloria|peso)\b/i);
    }
  });
});
