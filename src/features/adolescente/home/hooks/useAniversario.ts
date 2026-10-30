// src/features/adolescente/home/hooks/useAniversario.ts
//
// Decide se a Home deve mostrar a mensagem de feliz aniversário do Bróxis.
//
// Fluxo: lê `profiles.data_nascimento` do próprio usuário → regra pura (analisarAniversario)
// → gate local "uma vez por ano" → marca como celebrado → libera a mensagem.
//
// Igual à celebração da sequência, a marcação de "já celebrei" acontece ANTES de mostrar:
// a Home remonta com frequência, e marcar só no fechamento faria o modal reabrir em loop.
//
// `podeMostrar` deixa a Home segurar a mensagem enquanto outra animação cheia está na tela
// (celebração da sequência, aviso de perda): a mensagem fica pendente e aparece quando
// as outras terminarem, sem duas animações juntas.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { analisarAniversario, montarMensagemAniversario, type MensagemAniversario } from '../utils/aniversario';
import { jaCelebrouAniversario, marcarAniversarioCelebrado } from '../utils/aniversarioStorage';

type Params = {
  userId: string | null;
  /** dia local de hoje, AAAA-MM-DD (o mesmo `hojeISO` da Home) */
  hojeISO: string | null;
  /** primeiro nome, para o título da mensagem */
  primeiroNome: string | null;
  /** false enquanto outra animação cheia está na tela ou sendo preparada */
  podeMostrar: boolean;
};

type Retorno = {
  /** o modal deve estar na tela agora */
  visivel: boolean;
  /** há uma mensagem liberada e ainda não fechada (mesmo que esperando `podeMostrar`) */
  pendente: boolean;
  mensagem: MensagemAniversario | null;
  fechar: () => void;
};

export function useAniversario({ userId, hojeISO, primeiroNome, podeMostrar }: Params): Retorno {
  const [dataNascimento, setDataNascimento] = useState<string | null>(null);
  const [liberada, setLiberada] = useState<{ ano: number; diasDeAtraso: number } | null>(null);
  const [fechada, setFechada] = useState(false);
  const emAndamentoRef = useRef(false);

  // 1) data de nascimento do próprio usuário (a RLS de profiles já a libera para o perfil)
  useEffect(() => {
    if (!userId) return;
    let ativo = true;

    supabase
      .from('profiles')
      .select('data_nascimento')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          // sem a data, simplesmente não há mensagem: nada a mostrar nem a quebrar
          console.warn('Erro ao carregar data de nascimento:', error.message);
          return;
        }
        console.log('[ANIV] data_nascimento lida:', data?.data_nascimento ?? null); // TEMP
        setDataNascimento(data?.data_nascimento ?? null);
      });

    return () => {
      ativo = false;
    };
  }, [userId]);

  // 2) é aniversário (ou atrasado, dentro da janela) e ainda não celebrei neste ano?
  const situacao = useMemo(
    () => (hojeISO ? analisarAniversario(dataNascimento, hojeISO) : ({ celebrar: false } as const)),
    [dataNascimento, hojeISO],
  );

  useEffect(() => {
    console.log('[ANIV] checagem', { userId: !!userId, hojeISO, dataNascimento, situacao, liberada, podeMostrar }); // TEMP
    if (!userId || !situacao.celebrar || liberada || emAndamentoRef.current) return;

    let cancelado = false;
    emAndamentoRef.current = true;

    (async () => {
      try {
        const jaFoi = await jaCelebrouAniversario(userId, situacao.ano);
        console.log('[ANIV] gate já celebrou?', jaFoi); // TEMP
        if (jaFoi) return;
        if (cancelado) return;

        await marcarAniversarioCelebrado(userId, situacao.ano);
        if (!cancelado) setLiberada({ ano: situacao.ano, diasDeAtraso: situacao.diasDeAtraso });
      } finally {
        emAndamentoRef.current = false;
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [userId, situacao, liberada]);

  const mensagem = useMemo(
    () =>
      liberada && userId
        ? montarMensagemAniversario(primeiroNome, liberada.diasDeAtraso, `${userId}:${liberada.ano}`)
        : null,
    [liberada, userId, primeiroNome],
  );

  const fechar = useCallback(() => setFechada(true), []);

  const pendente = !!mensagem && !fechada;
  return { visivel: pendente && podeMostrar, pendente, mensagem, fechar };
}
