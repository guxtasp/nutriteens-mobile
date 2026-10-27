import { ANTES_DO_INTERVALO, montarDadosBrutos, type LinhasBrutas } from '../montarDados';
import { calcularMetricas } from '../calcularMetricas';

// dia() injetado: o teste não depende do fuso da máquina
const dia = (ts: string) => ts.slice(0, 10);

const base = (o: Partial<LinhasBrutas> = {}): LinhasBrutas => ({
  hoje: '2026-10-15',
  refeicoes: [], alimentosVistosAntes: [], historicoAnteriorIncompleto: false,
  agua: [], atividades: [], missoes: [], progressoLicoes: [], xp: [],
  insignias: [], cartas: [], trilhas: [], pesoKg: null,
  ...o,
});

const refeicao = (id: string, data: string, alimentoId: string, nome: string, grupos: string[] | null = ['FRUTAS']) => ({
  id, tipo: 'ALMOCO', registros_diarios: { data },
  refeicao_alimentos: [{ alimentos: { id: alimentoId, nome, grupos_alimentares: grupos } }],
});

describe('montarDadosBrutos', () => {
  it('lê embed como objeto ou lista de 1 item e ignora refeição sem dia', () => {
    const d = montarDadosBrutos(base({
      refeicoes: [
        refeicao('r1', '2026-10-14', 'a1', 'Maçã'),
        { ...refeicao('r2', '2026-10-13', 'a2', 'Arroz'), registros_diarios: [{ data: '2026-10-13' }] },
        { ...refeicao('r3', '2026-10-12', 'a3', 'X'), registros_diarios: null },
      ],
    }), dia);
    expect(d.refeicoes.map((r) => r.id)).toEqual(['r1', 'r2']);
    expect(d.refeicoes[0].alimentos[0]).toEqual({ alimentoId: 'a1', nome: 'Maçã', grupos: ['FRUTAS'], classificacaoNova: null });
  });

  it('classificação NOVA: valor válido passa; nulo, ausente ou desconhecido viram null', () => {
    const linha = (id: string, nova: string | null | undefined) => ({
      id: `r-${id}`, tipo: 'ALMOCO', registros_diarios: { data: '2026-10-14' },
      refeicao_alimentos: [{ alimentos: { id, nome: id, grupos_alimentares: [], classificacao_nova: nova } }],
    });
    const d = montarDadosBrutos(base({
      refeicoes: [linha('a', 'IN_NATURA'), linha('b', 'ULTRAPROCESSADO'), linha('c', null), linha('d', undefined), linha('e', 'OUTRA')],
    }), dia);
    expect(d.refeicoes.map((r) => r.alimentos[0].classificacaoNova)).toEqual(['IN_NATURA', 'ULTRAPROCESSADO', null, null, null]);
  });

  it('grupos nulos viram lista vazia', () => {
    const d = montarDadosBrutos(base({ refeicoes: [refeicao('r1', '2026-10-14', 'a1', 'Pão', null)] }), dia);
    expect(d.refeicoes[0].alimentos[0].grupos).toEqual([]);
  });

  it('primeira aparição: visto antes do intervalo recebe marca anterior; novo recebe a 1ª data', () => {
    const d = montarDadosBrutos(base({
      refeicoes: [
        refeicao('r1', '2026-10-10', 'a1', 'Maçã'),
        refeicao('r2', '2026-10-12', 'a2', 'Manga'),
        refeicao('r3', '2026-10-14', 'a2', 'Manga'),
      ],
      alimentosVistosAntes: ['a1'],
    }), dia);
    const m = Object.fromEntries(d.primeiraAparicaoAlimentos.map((p) => [p.alimentoId, p.data]));
    expect(m).toEqual({ a1: ANTES_DO_INTERVALO, a2: '2026-10-12' });
  });

  it('histórico anterior incompleto: não afirma nada sobre "novos"', () => {
    const d = montarDadosBrutos(base({
      refeicoes: [refeicao('r1', '2026-10-10', 'a1', 'Maçã')],
      historicoAnteriorIncompleto: true,
    }), dia);
    expect(d.primeiraAparicaoAlimentos).toEqual([]);
    expect(calcularMetricas(d, 'semana').atual.habitos.alimentosNovos).toBeNull();
  });

  it('missão só conta como concluída com xp_concedido === true', () => {
    const d = montarDadosBrutos(base({ missoes: [{ data: '2026-10-14', xp_concedido: true }, { data: '2026-10-13', xp_concedido: false }] }), dia);
    expect(d.missoesDiarias.map((m) => m.concluida)).toEqual([true, false]);
  });

  it('XP "saldo_anterior" não entra no período', () => {
    const d = montarDadosBrutos(base({ xp: [
      { origem: 'saldo_anterior', quantidade: 500, criado_em: '2026-10-14T10:00:00Z' },
      { origem: 'licao', quantidade: 10, criado_em: '2026-10-14T11:00:00Z' },
    ] }), dia);
    expect(d.xp).toEqual([{ data: '2026-10-14', origem: 'licao', quantidade: 10 }]);
  });

  it('trilhas: conta lições distintas, associa lição à trilha, ignora duplicatas', () => {
    const d = montarDadosBrutos(base({
      trilhas: [{ id: 't1', titulo: 'Trilha 1', modulos_trilha: [{ licoes: [{ id: 'l1' }, { id: 'l2' }] }, { licoes: [{ id: 'l3' }] }] }],
      progressoLicoes: [
        { licao_id: 'l1', concluida_em: '2026-10-14T10:00:00Z' },
        { licao_id: 'l1', concluida_em: '2026-10-14T12:00:00Z' },
        { licao_id: 'lx', concluida_em: '2026-10-14T12:00:00Z' },
      ],
    }), dia);
    expect(d.trilhas).toEqual([{ trilhaId: 't1', titulo: 'Trilha 1', totalLicoes: 3, licoesConcluidas: 1 }]);
    expect(d.licoes.find((l) => l.licaoId === 'l1')?.trilhaId).toBe('t1');
    expect(d.licoes.find((l) => l.licaoId === 'lx')?.trilhaId).toBe('');
  });

  it('conquistas: junta insígnias e cartas, descartando as sem nome', () => {
    const d = montarDadosBrutos(base({
      insignias: [{ obtida_em: '2026-10-14T10:00:00Z', insignias: { nome: 'Primeiro passo' } }, { obtida_em: '2026-10-13T10:00:00Z', insignias: null }],
      cartas: [{ obtida_em: '2026-10-12T10:00:00Z', cartas_guia: [{ titulo: 'Carta 1' }] }],
    }), dia);
    expect(d.conquistas).toEqual([
      { nome: 'Primeiro passo', data: '2026-10-14', tipo: 'insignia' },
      { nome: 'Carta 1', data: '2026-10-12', tipo: 'carta' },
    ]);
  });

  it('usuário sem nenhum registro resulta em nivelDados "nenhum"', () => {
    const m = calcularMetricas(montarDadosBrutos(base(), dia), 'semana');
    expect(m.atual.nivelDados).toBe('nenhum');
  });
});
