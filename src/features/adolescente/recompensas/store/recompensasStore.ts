// src/features/adolescente/recompensas/store/recompensasStore.ts
//
// Fila de recompensas a comemorar (cartas, insígnias, marcos, conquistas).
// Quem descobre uma recompensa nova chama `enfileirar`; o <RecompensasHost /> mostra uma
// por vez. Telas com uma celebração própria (ex.: a de sequência na Home) chamam `pausar`
// enquanto ela está na tela, pra duas animações nunca ficarem uma em cima da outra.
import { create } from 'zustand';
import type { Recompensa } from '../utils/recompensas';

type Estado = {
  fila: Recompensa[];
  /** chaves já mostradas/dispensadas nesta sessão: nunca voltam pra fila */
  vistas: string[];
  /** motivos de pausa ativos; com qualquer um, nada é exibido */
  pausas: string[];
  enfileirar: (novas: Recompensa[]) => void;
  /** tira a recompensa da frente da fila (já foi vista) */
  avancar: () => void;
  /** descarta tudo que está na fila (o aluno pulou) e devolve o que foi descartado */
  limpar: () => Recompensa[];
  pausar: (motivo: string) => void;
  retomar: (motivo: string) => void;
};

export const useRecompensasStore = create<Estado>()((set, get) => ({
  fila: [],
  vistas: [],
  pausas: [],

  enfileirar: (novas) =>
    set((s) => {
      const conhecidas = new Set([...s.vistas, ...s.fila.map((r) => r.chave)]);
      const aAdicionar: Recompensa[] = [];
      for (const r of novas) {
        if (conhecidas.has(r.chave)) continue;
        conhecidas.add(r.chave);
        aAdicionar.push(r);
      }
      return aAdicionar.length ? { fila: [...s.fila, ...aAdicionar] } : s;
    }),

  avancar: () =>
    set((s) => {
      const [atual, ...resto] = s.fila;
      if (!atual) return s;
      return { fila: resto, vistas: [...s.vistas, atual.chave] };
    }),

  limpar: () => {
    const descartadas = get().fila;
    set((s) => ({ fila: [], vistas: [...s.vistas, ...descartadas.map((r) => r.chave)] }));
    return descartadas;
  },

  pausar: (motivo) => set((s) => (s.pausas.includes(motivo) ? s : { pausas: [...s.pausas, motivo] })),
  retomar: (motivo) => set((s) => (s.pausas.includes(motivo) ? { pausas: s.pausas.filter((m) => m !== motivo) } : s)),
}));
