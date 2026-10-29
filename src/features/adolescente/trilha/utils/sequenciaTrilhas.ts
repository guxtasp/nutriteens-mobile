// src/features/adolescente/trilha/utils/sequenciaTrilhas.ts
//
// Regras PURAS (sem Supabase) de como várias trilhas viram UM caminho contínuo,
// estilo Duolingo: cada trilha é uma "unidade", e a seguinte só libera quando a
// anterior termina. Fica separado do trilhaService pra poder ser testado.

export type StatusNoSequencia = 'concluida' | 'atual' | 'bloqueada';

export type TrilhaOrdenavel = { id: string; ordem: number; criadoEm?: string | null };
export type ModuloOrdenavel = { id: string; trilhaId: string; ordem: number };
export type LicaoOrdenavel = { id: string; moduloId: string; ordem: number };

/** `ordem` da trilha; empate = a mais antiga (resultado estável). */
export function ordenarTrilhas<T extends TrilhaOrdenavel>(trilhas: T[]): T[] {
  return [...trilhas].sort(
    (a, b) => a.ordem - b.ordem || String(a.criadoEm ?? '').localeCompare(String(b.criadoEm ?? ''))
  );
}

/**
 * Lições na ordem do caminho: trilha → módulo (dentro da trilha) → lição (dentro do módulo).
 * `licoes.ordem` reinicia a cada módulo, então nunca dá pra ordenar só por ela.
 */
export function ordenarLicoesDoCaminho<L extends LicaoOrdenavel>(
  trilhasOrdenadas: TrilhaOrdenavel[],
  modulos: ModuloOrdenavel[],
  licoes: L[]
): L[] {
  const posicaoTrilha = new Map(trilhasOrdenadas.map((t, i) => [t.id, i]));
  const posicaoModulo = new Map<string, number>();
  [...modulos]
    .sort((a, b) => (posicaoTrilha.get(a.trilhaId) ?? 0) - (posicaoTrilha.get(b.trilhaId) ?? 0) || a.ordem - b.ordem)
    .forEach((m, i) => posicaoModulo.set(m.id, i));

  return [...licoes].sort(
    (a, b) => (posicaoModulo.get(a.moduloId) ?? 0) - (posicaoModulo.get(b.moduloId) ?? 0) || a.ordem - b.ordem
  );
}

/**
 * Status de cada lição, na ordem do caminho. Só uma sequência CONTÍGUA vira
 * concluída: depois da primeira pendência (a "atual") tudo fica bloqueado, mesmo
 * que exista um registro antigo/inconsistente mais à frente. Como a lista
 * atravessa todas as trilhas, a trilha seguinte só abre quando a anterior acaba.
 */
export function statusDasLicoes(idsEmOrdem: string[], concluidas: Set<string>): StatusNoSequencia[] {
  let achouPendente = false;
  return idsEmOrdem.map((id) => {
    if (!achouPendente && concluidas.has(id)) return 'concluida';
    if (!achouPendente) {
      achouPendente = true;
      return 'atual';
    }
    return 'bloqueada';
  });
}

export type StatusTrilha = 'concluida' | 'atual' | 'bloqueada';

/**
 * Situação de uma trilha inteira (a "unidade"), a partir do status dos nós dela:
 * todos concluídos = concluída; tem o nó atual = em andamento; senão bloqueada
 * (a anterior ainda não terminou). Trilha sem nós não conta como concluída.
 */
export function statusDaTrilha(statusDosNos: StatusNoSequencia[]): StatusTrilha {
  if (statusDosNos.length === 0) return 'bloqueada';
  if (statusDosNos.every((s) => s === 'concluida')) return 'concluida';
  if (statusDosNos.some((s) => s === 'atual')) return 'atual';
  return 'bloqueada';
}
