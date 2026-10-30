// src/features/conteudo/utils/receitasLista.ts
// Filtro, ordem e avisos da lista de receitas do painel. Funções puras (testáveis no jest).
import type { ItemFluxo } from '../services/fluxoService';
import type { StatusFluxo } from './fluxo';

export type DadosReceita = {
  fotoUrl: string | null;
  tempoMin: number | null;
  porcoes: number | null;
  dificuldade: string | null;
  pratoNome: string | null;
  ingredientes: number;
  passos: number;
};
export type ReceitaDaLista = ItemFluxo & { dados: DadosReceita | null };

export type OrdemReceitas = 'RECENTES' | 'AZ';
export type FiltrosReceitas = {
  busca: string;
  status: StatusFluxo | 'TODOS';
  dificuldade: 'TODAS' | 'FACIL' | 'MEDIO' | 'DIFICIL';
  ordem: OrdemReceitas;
};
export const FILTROS_RECEITAS_VAZIOS: FiltrosReceitas = { busca: '', status: 'TODOS', dificuldade: 'TODAS', ordem: 'RECENTES' };

export const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };

const sem = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function filtrarReceitas(lista: ReceitaDaLista[], f: FiltrosReceitas): ReceitaDaLista[] {
  const termo = sem(f.busca);
  const saida = lista.filter((r) => {
    if (f.status !== 'TODOS' && r.status !== f.status) return false;
    if (f.dificuldade !== 'TODAS' && r.dados?.dificuldade !== f.dificuldade) return false;
    if (termo && !sem(`${r.titulo} ${r.dados?.pratoNome ?? ''}`).includes(termo)) return false;
    return true;
  });
  return saida.sort((a, b) =>
    f.ordem === 'AZ' ? a.titulo.localeCompare(b.titulo, 'pt-BR') : b.atualizadoEm.localeCompare(a.atualizadoEm)
  );
}

/** quantas receitas há em cada status (para os contadores dos filtros) */
export function contarPorStatus(lista: ReceitaDaLista[]): Record<string, number> {
  const c: Record<string, number> = { TODOS: lista.length };
  for (const r of lista) c[r.status] = (c[r.status] ?? 0) + 1;
  return c;
}

/** o que ainda falta na receita (só avisa; não impede nada) */
export function avisosReceita(d: DadosReceita | null): string[] {
  if (!d) return [];
  const a: string[] = [];
  if (!d.fotoUrl) a.push('Sem foto');
  if (d.ingredientes === 0) a.push('Sem ingredientes');
  if (d.passos === 0) a.push('Sem passo a passo');
  return a;
}
