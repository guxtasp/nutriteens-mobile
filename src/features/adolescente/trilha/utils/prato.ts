// src/features/adolescente/trilha/utils/prato.ts
//
// Regras do exercício "Monte seu prato" (formato `prato`), sem React pra poder
// ser testado. Os dados vivem em `questoes_quiz.dados_extra`:
//
//   alimentos:   [{ id, nome, emoji, grupo }]   o que aparece na bandeja
//   criterios:   [{ id, texto, grupos, minimo?, maximo? }]   a "missão"
//   capacidade:  nº de lugares no prato (3 a 7; padrão 6)
//   minimoItens: nº mínimo de alimentos pra concluir (padrão 3)
//   feedback:    mensagem que aparece ao concluir
//
// Um critério conta quantos alimentos do prato pertencem a QUALQUER um dos
// `grupos` dele e compara com `minimo` / `maximo`. Não existe "errado": o
// passo é SEM NOTA, só libera o CONTINUAR quando a missão está cumprida, e um
// critério de limite estourado só vira um aviso gentil (ver Prato.tsx).

export type AlimentoPrato = {
  id: string;
  nome: string;
  emoji: string;
  grupo: string;
};

export type CriterioPrato = {
  id: string;
  texto: string;
  grupos: string[];
  minimo?: number;
  maximo?: number;
};

export type StatusCriterio = {
  criterio: CriterioPrato;
  quantidade: number;
  atendido: boolean;
  // passou do `maximo`
  excedeu: boolean;
  // critério que só tem limite (sem `minimo`): começa "ok" e só muda se estourar
  soLimite: boolean;
};

export type AvaliacaoPrato = {
  status: StatusCriterio[];
  totalItens: number;
  criteriosOk: boolean;
  completo: boolean;
};

export const CAPACIDADE_PADRAO = 6;
export const CAPACIDADE_MIN = 3;
export const CAPACIDADE_MAX = 7;
export const MINIMO_ITENS_PADRAO = 3;

export function normalizarCapacidade(capacidade?: number): number {
  if (typeof capacidade !== 'number' || !Number.isFinite(capacidade)) return CAPACIDADE_PADRAO;
  return Math.min(CAPACIDADE_MAX, Math.max(CAPACIDADE_MIN, Math.round(capacidade)));
}

export function avaliarCriterio(criterio: CriterioPrato, noPrato: AlimentoPrato[]): StatusCriterio {
  const quantidade = noPrato.filter((a) => criterio.grupos.includes(a.grupo)).length;
  const minimo = criterio.minimo ?? 0;
  const excedeu = criterio.maximo !== undefined && quantidade > criterio.maximo;
  return {
    criterio,
    quantidade,
    atendido: quantidade >= minimo && !excedeu,
    excedeu,
    soLimite: criterio.minimo === undefined || criterio.minimo === 0,
  };
}

export function avaliarPrato(
  noPrato: AlimentoPrato[],
  criterios: CriterioPrato[],
  minimoItens: number = MINIMO_ITENS_PADRAO
): AvaliacaoPrato {
  const status = criterios.map((c) => avaliarCriterio(c, noPrato));
  const criteriosOk = status.every((s) => s.atendido);
  return {
    status,
    totalItens: noPrato.length,
    criteriosOk,
    completo: criteriosOk && noPrato.length >= minimoItens,
  };
}

/**
 * Posições dos lugares do prato, em coordenadas de -1 a 1 (centro = 0,0),
 * distribuídos em círculo a partir do topo.
 */
export function posicoesDosSlots(capacidade: number): { x: number; y: number }[] {
  const n = normalizarCapacidade(capacidade);
  return Array.from({ length: n }, (_, i) => {
    const angulo = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: Math.cos(angulo), y: Math.sin(angulo) };
  });
}

/** Primeiro lugar vazio do prato (ou null se estiver cheio). */
export function primeiroSlotLivre(ocupados: number[], capacidade: number): number | null {
  const n = normalizarCapacidade(capacidade);
  for (let i = 0; i < n; i++) {
    if (!ocupados.includes(i)) return i;
  }
  return null;
}
