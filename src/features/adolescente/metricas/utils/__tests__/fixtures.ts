import type { DadosBrutos } from '../../types/metricas';

export const HOJE = '2026-10-15'; // janela atual 09/10–15/10; anterior 02/10–08/10

export function dadosVazios(over: Partial<DadosBrutos> = {}): DadosBrutos {
  return {
    hoje: HOJE, refeicoes: [], agua: [], metaAguaMl: null, atividades: [], missoesDiarias: [],
    licoes: [], xp: [], conquistas: [], trilhas: [], primeiraAparicaoAlimentos: [], ...over,
  };
}

export const alim = (id: string, nome: string, grupos: string[]) => ({ alimentoId: id, nome, grupos });

export function dadosCompletos(): DadosBrutos {
  return dadosVazios({
    metaAguaMl: 2000,
    refeicoes: [
      { id: 'r1', data: '2026-10-09', tipo: 'CAFE_DA_MANHA', alimentos: [alim('a1', 'Pão', ['CEREAIS']), alim('a2', 'Banana', ['FRUTAS'])] },
      { id: 'r2', data: '2026-10-09', tipo: 'ALMOCO', alimentos: [alim('a3', 'Arroz', ['CEREAIS']), alim('a4', 'Feijão', ['LEGUMINOSAS'])] },
      { id: 'r3', data: '2026-10-11', tipo: 'ALMOCO', alimentos: [alim('a3', 'Arroz', ['CEREAIS']), alim('a5', 'Couve', ['VERDURAS'])] },
      { id: 'r4', data: '2026-10-13', tipo: 'LANCHE_TARDE', alimentos: [alim('a2', 'Banana', ['FRUTAS'])] },
      { id: 'r0', data: '2026-10-03', tipo: 'ALMOCO', alimentos: [alim('a3', 'Arroz', ['CEREAIS'])] },
    ],
    agua: [
      { data: '2026-10-09', ml: 1200 }, { data: '2026-10-09', ml: 900 },
      { data: '2026-10-10', ml: 500 },
      { data: '2026-10-03', ml: 2500 },
    ],
    atividades: [
      { data: '2026-10-10', tipo: 'Caminhada', minutos: 30 },
      { data: '2026-10-12', tipo: 'caminhada ', minutos: 20 },
      { data: '2026-10-12', tipo: 'Futebol', minutos: 45 },
    ],
    missoesDiarias: [
      { data: '2026-10-09', concluida: true }, { data: '2026-10-10', concluida: false }, { data: '2026-10-03', concluida: true },
    ],
    licoes: [
      { data: '2026-10-11', licaoId: 'l1', trilhaId: 't1' }, { data: '2026-10-12', licaoId: 'l2', trilhaId: 't1' },
      { data: '2026-10-03', licaoId: 'l0', trilhaId: 't1' },
    ],
    xp: [
      { data: '2026-10-11', origem: 'licao', quantidade: 10 }, { data: '2026-10-12', origem: 'licao', quantidade: 10 },
      { data: '2026-10-09', origem: 'missao_diaria', quantidade: 15 }, { data: '2026-10-03', origem: 'licao', quantidade: 10 },
    ],
    conquistas: [
      { tipo: 'insignia', nome: 'Primeira lição', data: '2026-10-03' },
      { tipo: 'carta', nome: 'Carta 1', data: '2026-10-12' },
    ],
    trilhas: [{ trilhaId: 't1', titulo: 'Comida de verdade', totalLicoes: 10, licoesConcluidas: 3 }],
    primeiraAparicaoAlimentos: [
      { alimentoId: 'a3', nome: 'Arroz', data: '2026-10-03' },
      { alimentoId: 'a2', nome: 'Banana', data: '2026-10-09' },
      { alimentoId: 'a5', nome: 'Couve', data: '2026-10-11' },
    ],
  });
}
