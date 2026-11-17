// src/features/adolescente/home/hooks/useMissaoDoDiaTela.ts
//
// Decide se a Home deve abrir a tela "Missão do dia" (uma vez por dia).
//
// Fluxo: missão de hoje carregada e ainda não cumprida → gate local "uma vez por dia" → quando
// `podeMostrar` libera (nenhuma outra animação cheia na fila), marca como mostrada ANTES de
// exibir — a Home remonta com frequência, e marcar só no fechamento reabriria a tela em loop,
// como nas outras celebrações — e abre.
//
// Fica `pendente` enquanto espera a vez; a Home usa isso para segurar a fila de recompensas.
import { useCallback, useEffect, useRef, useState } from 'react';
import { missaoDoDiaElegivel } from '../utils/missaoDoDiaTela';
import { jaMostrouMissaoDoDia, marcarMissaoDoDiaMostrada } from '../utils/missaoDoDiaTelaStorage';

type Params = {
  userId: string | null;
  /** dia local de hoje, AAAA-MM-DD (o mesmo `hojeISO` da Home) */
  hojeISO: string | null;
  /** id da missão de hoje (muda no dia seguinte); null se ainda não há missão */
  missaoId: string | null;
  missaoConcluida: boolean;
  dadosCarregados: boolean;
  /** false enquanto outra animação cheia está na tela ou sendo preparada */
  podeMostrar: boolean;
};

type Retorno = {
  visivel: boolean;
  /** liberada e ainda não fechada (mesmo que esperando `podeMostrar`) */
  pendente: boolean;
  fechar: () => void;
};

export function useMissaoDoDiaTela({ userId, hojeISO, missaoId, missaoConcluida, dadosCarregados, podeMostrar }: Params): Retorno {
  // dia para o qual a tela já foi liberada/fechada nesta montagem (um novo dia reabre o ciclo)
  const [liberadaNoDia, setLiberadaNoDia] = useState<string | null>(null);
  const [visivelNoDia, setVisivelNoDia] = useState<string | null>(null);
  const [fechadaNoDia, setFechadaNoDia] = useState<string | null>(null);
  const checandoRef = useRef(false);

  const elegivel = missaoDoDiaElegivel({ dadosCarregados, temMissao: !!missaoId, concluida: missaoConcluida });

  // 1) lê o gate (sem marcar): só então a tela passa a ser "pendente"
  useEffect(() => {
    if (!userId || !hojeISO || !elegivel || liberadaNoDia === hojeISO || checandoRef.current) return;
    let cancelado = false;
    checandoRef.current = true;

    (async () => {
      try {
        const jaMostrou = await jaMostrouMissaoDoDia(userId, hojeISO);
        if (cancelado || jaMostrou) return;
        setLiberadaNoDia(hojeISO);
      } finally {
        checandoRef.current = false;
      }
    })();

    return () => {
      cancelado = true;
      checandoRef.current = false;
    };
  }, [userId, hojeISO, elegivel, liberadaNoDia]);

  const liberada = !!hojeISO && liberadaNoDia === hojeISO && fechadaNoDia !== hojeISO;

  // 2) na vez dela: marca o gate ANTES de abrir
  useEffect(() => {
    if (!userId || !hojeISO || !liberada || !podeMostrar || visivelNoDia === hojeISO) return;
    let cancelado = false;
    (async () => {
      await marcarMissaoDoDiaMostrada(userId, hojeISO);
      if (!cancelado) setVisivelNoDia(hojeISO);
    })();
    return () => {
      cancelado = true;
    };
  }, [userId, hojeISO, liberada, podeMostrar, visivelNoDia]);

  const fechar = useCallback(() => {
    if (hojeISO) setFechadaNoDia(hojeISO);
  }, [hojeISO]);

  return {
    visivel: liberada && !!hojeISO && visivelNoDia === hojeISO,
    pendente: liberada,
    fechar,
  };
}
