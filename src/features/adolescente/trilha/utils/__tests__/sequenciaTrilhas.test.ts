import { ordenarLicoesDoCaminho, ordenarTrilhas, statusDaTrilha, statusDasLicoes } from '../sequenciaTrilhas';

describe('sequenciaTrilhas', () => {
  it('ordena trilhas por ordem e desempata pela mais antiga', () => {
    const r = ordenarTrilhas([
      { id: 'c', ordem: 2, criadoEm: '2026-01-01' },
      { id: 'b', ordem: 1, criadoEm: '2026-02-01' },
      { id: 'a', ordem: 1, criadoEm: '2026-01-01' },
    ]);
    expect(r.map((t) => t.id)).toEqual(['a', 'b', 'c']);
  });

  it('lições seguem trilha → módulo → lição (ordem da lição reinicia a cada módulo)', () => {
    const trilhas = ordenarTrilhas([
      { id: 'T2', ordem: 2 },
      { id: 'T1', ordem: 1 },
    ]);
    const modulos = [
      { id: 'M2a', trilhaId: 'T2', ordem: 1 },
      { id: 'M1b', trilhaId: 'T1', ordem: 2 },
      { id: 'M1a', trilhaId: 'T1', ordem: 1 },
    ];
    const licoes = [
      { id: 'L2a1', moduloId: 'M2a', ordem: 1 },
      { id: 'L1b2', moduloId: 'M1b', ordem: 2 },
      { id: 'L1a1', moduloId: 'M1a', ordem: 1 },
      { id: 'L1b1', moduloId: 'M1b', ordem: 1 },
    ];
    expect(ordenarLicoesDoCaminho(trilhas, modulos, licoes).map((l) => l.id)).toEqual(['L1a1', 'L1b1', 'L1b2', 'L2a1']);
  });

  it('a trilha seguinte fica bloqueada enquanto a anterior não termina', () => {
    const ids = ['a1', 'a2', 'b1', 'b2'];
    expect(statusDasLicoes(ids, new Set(['a1']))).toEqual(['concluida', 'atual', 'bloqueada', 'bloqueada']);
  });

  it('terminando a trilha anterior, a primeira lição da próxima vira a atual', () => {
    const ids = ['a1', 'a2', 'b1', 'b2'];
    expect(statusDasLicoes(ids, new Set(['a1', 'a2']))).toEqual(['concluida', 'concluida', 'atual', 'bloqueada']);
  });

  it('registro solto à frente não fura o cadeado', () => {
    expect(statusDasLicoes(['a1', 'a2', 'b1'], new Set(['a1', 'b1']))).toEqual(['concluida', 'atual', 'bloqueada']);
  });

  it('tudo concluído: nenhuma atual', () => {
    expect(statusDasLicoes(['a1', 'b1'], new Set(['a1', 'b1']))).toEqual(['concluida', 'concluida']);
  });

  it('status da trilha: concluída, em andamento ou bloqueada', () => {
    expect(statusDaTrilha(['concluida', 'concluida'])).toBe('concluida');
    expect(statusDaTrilha(['concluida', 'atual', 'bloqueada'])).toBe('atual');
    expect(statusDaTrilha(['atual', 'bloqueada'])).toBe('atual');
    expect(statusDaTrilha(['bloqueada', 'bloqueada'])).toBe('bloqueada');
    expect(statusDaTrilha([])).toBe('bloqueada');
  });
});
