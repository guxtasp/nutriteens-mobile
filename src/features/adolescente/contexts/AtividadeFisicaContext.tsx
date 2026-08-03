import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ItemCarrinho } from '../types/atividadeFisica';
import { horarioAgora, registrarAtividades } from '../services/atividadeService';
import { formatarDataISO } from '../../../shared/utils/data';
import { useAuth } from '../../../shared/contexts/AuthContext';

const MAX_BUSCAS_RECENTES = 5;

interface AtividadeFisicaContextValue {
  carrinho: ItemCarrinho[];
  adicionarAoCarrinho: (nome: string, duracaoMinutos: number) => void;
  removerDoCarrinho: (idLocal: string) => void;
  limparCarrinho: () => void;
  buscasRecentes: string[];
  registrarBuscaRecente: (termo: string) => void;
  registrarCarrinho: () => Promise<number>;
  enviando: boolean;
}

const AtividadeFisicaContext = createContext<AtividadeFisicaContextValue | undefined>(undefined);

export function AtividadeFisicaProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [buscasRecentes, setBuscasRecentes] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const adicionarAoCarrinho = useCallback((nome: string, duracaoMinutos: number) => {
    const novoItem: ItemCarrinho = {
      idLocal: `${Date.now()}-${Math.random()}`,
      nomeAtividade: nome,
      duracaoMinutos,
      horarioRegistro: horarioAgora(),
    };
    setCarrinho((atual) => [...atual, novoItem]);
  }, []);

  const removerDoCarrinho = useCallback((idLocal: string) => {
    setCarrinho((atual) => atual.filter((item) => item.idLocal !== idLocal));
  }, []);

  const limparCarrinho = useCallback(() => setCarrinho([]), []);

  const registrarBuscaRecente = useCallback((termo: string) => {
    const termoLimpo = termo.trim();
    if (!termoLimpo) return;
    setBuscasRecentes((atual) => {
      const semDuplicata = atual.filter((t) => t.toLowerCase() !== termoLimpo.toLowerCase());
      return [termoLimpo, ...semDuplicata].slice(0, MAX_BUSCAS_RECENTES);
    });
  }, []);

  const registrarCarrinho = useCallback(async (): Promise<number> => {
    if (carrinho.length === 0 || enviando || !userId) return 0;
    setEnviando(true);
    try {
      await registrarAtividades({
        userId,
        data: formatarDataISO(new Date()),
        itens: carrinho.map((item) => ({
          nomeAtividade: item.nomeAtividade,
          duracaoMinutos: item.duracaoMinutos,
          horarioRegistro: item.horarioRegistro,
        })),
      });
      const quantidade = carrinho.length;
      setCarrinho([]);
      return quantidade;
    } finally {
      setEnviando(false);
    }
  }, [carrinho, enviando, userId]);

  return (
    <AtividadeFisicaContext.Provider
      value={{
        carrinho,
        adicionarAoCarrinho,
        removerDoCarrinho,
        limparCarrinho,
        buscasRecentes,
        registrarBuscaRecente,
        registrarCarrinho,
        enviando,
      }}
    >
      {children}
    </AtividadeFisicaContext.Provider>
  );
}

export function useAtividadeFisica() {
  const ctx = useContext(AtividadeFisicaContext);
  if (!ctx) {
    throw new Error('useAtividadeFisica precisa ser usado dentro de <AtividadeFisicaProvider>');
  }
  return ctx;
}