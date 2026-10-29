import { calcularMetricas } from '../calcularMetricas';
import { calcularMisturaNova } from '../misturaNova';
import { montarResumoHome } from '../resumoHome';
import { dadosCompletos, dadosVazios } from './fixtures';

const resumo = (d = dadosCompletos()) => {
  const m = calcularMetricas(d, 'semana');
  return montarResumoHome(m, 'u1', calcularMisturaNova(d, m.atual.janela));
};

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

  it('mini rastreador: 7 dias, hoje é o último, e os hábitos batem com as métricas', () => {
    const d = dadosCompletos();
    const m = calcularMetricas(d, 'semana');
    const r = resumo(d);
    expect(r.semana).toHaveLength(7);
    expect(r.semana.map((x) => x.hoje)).toEqual([false, false, false, false, false, false, true]);
    expect(r.semana[0].data).toBe('2026-10-09');
    expect(r.diasComida).toBe(m.atual.habitos.diasComRefeicao);
    expect(r.diasAgua).toBe(m.atual.habitos.agua.diasComRegistro);
    expect(r.diasMovimento).toBe(m.atual.habitos.atividade.diasAtivos);
    expect(r.conquistasNoPeriodo).toBe(m.atual.evolucao.conquistasNoPeriodo);
  });

  it('sem registros: rastreador todo vazio, contadores zerados e termômetro em sem_dados', () => {
    const r = resumo(dadosVazios());
    expect(r.semana.some((x) => x.comida || x.agua || x.movimento)).toBe(false);
    expect([r.diasComida, r.diasAgua, r.diasMovimento]).toEqual([0, 0, 0]);
    expect(r.mistura.estado).toBe('sem_dados');
  });
});
