// src/features/adolescente/social/hooks/useSituacaoModeracao.ts
// Carrega a situação de moderação ao focar a tela. Falha em silêncio (migration ainda não rodada,
// sem rede): nunca atrapalha a Home nem o Social.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { buscarSituacaoModeracao, marcarAvisoVisto } from '../services/moderacaoService';
import type { SituacaoModeracao } from '../utils/moderacao';

const VAZIA: SituacaoModeracao = { restritoAte: null, aviso: null };

export function useSituacaoModeracao() {
  const [situacao, setSituacao] = useState<SituacaoModeracao>(VAZIA);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      buscarSituacaoModeracao()
        .then((s) => ativo && setSituacao(s))
        .catch(() => undefined);
      return () => { ativo = false; };
    }, [])
  );

  const dispensarAviso = useCallback(async () => {
    const id = situacao.aviso?.id;
    setSituacao((s) => ({ ...s, aviso: null }));
    if (id) await marcarAvisoVisto(id).catch(() => undefined);
  }, [situacao.aviso?.id]);

  return { situacao, dispensarAviso };
}
