// src/features/adolescente/types/atividadeFisica.ts
export type ItemCarrinho = {
  idLocal: string; // só pra key da lista, gerado no client
  nomeAtividade: string;
  duracaoMinutos: number;
  horarioRegistro: string; // HH:MM:SS, capturado no momento em que foi adicionado
};