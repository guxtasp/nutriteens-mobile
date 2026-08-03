// src/features/adolescente/types/alimentacao.ts
import type { Alimento } from '../services/alimentacaoService';

export type ItemCarrinhoAlimento = {
  alimento: Alimento;
  quantidade: number;
};