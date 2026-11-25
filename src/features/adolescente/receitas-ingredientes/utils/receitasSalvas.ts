// src/features/adolescente/receitas-ingredientes/utils/receitasSalvas.ts
//
// "Salvar pra fazer depois": regras puras da lista de receitas salvas (a mais recente primeiro).
// A lista fica só no aparelho (receitasSalvasStorage.ts), como a despensa: não é dado de saúde.

export type ReceitaSalva = { id: string; salvaEm: string };

/** Lê o que veio do armazenamento sem confiar no formato; tira repetidas (fica a mais recente). */
export function normalizarSalvas(bruto: unknown): ReceitaSalva[] {
  if (!Array.isArray(bruto)) return [];
  const vistos = new Set<string>();
  const lista: ReceitaSalva[] = [];
  for (const item of bruto) {
    if (!item || typeof item.id !== 'string' || typeof item.salvaEm !== 'string' || vistos.has(item.id)) continue;
    vistos.add(item.id);
    lista.push({ id: item.id, salvaEm: item.salvaEm });
  }
  return lista;
}

export function estaSalva(lista: readonly ReceitaSalva[], id: string): boolean {
  return lista.some((s) => s.id === id);
}

/** Salva (no topo) ou tira da lista. */
export function alternarReceitaSalva(lista: readonly ReceitaSalva[], id: string, agoraISO: string): ReceitaSalva[] {
  if (estaSalva(lista, id)) return lista.filter((s) => s.id !== id);
  return [{ id, salvaEm: agoraISO }, ...lista];
}

/**
 * Junta as salvas com as receitas carregadas, na ordem em que foram salvas. Receita que saiu do ar
 * (despublicada) simplesmente não aparece.
 */
export function receitasNaOrdemSalva<T extends { id: string }>(lista: readonly ReceitaSalva[], receitas: readonly T[]): T[] {
  const porId = new Map(receitas.map((r) => [r.id, r]));
  return lista.map((s) => porId.get(s.id)).filter((r): r is T => !!r);
}

/** "1 receita salva" / "3 receitas salvas" / "Nenhuma salva ainda". */
export function textoQuantidadeSalvas(n: number): string {
  if (n <= 0) return 'Nenhuma salva ainda';
  return n === 1 ? '1 receita salva' : `${n} receitas salvas`;
}
