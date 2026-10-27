// src/features/adolescente/metricas/utils/dadosDemo.ts
//
// DADOS FICTÍCIOS para testar a tela "Minha jornada" (em especial o termômetro) sem
// depender do que existe no banco. Pura e determinística. Só é usada pelo hook quando
// `__DEV__` e `CENARIO_DEMO` estão ligados (ver demo.ts): nunca toca no Supabase e
// nunca roda em build de produção.
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import type { DadosBrutos, DataISO, RefeicaoRegistrada } from '../types/metricas';
import { somarDias } from './periodos';

export type CenarioDemo = 'natural' | 'mistura' | 'industrializado' | 'poucos' | 'vazio';

type Item = { id: string; nome: string; grupos: string[]; nova: ClassificacaoNova };

const N = (id: string, nome: string, grupos: string[]): Item => ({ id, nome, grupos, nova: 'IN_NATURA' });
const IC = (id: string, nome: string, grupos: string[]): Item => ({ id, nome, grupos, nova: 'INGREDIENTE_CULINARIO' });
const P = (id: string, nome: string, grupos: string[]): Item => ({ id, nome, grupos, nova: 'PROCESSADO' });
const U = (id: string, nome: string, grupos: string[]): Item => ({ id, nome, grupos, nova: 'ULTRAPROCESSADO' });

const NATURAIS: Item[] = [
  N('d-arroz', 'Arroz', ['CEREAIS']), N('d-feijao', 'Feijão', ['LEGUMINOSAS']), N('d-banana', 'Banana', ['FRUTAS']),
  N('d-couve', 'Couve', ['VERDURAS']), N('d-ovo', 'Ovo', ['CARNES_OVOS']), N('d-laranja', 'Laranja', ['FRUTAS']),
  N('d-mandioca', 'Mandioca', ['RAIZES']), IC('d-azeite', 'Azeite', ['OLEOS']),
];
const PROCESSADOS: Item[] = [P('d-queijo', 'Queijo', ['LEITE']), P('d-paofor', 'Pão de padaria', ['CEREAIS'])];
const ULTRAS: Item[] = [
  U('d-refri', 'Refrigerante', ['BEBIDAS']), U('d-biscoito', 'Biscoito recheado', ['DOCES']),
  U('d-salsicha', 'Salsicha', ['CARNES_OVOS']), U('d-nuggets', 'Nuggets', ['CARNES_OVOS']),
];

/** Quantos itens de cada tipo entram em cada refeição, por cenário (3 refeições por dia). */
const RECEITA: Record<Exclude<CenarioDemo, 'vazio'>, { dias: number; natural: number; processado: number; ultra: number }> = {
  natural: { dias: 10, natural: 3, processado: 0, ultra: 1 },
  mistura: { dias: 10, natural: 1, processado: 1, ultra: 1 },
  industrializado: { dias: 10, natural: 1, processado: 0, ultra: 2 },
  poucos: { dias: 2, natural: 2, processado: 0, ultra: 0 }, // menos de 3 dias: termômetro neutro
};
const TIPOS = ['CAFE_DA_MANHA', 'ALMOCO', 'JANTAR'];

function pega(lista: Item[], i: number, n: number): Item[] {
  return Array.from({ length: n }, (_, k) => lista[(i + k) % lista.length]);
}

export function gerarDadosDemo(cenario: CenarioDemo, hoje: DataISO): DadosBrutos {
  const base: DadosBrutos = {
    hoje, refeicoes: [], agua: [], metaAguaMl: 2000, atividades: [], missoesDiarias: [],
    licoes: [], xp: [], conquistas: [], trilhas: [], primeiraAparicaoAlimentos: [], diasCarregados: 56,
  };
  if (cenario === 'vazio') return base;

  const r = RECEITA[cenario];
  const refeicoes: RefeicaoRegistrada[] = [];
  for (let d = 0; d < r.dias; d++) {
    const data = somarDias(hoje, -d);
    TIPOS.forEach((tipo, t) => {
      const i = d * 3 + t;
      const itens = [...pega(NATURAIS, i, r.natural), ...pega(PROCESSADOS, i, r.processado), ...pega(ULTRAS, i, r.ultra)];
      refeicoes.push({
        id: `demo-${d}-${t}`, data, tipo,
        alimentos: itens.map((a) => ({ alimentoId: a.id, nome: a.nome, grupos: a.grupos, classificacaoNova: a.nova })),
      });
    });
  }
  return {
    ...base,
    refeicoes,
    agua: Array.from({ length: r.dias }, (_, d) => ({ data: somarDias(hoje, -d), ml: d % 3 === 2 ? 1200 : 2100 })),
    atividades: [0, 2, 5].filter((d) => d < r.dias).map((d) => ({ data: somarDias(hoje, -d), tipo: 'Caminhada', minutos: 30 })),
  };
}
