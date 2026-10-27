// Isolamento entre usuários: com o Supabase simulado, confere que toda consulta a dado
// pessoal filtra pelo usuário logado (além da RLS) e que falhas viram erro, não dado parcial.
type Filtro = [string, ...unknown[]];
const mockChamadas: { tabela: string; filtros: Filtro[] }[] = [];
let mockRespostas: Record<string, { data: unknown; error: { message: string } | null }> = {};

function mockConstruir(tabela: string) {
  const reg = { tabela, filtros: [] as Filtro[] };
  mockChamadas.push(reg);
  const p: any = new Proxy({}, {
    get(_, prop: string) {
      if (prop === 'then') {
        return (res: any, rej: any) => Promise.resolve(mockRespostas[tabela] ?? { data: [], error: null }).then(res, rej);
      }
      return (...args: unknown[]) => {
        if (['eq', 'in', 'lt', 'gte', 'lte'].includes(prop)) reg.filtros.push([prop, ...args]);
        return p;
      };
    },
  });
  return p;
}

jest.mock('../../../../../lib/supabase', () => ({ supabase: { from: (t: string) => mockConstruir(t) } }));

import { buscarDadosMetricas } from '../metricasService';

const USER = 'user-123';
const refeicaoComAlimento = {
  id: 'r1', tipo: 'ALMOCO', registros_diarios: { data: '2026-10-14' },
  refeicao_alimentos: [{ alimentos: { id: 'a1', nome: 'Maçã', grupos_alimentares: ['FRUTAS'] } }],
};

beforeEach(() => {
  mockChamadas.length = 0;
  mockRespostas = { refeicoes: { data: [refeicaoComAlimento], error: null } };
});

const filtrouPorUsuario = (tabela: string, coluna: string) =>
  mockChamadas.some((c) => c.tabela === tabela && c.filtros.some(([op, col, val]) => op === 'eq' && col === coluna && val === USER));

describe('buscarDadosMetricas — isolamento', () => {
  it.each([
    ['refeicoes', 'registros_diarios.user_id'],
    ['registros_agua', 'registros_diarios.user_id'],
    ['registros_atividade_fisica', 'registros_diarios.user_id'],
    ['refeicao_alimentos', 'refeicoes.registros_diarios.user_id'],
    ['missoes_diarias', 'user_id'],
    ['progresso_licao', 'usuario_id'],
    ['xp_lancamentos', 'usuario_id'],
    ['insignias_usuario', 'usuario_id'],
    ['cartas_usuario', 'usuario_id'],
    ['profiles', 'id'],
  ])('%s filtra por %s = usuário logado', async (tabela, coluna) => {
    await buscarDadosMetricas(USER);
    expect(filtrouPorUsuario(tabela, coluna)).toBe(true);
  });

  it('só consulta tabelas conhecidas (tabela nova exige decisão consciente de privacidade)', async () => {
    await buscarDadosMetricas(USER);
    const permitidas = new Set([
      'refeicoes', 'registros_agua', 'registros_atividade_fisica', 'refeicao_alimentos', 'missoes_diarias',
      'progresso_licao', 'xp_lancamentos', 'insignias_usuario', 'cartas_usuario', 'profiles', 'trilhas',
    ]);
    expect(mockChamadas.filter((c) => !permitidas.has(c.tabela))).toEqual([]);
  });

  it('não lê dados sociais nem de outros usuários', async () => {
    await buscarDadosMetricas(USER);
    const proibidas = ['amizades', 'feed_eventos', 'feed_reacoes', 'chamas_dupla', 'eventos_app', 'denuncias_sociais'];
    expect(mockChamadas.filter((c) => proibidas.includes(c.tabela))).toEqual([]);
  });

  it('só considera refeições realizadas', async () => {
    await buscarDadosMetricas(USER);
    const c = mockChamadas.find((x) => x.tabela === 'refeicoes')!;
    expect(c.filtros).toContainEqual(['eq', 'realizada', true]);
  });
});

describe('buscarDadosMetricas — resultado e falhas', () => {
  it('sem peso no perfil, não há meta de água', async () => {
    mockRespostas.profiles = { data: { peso_kg: null }, error: null };
    expect((await buscarDadosMetricas(USER)).metaAguaMl).toBeNull();
  });

  it('com peso, usa a mesma meta da tela de água (40 ml/kg, mínimo 1500)', async () => {
    mockRespostas.profiles = { data: { peso_kg: 50 }, error: null };
    expect((await buscarDadosMetricas(USER)).metaAguaMl).toBe(2000);
  });

  it('erro em consulta paginada vira erro (não dado parcial)', async () => {
    mockRespostas.registros_agua = { data: null, error: { message: 'falhou' } };
    await expect(buscarDadosMetricas(USER)).rejects.toThrow('falhou');
  });

  it('erro em consulta simples (insígnias) também vira erro', async () => {
    mockRespostas.insignias_usuario = { data: null, error: { message: 'sem acesso' } };
    await expect(buscarDadosMetricas(USER)).rejects.toThrow('sem acesso');
  });

  it('monta as refeições recebidas', async () => {
    const d = await buscarDadosMetricas(USER);
    expect(d.refeicoes).toHaveLength(1);
    expect(d.refeicoes[0].alimentos[0].nome).toBe('Maçã');
  });
});
