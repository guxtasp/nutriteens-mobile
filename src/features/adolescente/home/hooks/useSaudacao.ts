// src/features/adolescente/hooks/useSaudacao.ts
import { useMemo } from 'react';
import { sortearSaudacao } from '../../../../shared/utils/saudacao';

export function useSaudacao() {
  // useMemo com array vazio: sorteia uma vez só, na montagem da tela
  return useMemo(() => sortearSaudacao(), []);
}