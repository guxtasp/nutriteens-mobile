// src/shared/offline/OfflineContext.tsx
// Dono da fila offline na interface: guarda registros feitos sem internet e os
// envia sozinho quando a conexão volta (ao reabrir o app, a cada 30 s e logo
// após um registro). Não depende de biblioteca de detecção de rede: a própria
// tentativa de envio é o teste — se falhar por rede, tenta de novo depois.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { enfileirar, lerFila, pendentesParaEnviar, comProblema, type NovaOperacao, type OperacaoOffline } from './filaOffline';
import { sincronizarFila } from './sincronizador';
import { criarExecutores } from './executoresOffline';
import { ehErroDeRede } from './erroRede';

const INTERVALO_SYNC_MS = 30_000;

type Valor = {
  /** registros guardados no aparelho, ainda não enviados */
  pendentes: number;
  /** registros que o servidor recusou várias vezes (ficam guardados) */
  comProblema: number;
  sincronizando: boolean;
  /** sobe a cada rodada que enviou algo: telas usam para recarregar */
  versaoSync: number;
  /** tenta executar online; se faltar internet, guarda na fila. true = foi guardado para depois */
  executarOuGuardar: (nova: NovaOperacao, executarOnline: () => Promise<void>) => Promise<boolean>;
  /** guarda direto na fila (quando o envio online já falhou por falta de internet) */
  guardar: (nova: NovaOperacao) => Promise<void>;
  sincronizarAgora: () => Promise<void>;
  /** lê a fila atual (ex.: somar água ainda não enviada ao total do dia) */
  lerPendentes: () => Promise<OperacaoOffline[]>;
};

const OfflineContext = createContext<Valor | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { userId } = useAuth();
  const [pendentes, setPendentes] = useState(0);
  const [comProblemaN, setComProblemaN] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [versaoSync, setVersaoSync] = useState(0);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const atualizarContagem = useCallback(async () => {
    if (!userId) {
      setPendentes(0);
      setComProblemaN(0);
      return;
    }
    const fila = await lerFila(userId);
    if (!montado.current) return;
    setPendentes(pendentesParaEnviar(fila).length);
    setComProblemaN(comProblema(fila).length);
  }, [userId]);

  const sincronizarAgora = useCallback(async () => {
    if (!userId) return;
    const fila = await lerFila(userId);
    if (pendentesParaEnviar(fila).length === 0) return;

    setSincronizando(true);
    try {
      const resultado = await sincronizarFila(userId, criarExecutores(userId));
      if (resultado.enviadas > 0 && montado.current) setVersaoSync((v) => v + 1);
    } catch (erro) {
      console.error('Erro ao sincronizar registros offline:', erro);
    } finally {
      if (montado.current) setSincronizando(false);
      await atualizarContagem();
    }
  }, [userId, atualizarContagem]);

  // ao entrar / trocar de usuário: conta o que ficou guardado e tenta enviar
  useEffect(() => {
    void atualizarContagem().then(sincronizarAgora);
  }, [atualizarContagem, sincronizarAgora]);

  // ao voltar para o app e a cada 30 s
  useEffect(() => {
    if (!userId) return;
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void sincronizarAgora();
    });
    const timer = setInterval(() => void sincronizarAgora(), INTERVALO_SYNC_MS);
    return () => {
      assinatura.remove();
      clearInterval(timer);
    };
  }, [userId, sincronizarAgora]);

  const executarOuGuardar = useCallback(
    async (nova: NovaOperacao, executarOnline: () => Promise<void>): Promise<boolean> => {
      try {
        await executarOnline();
        return false;
      } catch (erro) {
        if (!userId || !ehErroDeRede(erro)) throw erro;
        await enfileirar(userId, nova);
        await atualizarContagem();
        return true;
      }
    },
    [userId, atualizarContagem]
  );

  const guardar = useCallback(
    async (nova: NovaOperacao) => {
      if (!userId) return;
      await enfileirar(userId, nova);
      await atualizarContagem();
    },
    [userId, atualizarContagem]
  );

  const lerPendentes = useCallback(async () => (userId ? lerFila(userId) : []), [userId]);

  const valor = useMemo<Valor>(
    () => ({ pendentes, comProblema: comProblemaN, sincronizando, versaoSync, executarOuGuardar, guardar, sincronizarAgora, lerPendentes }),
    [pendentes, comProblemaN, sincronizando, versaoSync, executarOuGuardar, guardar, sincronizarAgora, lerPendentes]
  );

  return <OfflineContext.Provider value={valor}>{children}</OfflineContext.Provider>;
}

export function useOffline(): Valor {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline precisa ser usado dentro de <OfflineProvider>');
  return ctx;
}
