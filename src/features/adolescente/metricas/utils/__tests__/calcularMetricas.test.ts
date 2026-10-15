import { calcularMetricas } from '../calcularMetricas';
import { dadosCompletos, dadosVazios } from './fixtures';

describe('hábitos', () => {
  const m = calcularMetricas(dadosCompletos(), 'semana');
  const h = m.atual.habitos;
  it('conta só o período atual', () => {
    expect(h.diasComRefeicao).toBe(3);
    expect(h.refeicoes).toBe(4);
    expect(h.refeicoesPorTipo).toEqual({ CAFE_DA_MANHA: 1, ALMOCO: 2, LANCHE_TARDE: 1 });
  });
  it('diversidade e grupos', () => {
    expect(h.alimentosDistintos).toBe(5);
    expect(h.grupos.map((g) => g.grupo)).toEqual(['CEREAIS', 'FRUTAS', 'LEGUMINOSAS', 'VERDURAS']);
    expect(h.grupos[0].dias).toBe(2);
  });
  it('alimentos novos: só os cuja primeira aparição está no período, com histórico anterior', () => {
    expect(h.alimentosNovos).toEqual(['Banana', 'Couve']);
  });
  it('sem histórico anterior, "novo" é indeterminado (null)', () => {
    const d = dadosCompletos();
    d.primeiraAparicaoAlimentos = d.primeiraAparicaoAlimentos.filter((p) => p.data >= '2026-10-09');
    expect(calcularMetricas(d, 'semana').atual.habitos.alimentosNovos).toBeNull();
  });
  it('água soma por dia e compara com a meta', () => {
    expect(h.agua.diasComRegistro).toBe(2);
    expect(h.agua.diasComMeta).toBe(1);
    expect(h.agua.mediaMlPorDiaRegistrado).toBe(1300);
  });
  it('sem meta calculável, não inventa meta', () => {
    const d = dadosCompletos();
    d.metaAguaMl = null;
    const r = calcularMetricas(d, 'semana');
    expect(r.atual.habitos.agua.diasComMeta).toBeNull();
    expect(r.comparacoes.diasComMetaAgua.direcao).toBe('sem_base');
    expect(r.atual.habitos.porDia[0].aguaMeta).toBeNull();
  });
  it('atividade: tipos normalizados', () => {
    expect(h.atividade).toEqual({ diasAtivos: 2, minutos: 95, tiposDistintos: 2 });
  });
  it('porDia tem um item por dia da janela', () => {
    expect(h.porDia).toHaveLength(7);
    expect(h.porDia[0]).toEqual({ data: '2026-10-09', refeicoes: 2, aguaMeta: true, aguaRegistrada: true, atividade: false });
  });
});

describe('engajamento', () => {
  const e = calcularMetricas(dadosCompletos(), 'semana').atual.engajamento;
  it('separa atribuídas de concluídas', () => {
    expect(e.missoes).toEqual({ atribuidas: 2, concluidas: 1 });
  });
  it('lições, XP e trilhas', () => {
    expect(e.licoes).toBe(2);
    expect(e.xpNoPeriodo).toBe(35);
    expect(e.xpPorOrigem).toEqual({ licao: 20, missao_diaria: 15 });
    expect(e.trilhas.emAndamento).toHaveLength(1);
    expect(e.trilhas.finalizadas).toBe(0);
  });
  it('missão atribuída sozinha não torna o dia ativo', () => {
    const d = dadosVazios({ missoesDiarias: [{ data: '2026-10-15', concluida: false }] });
    const r = calcularMetricas(d, 'semana');
    expect(r.atual.diasAtivos).toBe(0);
    expect(r.atual.nivelDados).toBe('nenhum');
  });
  it('trilha finalizada = todas as lições concluídas', () => {
    const d = dadosVazios({ trilhas: [{ trilhaId: 't', titulo: 'T', totalLicoes: 4, licoesConcluidas: 4 }] });
    expect(calcularMetricas(d, 'semana').atual.engajamento.trilhas.finalizadas).toBe(1);
  });
});

describe('evolução e comparações', () => {
  const m = calcularMetricas(dadosCompletos(), 'semana');
  it('conquistas recentes ordenadas e contagem no período', () => {
    expect(m.atual.evolucao.conquistasNoPeriodo).toBe(1);
    expect(m.atual.evolucao.conquistasRecentes[0].nome).toBe('Carta 1');
  });
  it('dias ativos atual x anterior', () => {
    expect(m.atual.diasAtivos).toBe(5);
    expect(m.anterior.diasAtivos).toBe(1);
  });
  it('período anterior com 1 dia ativo não serve de base', () => {
    expect(m.comparacoes.diasAtivos.direcao).toBe('sem_base');
  });
  it('com base suficiente compara', () => {
    const d = dadosCompletos();
    d.refeicoes.push({ id: 'r9', data: '2026-10-05', tipo: 'ALMOCO', alimentos: [] });
    const r = calcularMetricas(d, 'semana');
    expect(r.comparacoes.diasAtivos.direcao).toBe('subiu');
    expect(r.comparacoes.diasAtivos.diferenca).toBe(3);
  });
  it('usuário sem nenhum dado: tudo zerado, sem erro', () => {
    const r = calcularMetricas(dadosVazios(), 'mes');
    expect(r.atual.diasAtivos).toBe(0);
    expect(r.atual.habitos.alimentosNovos).toBeNull();
    expect(r.atual.habitos.agua.mediaMlPorDiaRegistrado).toBeNull();
    expect(r.atual.engajamento.porDia).toHaveLength(28);
  });
});
