import type { ClassificacaoNova } from '../../../alimentacao/utils/regraFeedbackRefeicao';
import { criarJanela } from '../periodos';
import { calcularMisturaNova, MIN_ITENS_CLASSIFICADOS } from '../misturaNova';
import { dadosVazios, HOJE } from './fixtures';

const janela = criarJanela(HOJE, 7); // 09/10–15/10

type Nova = ClassificacaoNova | null;
const ref = (id: string, data: string, itens: Nova[]) => ({
  id, data, tipo: 'ALMOCO',
  alimentos: itens.map((n, i) => ({ alimentoId: `${id}-${i}`, nome: `${id}-${i}`, grupos: [], classificacaoNova: n })),
});
const repete = (n: number, v: Nova): Nova[] => Array.from({ length: n }, () => v);

describe('calcularMisturaNova', () => {
  it('sem refeições: sem_dados', () => {
    const m = calcularMisturaNova(dadosVazios(), janela);
    expect(m.estado).toBe('sem_dados');
    expect(m.classificados).toBe(0);
  });

  it('menos de 3 dias com refeição: sem_dados, mesmo com muitos itens', () => {
    const m = calcularMisturaNova(dadosVazios({
      refeicoes: [ref('r1', '2026-10-13', repete(10, 'IN_NATURA')), ref('r2', '2026-10-14', repete(10, 'IN_NATURA'))],
    }), janela);
    expect(m.estado).toBe('sem_dados');
  });

  it('poucos itens classificados: sem_dados', () => {
    const m = calcularMisturaNova(dadosVazios({
      refeicoes: [ref('r1', '2026-10-12', ['IN_NATURA']), ref('r2', '2026-10-13', ['IN_NATURA']), ref('r3', '2026-10-14', ['IN_NATURA'])],
    }), janela);
    expect(m.classificados).toBeLessThan(MIN_ITENS_CLASSIFICADOS);
    expect(m.estado).toBe('sem_dados');
  });

  it('predomínio de in natura: mais_natural; ingrediente culinário conta como natural', () => {
    const m = calcularMisturaNova(dadosVazios({
      refeicoes: [
        ref('r1', '2026-10-12', ['IN_NATURA', 'IN_NATURA', 'INGREDIENTE_CULINARIO']),
        ref('r2', '2026-10-13', ['IN_NATURA', 'PROCESSADO']),
        ref('r3', '2026-10-14', ['ULTRAPROCESSADO', 'IN_NATURA']),
      ],
    }), janela);
    expect(m).toMatchObject({ natural: 5, processado: 1, ultra: 1, classificados: 7, estado: 'mais_natural' });
  });

  it('nenhum predomina: mistura', () => {
    const m = calcularMisturaNova(dadosVazios({
      refeicoes: [
        ref('r1', '2026-10-12', ['IN_NATURA', 'PROCESSADO', 'PROCESSADO']),
        ref('r2', '2026-10-13', ['IN_NATURA', 'ULTRAPROCESSADO']),
        ref('r3', '2026-10-14', ['PROCESSADO', 'ULTRAPROCESSADO']),
      ],
    }), janela);
    expect(m.estado).toBe('mistura');
  });

  it('metade ou mais ultraprocessado: mais_industrializado', () => {
    const m = calcularMisturaNova(dadosVazios({
      refeicoes: [
        ref('r1', '2026-10-12', ['ULTRAPROCESSADO', 'ULTRAPROCESSADO', 'IN_NATURA']),
        ref('r2', '2026-10-13', ['ULTRAPROCESSADO', 'PROCESSADO']),
        ref('r3', '2026-10-14', ['ULTRAPROCESSADO', 'IN_NATURA']),
      ],
    }), janela);
    expect(m).toMatchObject({ ultra: 4, classificados: 7, estado: 'mais_industrializado' });
  });

  it('item sem classificação fica fora da conta, mas é contado à parte', () => {
    const m = calcularMisturaNova(dadosVazios({
      refeicoes: [
        ref('r1', '2026-10-12', ['IN_NATURA', null, null]),
        ref('r2', '2026-10-13', ['IN_NATURA', 'IN_NATURA', null]),
        ref('r3', '2026-10-14', ['IN_NATURA', 'IN_NATURA', 'IN_NATURA']),
      ],
    }), janela);
    expect(m).toMatchObject({ natural: 6, classificados: 6, semClassificacao: 3, estado: 'mais_natural' });
  });

  it('alimento sem o campo (dado antigo) também não entra', () => {
    const r = ref('r1', '2026-10-12', ['IN_NATURA']);
    r.alimentos.push({ alimentoId: 'x', nome: 'x', grupos: [] } as any);
    const m = calcularMisturaNova(dadosVazios({ refeicoes: [r] }), janela);
    expect(m.semClassificacao).toBe(1);
  });

  it('refeições fora da janela não contam', () => {
    const m = calcularMisturaNova(dadosVazios({
      refeicoes: [
        ref('r0', '2026-10-08', repete(20, 'ULTRAPROCESSADO')), // um dia antes da janela
        ref('r1', '2026-10-12', ['IN_NATURA', 'IN_NATURA']),
        ref('r2', '2026-10-13', ['IN_NATURA', 'IN_NATURA']),
        ref('r3', '2026-10-14', ['IN_NATURA', 'IN_NATURA']),
      ],
    }), janela);
    expect(m).toMatchObject({ ultra: 0, natural: 6, estado: 'mais_natural' });
  });
});
