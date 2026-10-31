// src/features/conteudo/utils/filtrosFluxo.ts
// Filtros da lista de Conteúdos (aba de tipo, busca, autor e ordem). Funções puras.
import type { StatusFluxo, TipoConteudo } from './fluxo';

export type AbaTipo = 'TODOS' | TipoConteudo;
export type OrdemFluxo = 'RECENTES' | 'ANTIGOS' | 'AZ';

export type FiltrosFluxo = {
  aba: AbaTipo;
  status: StatusFluxo[] | null;
  busca: string;
  autor: string; // 'TODOS' ou nome do criador
  ordem: OrdemFluxo;
};

export const FILTROS_FLUXO_VAZIOS: FiltrosFluxo = { aba: 'TODOS', status: null, busca: '', autor: 'TODOS', ordem: 'RECENTES' };

type ItemMinimo = { tipo: TipoConteudo; titulo: string; status: StatusFluxo; criadorNome: string | null; atualizadoEm: string };

export const SEM_AUTOR = 'Sistema';

/** minúsculas e sem acento */
export function normalizarTexto(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function nomeAutor(i: { criadorNome: string | null }): string {
  return i.criadorNome?.trim() || SEM_AUTOR;
}

/** Itens da aba escolhida, antes dos demais filtros (serve para contar cada aba). */
export function dasAba<T extends ItemMinimo>(itens: T[], aba: AbaTipo): T[] {
  return aba === 'TODOS' ? itens : itens.filter((i) => i.tipo === aba);
}

export function autoresDisponiveis<T extends ItemMinimo>(itens: T[]): string[] {
  return Array.from(new Set(itens.map(nomeAutor))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function filtrarFluxo<T extends ItemMinimo>(itens: T[], f: FiltrosFluxo): T[] {
  const termo = normalizarTexto(f.busca);
  const lista = dasAba(itens, f.aba).filter((i) => {
    if (f.status && !f.status.includes(i.status)) return false;
    if (f.autor !== 'TODOS' && nomeAutor(i) !== f.autor) return false;
    if (termo && !normalizarTexto(i.titulo).includes(termo)) return false;
    return true;
  });
  const ordenada = [...lista];
  if (f.ordem === 'AZ') ordenada.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  else {
    const sinal = f.ordem === 'ANTIGOS' ? 1 : -1;
    ordenada.sort((a, b) => sinal * (Date.parse(a.atualizadoEm) - Date.parse(b.atualizadoEm)));
  }
  return ordenada;
}

/** quantos filtros (fora a aba) estão ligados */
export function contarFiltrosFluxo(f: FiltrosFluxo): number {
  return [f.status !== null, f.busca.trim() !== '', f.autor !== 'TODOS'].filter(Boolean).length;
}
