// src/features/adolescente/alimentacao/contexts/AlimentacaoContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alimento, TipoRefeicao, registrarRefeicao } from '../services/alimentacaoService';
import type { FeedbackRefeicao } from '../utils/regraFeedbackRefeicao';
import { ItemCarrinhoAlimento } from '../types/alimentacao';
import { formatarDataISO } from '../../../../shared/utils/data';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { tocarSom } from '../../../../shared/audio/sons';

interface AlimentacaoContextValue {
  carrinho: ItemCarrinhoAlimento[];
  adicionarAoCarrinho: (alimento: Alimento) => void;
  incrementarItem: (alimentoId: string) => void;
  decrementarItem: (alimentoId: string) => void;
  removerDoCarrinho: (alimentoId: string) => void;
  limparCarrinho: () => void;
  registrarCarrinho: (tipo: TipoRefeicao) => Promise<({ quantidade: number } & FeedbackRefeicao) | null>;
  enviando: boolean;
}

const AlimentacaoContext = createContext<AlimentacaoContextValue | undefined>(undefined);

export function AlimentacaoProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [carrinho, setCarrinho] = useState<ItemCarrinhoAlimento[]>([]);
  const [enviando, setEnviando] = useState(false);

  // toca em "+" num alimento já no carrinho -> incrementa em vez de duplicar linha
  const adicionarAoCarrinho = useCallback((alimento: Alimento) => {
    // o som fica fora do setCarrinho: o atualizador pode rodar mais de uma vez
    tocarSom('pop');
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.alimento.id === alimento.id);
      if (existente) {
        return atual.map((item) =>
          item.alimento.id === alimento.id ? { ...item, quantidade: item.quantidade + 1 } : item
        );
      }
      return [...atual, { alimento, quantidade: 1 }];
    });
  }, []);

  const incrementarItem = useCallback((alimentoId: string) => {
    tocarSom('pop');
    setCarrinho((atual) =>
      atual.map((item) => (item.alimento.id === alimentoId ? { ...item, quantidade: item.quantidade + 1 } : item))
    );
  }, []);

  const decrementarItem = useCallback((alimentoId: string) => {
    setCarrinho((atual) =>
      atual
        .map((item) => (item.alimento.id === alimentoId ? { ...item, quantidade: item.quantidade - 1 } : item))
        .filter((item) => item.quantidade > 0)
    );
  }, []);

  const removerDoCarrinho = useCallback((alimentoId: string) => {
    setCarrinho((atual) => atual.filter((item) => item.alimento.id !== alimentoId));
  }, []);

  const limparCarrinho = useCallback(() => setCarrinho([]), []);

  const registrarCarrinho = useCallback(
    async (tipo: TipoRefeicao) => {
      if (carrinho.length === 0 || enviando || !userId) return null;
      setEnviando(true);
      try {
        const resultado = await registrarRefeicao({
          userId,
          dataISO: formatarDataISO(new Date()),
          tipo,
          itens: carrinho,
        });
        const quantidade = carrinho.length;
        setCarrinho([]);
        tocarSom('registro');
        const { refeicaoId, ...feedback } = resultado;
        return { quantidade, ...feedback };
      } finally {
        setEnviando(false);
      }
    },
    [carrinho, enviando, userId]
  );

  return (
    <AlimentacaoContext.Provider
      value={{
        carrinho,
        adicionarAoCarrinho,
        incrementarItem,
        decrementarItem,
        removerDoCarrinho,
        limparCarrinho,
        registrarCarrinho,
        enviando,
      }}
    >
      {children}
    </AlimentacaoContext.Provider>
  );
}

export function useAlimentacao() {
  const ctx = useContext(AlimentacaoContext);
  if (!ctx) {
    throw new Error('useAlimentacao precisa ser usado dentro de <AlimentacaoProvider>');
  }
  return ctx;
}