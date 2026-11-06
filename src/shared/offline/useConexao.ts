// src/shared/offline/useConexao.ts
import { useSyncExternalStore } from 'react';
import { assinarConexao, estaOnline } from './conexao';

/** true = o servidor está respondendo. Atualiza sozinho quando a internet cai ou volta. */
export function useConexao(): boolean {
  return useSyncExternalStore(assinarConexao, estaOnline, estaOnline);
}
