import { avisosReceita, contarPorStatus, filtrarReceitas, FILTROS_RECEITAS_VAZIOS, type ReceitaDaLista } from '../receitasLista';

jest.mock('../../../../lib/supabase', () => ({ supabase: {} }));

const base = { id: 'x', tipo: 'RECEITA', conteudoId: 'c', versao: 1, criadorNome: null, criadoEm: '2026-10-01', revisorNome: null, revisadoEm: null, motivoRejeicao: null, publicadoEm: null } as const;
const dados = (o: Partial<NonNullable<ReceitaDaLista['dados']>> = {}) => ({ fotoUrl: 'https://f', tempoMin: 20, porcoes: 2, dificuldade: 'FACIL', pratoNome: 'Arroz', ingredientes: 3, passos: 4, ...o });
const lista: ReceitaDaLista[] = [
  { ...base, id: '1', titulo: 'Omelete de legumes', status: 'PUBLICADO', atualizadoEm: '2026-10-20', dados: dados({ pratoNome: 'Omelete' }) },
  { ...base, id: '2', titulo: 'Bolo de cenoura', status: 'RASCUNHO', atualizadoEm: '2026-10-28', dados: dados({ dificuldade: 'MEDIO', fotoUrl: null, passos: 0 }) },
  { ...base, id: '3', titulo: 'Arroz com feijão', status: 'RASCUNHO', atualizadoEm: '2026-10-10', dados: null },
];
const ids = (f: Partial<typeof FILTROS_RECEITAS_VAZIOS>) => filtrarReceitas(lista, { ...FILTROS_RECEITAS_VAZIOS, ...f }).map((r) => r.id);

describe('filtrarReceitas', () => {
  it('mais recentes primeiro por padrão', () => expect(ids({})).toEqual(['2', '1', '3']));
  it('ordem alfabética', () => expect(ids({ ordem: 'AZ' })).toEqual(['3', '2', '1']));
  it('busca por título ou prato, sem acento', () => {
    expect(ids({ busca: 'feijao' })).toEqual(['3']);
    expect(ids({ busca: 'omelete' })).toEqual(['1']);
  });
  it('filtra por status e dificuldade', () => {
    expect(ids({ status: 'RASCUNHO' })).toEqual(['2', '3']);
    expect(ids({ dificuldade: 'MEDIO' })).toEqual(['2']);
  });
});

describe('contarPorStatus / avisosReceita', () => {
  it('conta por status', () => expect(contarPorStatus(lista)).toEqual({ TODOS: 3, PUBLICADO: 1, RASCUNHO: 2 }));
  it('avisa o que falta', () => {
    expect(avisosReceita(lista[1].dados)).toEqual(['Sem foto', 'Sem passo a passo']);
    expect(avisosReceita(lista[0].dados)).toEqual([]);
    expect(avisosReceita(null)).toEqual([]);
    expect(avisosReceita(dados({ ingredientes: 0 }))).toEqual(['Sem ingredientes']);
  });
});
