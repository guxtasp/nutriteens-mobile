// src/features/adolescente/metricas/utils/misturaNova.ts
//
// Termômetro da regra de ouro: a MISTURA, na janela, entre alimentos in natura (ou
// ingredientes culinários), processados e ultraprocessados (classificação NOVA do Guia
// Alimentar). Pura (sem rede, sem relógio).
//
// Regras:
//  - conta o que o adolescente REGISTROU (cada alimento em cada refeição = 1 item);
//  - alimento sem classificação NOVA fica fora da conta (não chutamos);
//  - com poucos dias ou poucos itens classificados não se afirma padrão: `sem_dados`;
//  - nada aqui vira nota, número exibido ou comparação com outras pessoas.
import type { DadosBrutos, Janela } from '../types/metricas';
import { MIN_DIAS_PADRAO } from './comparacao';
import { dentro } from './periodos';

export type EstadoTermometro = 'sem_dados' | 'mais_natural' | 'mistura' | 'mais_industrializado';

/** Itens classificados mínimos para falar em mistura. PROPOSTA: validar com a nutricionista. */
export const MIN_ITENS_CLASSIFICADOS = 6;
/** Mesmos cortes da regra por refeição (regraFeedbackRefeicao.ts). PROPOSTA: validar com a nutricionista. */
export const CORTE_PREDOMINIO = 0.5;

export type ClasseMistura = 'natural' | 'processado' | 'ultra';
export const CLASSES_MISTURA: ClasseMistura[] = ['natural', 'processado', 'ultra'];
export const ROTULOS_MISTURA: Record<ClasseMistura, string> = {
  natural: 'In natura e feitos em casa',
  processado: 'Processados',
  ultra: 'Ultraprocessados',
};

/** Alimento que apareceu em uma das partes da mistura e quantas vezes foi registrado. */
export type AlimentoNaMistura = { nome: string; vezes: number };

export type MisturaNova = {
  /** in natura + ingrediente culinário */
  natural: number;
  processado: number;
  ultra: number;
  /** natural + processado + ultra */
  classificados: number;
  /** itens sem classificação NOVA (fora da conta) */
  semClassificacao: number;
  diasComRefeicao: number;
  /** o que entrou em cada parte (distintos, mais frequentes primeiro); alimenta o "toque para ver" */
  alimentos: Record<ClasseMistura, AlimentoNaMistura[]>;
  estado: EstadoTermometro;
};

export function calcularMisturaNova(dados: DadosBrutos, janela: Janela): MisturaNova {
  let natural = 0;
  let processado = 0;
  let ultra = 0;
  let semClassificacao = 0;
  const dias = new Set<string>();
  const porClasse: Record<ClasseMistura, Map<string, AlimentoNaMistura>> = {
    natural: new Map(), processado: new Map(), ultra: new Map(),
  };
  const anota = (classe: ClasseMistura, id: string, nome: string) => {
    const atual = porClasse[classe].get(id);
    if (atual) atual.vezes++;
    else porClasse[classe].set(id, { nome, vezes: 1 });
  };

  for (const r of dados.refeicoes) {
    if (!dentro(r.data, janela)) continue;
    dias.add(r.data);
    for (const a of r.alimentos) {
      switch (a.classificacaoNova) {
        case 'IN_NATURA':
        case 'INGREDIENTE_CULINARIO':
          natural++;
          anota('natural', a.alimentoId, a.nome);
          break;
        case 'PROCESSADO':
          processado++;
          anota('processado', a.alimentoId, a.nome);
          break;
        case 'ULTRAPROCESSADO':
          ultra++;
          anota('ultra', a.alimentoId, a.nome);
          break;
        default:
          semClassificacao++;
      }
    }
  }

  const classificados = natural + processado + ultra;
  let estado: EstadoTermometro;
  if (dias.size < MIN_DIAS_PADRAO || classificados < MIN_ITENS_CLASSIFICADOS) estado = 'sem_dados';
  else if (ultra / classificados >= CORTE_PREDOMINIO) estado = 'mais_industrializado';
  else if (natural / classificados >= CORTE_PREDOMINIO) estado = 'mais_natural';
  else estado = 'mistura';

  const ordena = (m: Map<string, AlimentoNaMistura>) =>
    Array.from(m.values()).sort((x, y) => y.vezes - x.vezes || x.nome.localeCompare(y.nome));
  const alimentos = { natural: ordena(porClasse.natural), processado: ordena(porClasse.processado), ultra: ordena(porClasse.ultra) };

  return { natural, processado, ultra, classificados, semClassificacao, diasComRefeicao: dias.size, alimentos, estado };
}
