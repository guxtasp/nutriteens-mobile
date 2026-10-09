// src/features/adolescente/social/hooks/useChamaDupla.ts
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import {
  convidarParaChamaDupla,
  encerrarChamaDupla,
  listarChamasDupla,
  marcarAvisoChamaVisto,
  responderConviteChamaDupla,
} from '../services/chamaDuplaService';
import { reagendarLembreteChama } from '../services/lembreteChamaService';
import { ChamaDupla, mensagemConvite } from '../utils/chamaDupla';

export function useChamaDupla() {
  const { userId } = useAuth();
  const [chamas, setChamas] = useState<ChamaDupla[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    try {
      const lista = await listarChamasDupla();
      setChamas(lista);
      void reagendarLembreteChama(userId, lista.find((c) => c.situacao === 'ativa') ?? null);
    } catch {
      // mantém o último estado; a tela de amigos continua funcionando
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const convidar = useCallback(
    async (amizadeId: string, apelido?: string) => {
      try {
        const r = await convidarParaChamaDupla(amizadeId);
        if (r === 'enviado') await recarregar();
        return { ok: r === 'enviado', mensagem: mensagemConvite(r, apelido) };
      } catch {
        return { ok: false, mensagem: 'Algo deu errado. Tente de novo daqui a pouco.' };
      }
    },
    [recarregar]
  );

  const responder = useCallback(
    async (id: string, aceitar: boolean) => {
      const ok = await responderConviteChamaDupla(id, aceitar);
      await recarregar();
      return ok;
    },
    [recarregar]
  );

  const encerrar = useCallback(
    async (id: string) => {
      const ok = await encerrarChamaDupla(id);
      await recarregar();
      return ok;
    },
    [recarregar]
  );

  const dispensarAviso = useCallback(
    async (id: string) => {
      setChamas((atual) => atual.map((c) => (c.id === id ? { ...c, aviso: null } : c)));
      await marcarAvisoChamaVisto(id);
    },
    []
  );

  return {
    ativa: chamas.find((c) => c.situacao === 'ativa') ?? null,
    recebidos: chamas.filter((c) => c.situacao === 'recebido'),
    enviados: chamas.filter((c) => c.situacao === 'enviado'),
    chamas,
    carregando,
    recarregar,
    convidar,
    responder,
    encerrar,
    dispensarAviso,
  };
}
