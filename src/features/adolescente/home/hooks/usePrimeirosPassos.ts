// src/features/adolescente/home/hooks/usePrimeirosPassos.ts
//
// Estado do cartão "Primeiros passos" da Home.
//
// Aparece quando: conta recente (JANELA_PRIMEIROS_PASSOS_DIAS) + não dispensado + ainda há passo
// pendente. Quando a pessoa termina tudo, o cartão fica no modo "parabéns" até ela dispensar
// (ou até o próximo foco da Home, quando o "visto" já foi gravado e ele some de vez).
//
// Recarrega a cada foco da Home e quando registros feitos offline são enviados, igual ao resto
// da Home. Nunca derruba a Home: erro só deixa o cartão escondido.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useOffline } from '../../../../shared/offline/OfflineContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { buscarPrimeirosPassosFeitos } from '../services/primeirosPassosService';
import {
  dentroDaJanelaPrimeirosPassos,
  NENHUM_PASSO_FEITO,
  resumirPrimeirosPassos,
  type PassosFeitos,
  type ResumoPrimeirosPassos,
} from '../utils/primeirosPassos';
import {
  dispensarPrimeirosPassos,
  jaDispensouPrimeirosPassos,
  jaViuConclusaoPrimeirosPassos,
  marcarConclusaoPrimeirosPassosVista,
} from '../utils/primeirosPassosStorage';

type Params = {
  userId: string | null;
  /** `session.user.created_at` (timestamp com fuso) */
  contaCriadaEm: string | null | undefined;
  hojeISO: string | null;
};

type Retorno = {
  /** o cartão deve aparecer na Home */
  visivel: boolean;
  resumo: ResumoPrimeirosPassos;
  dispensar: () => void;
};

export function usePrimeirosPassos({ userId, contaCriadaEm, hojeISO }: Params): Retorno {
  const [feitos, setFeitos] = useState<PassosFeitos>(NENHUM_PASSO_FEITO);
  const [carregado, setCarregado] = useState(false);
  const [dispensado, setDispensado] = useState(true); // começa escondido até ler a preferência
  const [conclusaoJaVista, setConclusaoJaVista] = useState(false);
  const { versaoSync } = useOffline();

  // created_at tem fuso: converte para o dia LOCAL antes de comparar com o "hoje" da Home
  const naJanela = useMemo(() => {
    if (!contaCriadaEm) return false;
    const data = new Date(contaCriadaEm);
    if (Number.isNaN(data.getTime())) return false;
    return dentroDaJanelaPrimeirosPassos(formatarDataISO(data), hojeISO);
  }, [contaCriadaEm, hojeISO]);

  const carregar = useCallback(async () => {
    if (!userId || !naJanela) return;
    try {
      const [jaDispensou, jaViuConclusao] = await Promise.all([
        jaDispensouPrimeirosPassos(userId),
        jaViuConclusaoPrimeirosPassos(userId),
      ]);
      setDispensado(jaDispensou);
      setConclusaoJaVista(jaViuConclusao);
      if (jaDispensou || jaViuConclusao) return; // nem gasta rede
      setFeitos(await buscarPrimeirosPassosFeitos(userId));
      setCarregado(true);
    } catch (erro) {
      console.warn('Primeiros passos indisponíveis:', erro);
    }
  }, [userId, naJanela]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  useEffect(() => {
    if (versaoSync > 0) void carregar();
  }, [versaoSync, carregar]);

  const resumo = useMemo(() => resumirPrimeirosPassos(feitos), [feitos]);

  // quem terminou tudo vê o "parabéns" nesta visita; ao voltar à Home o cartão já não existe
  const gravouConclusaoRef = useRef(false);
  useEffect(() => {
    if (!userId || !carregado || !resumo.completo || gravouConclusaoRef.current) return;
    gravouConclusaoRef.current = true;
    void marcarConclusaoPrimeirosPassosVista(userId);
  }, [userId, carregado, resumo.completo]);

  const dispensar = useCallback(() => {
    setDispensado(true);
    if (userId) void dispensarPrimeirosPassos(userId);
  }, [userId]);

  // `conclusaoJaVista` só esconde em visitas posteriores: na visita em que o último passo foi
  // cumprido, `gravouConclusaoRef` já é true mas o estado abaixo ainda é o lido no começo do foco
  const visivel = naJanela && carregado && !dispensado && !conclusaoJaVista;
  return { visivel, resumo, dispensar };
}
