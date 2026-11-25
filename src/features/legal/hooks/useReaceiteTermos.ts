// src/features/legal/hooks/useReaceiteTermos.ts
//
// Descobre se quem já tem conta ainda não aceitou a versão atual dos termos (VERSAO_TERMOS) e
// grava o novo aceite. Confere uma vez por sessão (o host fica montado o tempo todo). Se a
// consulta falhar (sem internet), não mostra nada: o reaceite nunca trava o app offline e volta
// a ser conferido na próxima abertura.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ehErroDeRede } from '../../../shared/offline/erroRede';
import { jaAceitouVersao, registrarAceiteTermos } from '../services/consentimentoService';

export function useReaceiteTermos(userId: string | null, ativo: boolean) {
  const [precisaReaceite, setPrecisaReaceite] = useState(false);
  const [dispensadoNaSessao, setDispensadoNaSessao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const conferidoPara = useRef<string | null>(null);

  useEffect(() => {
    if (!ativo || !userId || conferidoPara.current === userId) return;
    conferidoPara.current = userId;
    let vivo = true;
    jaAceitouVersao(userId)
      .then((aceitou) => vivo && setPrecisaReaceite(!aceitou))
      .catch((e) => {
        // sem internet ou erro do servidor: tenta de novo na próxima sessão
        console.warn('Não deu para conferir o aceite dos termos:', e);
      });
    return () => {
      vivo = false;
    };
  }, [ativo, userId]);

  const aceitar = useCallback(async () => {
    if (!userId || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await registrarAceiteTermos(userId);
      setPrecisaReaceite(false);
    } catch (e) {
      console.error('Erro ao registrar o novo aceite dos termos:', e);
      setErro(
        ehErroDeRede(e)
          ? 'Parece que a internet caiu. Tenta de novo daqui a pouco.'
          : 'Não deu para salvar agora. Tenta de novo.',
      );
    } finally {
      setSalvando(false);
    }
  }, [userId, salvando]);

  /** Fecha até a próxima abertura do app (sem aceitar, o modal volta depois). */
  const dispensar = useCallback(() => setDispensadoNaSessao(true), []);

  return { precisaReaceite, dispensadoNaSessao, salvando, erro, aceitar, dispensar };
}
