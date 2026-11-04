// src/features/adolescente/home/hooks/useBoasVindas.ts
//
// Decide se a Home deve mostrar as boas-vindas do primeiro acesso.
//
// Fluxo: conta criada há pouco (ehPrimeiroAcessoRecente) → gate local "uma vez" → marca como
// visto ANTES de mostrar (a Home remonta com frequência; marcar só no fechamento reabriria o
// modal em loop, como nas outras celebrações) → libera a mensagem.
//
// `podeMostrar` deixa a Home segurar a mensagem enquanto outra animação cheia está na tela.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatarDataISO } from '../../../../shared/utils/data';
import { ehPrimeiroAcessoRecente, montarMensagemBoasVindas, type MensagemBoasVindas } from '../utils/boasVindas';
import { jaViuBoasVindas, marcarBoasVindasVistas } from '../utils/boasVindasStorage';

type Params = {
  userId: string | null;
  /** `session.user.created_at` (timestamp com fuso); null enquanto não há sessão */
  contaCriadaEm: string | null | undefined;
  /** dia local de hoje, AAAA-MM-DD (o mesmo `hojeISO` da Home) */
  hojeISO: string | null;
  primeiroNome: string | null;
  /** false enquanto outra animação cheia está na tela ou sendo preparada */
  podeMostrar: boolean;
};

type Retorno = {
  visivel: boolean;
  /** há uma mensagem liberada e ainda não fechada (mesmo que esperando `podeMostrar`) */
  pendente: boolean;
  mensagem: MensagemBoasVindas | null;
  fechar: () => void;
};

export function useBoasVindas({ userId, contaCriadaEm, hojeISO, primeiroNome, podeMostrar }: Params): Retorno {
  const [liberada, setLiberada] = useState(false);
  const [fechada, setFechada] = useState(false);
  const emAndamentoRef = useRef(false);

  // created_at tem fuso: converte para o dia LOCAL antes de comparar com o "hoje" da Home
  const recente = useMemo(() => {
    if (!contaCriadaEm || !hojeISO) return false;
    const data = new Date(contaCriadaEm);
    if (Number.isNaN(data.getTime())) return false;
    return ehPrimeiroAcessoRecente(formatarDataISO(data), hojeISO);
  }, [contaCriadaEm, hojeISO]);

  useEffect(() => {
    if (!userId || !recente || liberada || emAndamentoRef.current) return;

    let cancelado = false;
    emAndamentoRef.current = true;

    (async () => {
      try {
        if (await jaViuBoasVindas(userId)) return;
        if (cancelado) return;
        await marcarBoasVindasVistas(userId);
        if (!cancelado) setLiberada(true);
      } finally {
        emAndamentoRef.current = false;
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [userId, recente, liberada]);

  const mensagem = useMemo(() => (liberada ? montarMensagemBoasVindas(primeiroNome) : null), [liberada, primeiroNome]);
  const fechar = useCallback(() => setFechada(true), []);

  const pendente = !!mensagem && !fechada;
  return { visivel: pendente && podeMostrar, pendente, mensagem, fechar };
}
