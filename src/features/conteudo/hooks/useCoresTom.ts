// src/features/conteudo/hooks/useCoresTom.ts
// Cores dos selos de status do fluxo de conteúdo (rascunho, em espera, aprovado, publicado, rejeitado),
// no tema claro ou escuro.
import { useMemo } from 'react';
import { useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import type { TomStatus } from '../utils/fluxo';

export function useCoresTom(): Record<TomStatus, { fundo: string; texto: string }> {
  const { tema } = useTemaPainel();
  return useMemo(
    () => ({
      neutro: tema.selos.neutro,
      espera: tema.selos.aviso,
      ok: tema.selos.ok,
      publicado: { fundo: tema.botaoFundo, texto: tema.botaoTexto },
      erro: tema.selos.erro,
    }),
    [tema]
  );
}
