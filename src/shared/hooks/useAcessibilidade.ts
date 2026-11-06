// src/shared/hooks/useAcessibilidade.ts
import { useSyncExternalStore } from 'react';
import {
  assinarPreferencias,
  obterPreferencias,
  type PreferenciasAcessibilidade,
} from '../state/acessibilidade';

/** Preferências de acessibilidade do app; a tela se atualiza sozinha quando mudam. */
export function useAcessibilidade(): PreferenciasAcessibilidade {
  return useSyncExternalStore(assinarPreferencias, obterPreferencias, obterPreferencias);
}
