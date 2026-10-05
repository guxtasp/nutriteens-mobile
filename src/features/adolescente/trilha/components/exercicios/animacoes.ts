// src/features/adolescente/trilha/components/exercicios/animacoes.ts
//
// Valores compartilhados pelas animações dos exercícios, pra todos terem o
// mesmo "jeito". Ajustou aqui, mudou em todos.

// balanço de erro (translateX em keyframes)
export const BALANCO = [0, -9, 9, -6, 6, 0];

// pulinho de acerto / seleção (scale em keyframes)
export const PULINHO = [1, 1.05, 1];

// atraso da entrada em cascata: o item `indice` começa um pouco depois do anterior
export function atrasoCascata(indice: number, base = 60, passo = 60): number {
  return base + indice * passo;
}