// src/features/adolescente/perfil/hooks/useExtratoXp.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { buscarExtratoXp } from '../services/extratoXpService';
import {
  agruparPorDia,
  filtrarLancamentos,
  resumirPeriodos,
  resumoPodeEstarIncompleto,
  type FiltroExtrato,
  type LancamentoXp,
} from '../utils/extratoXp';

export function useExtratoXp() {
  const { userId } = useAuth();
  const [itens, setItens] = useState<LancamentoXp[]>([]);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(false);
  const [filtro, setFiltro] = useState<FiltroExtrato>('todos');
  const [atualizando, setAtualizando] = useState(false);
  const ocupado = useRef(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    try {
      setErro(false);
      const pagina = await buscarExtratoXp(userId);
      setItens(pagina.itens);
      setTemMais(pagina.temMais);
    } catch (e) {
      console.error('Erro ao carregar extrato de XP:', e);
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  const carregarMais = useCallback(async () => {
    if (!userId || !temMais || ocupado.current || itens.length === 0) return;
    ocupado.current = true;
    setCarregandoMais(true);
    try {
      const pagina = await buscarExtratoXp(userId, itens[itens.length - 1].criadoEm);
      setItens((atuais) => {
        const ids = new Set(atuais.map((i) => i.id));
        return [...atuais, ...pagina.itens.filter((i) => !ids.has(i.id))];
      });
      setTemMais(pagina.temMais);
    } catch (e) {
      console.error('Erro ao carregar mais lançamentos de XP:', e);
    } finally {
      ocupado.current = false;
      setCarregandoMais(false);
    }
  }, [userId, temMais, itens]);

  // puxar para atualizar
  const atualizar = useCallback(async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }, [carregar]);

  // o resumo "hoje / 7 dias" precisa de todos os lançamentos da semana: busca mais páginas até cobrir
  useEffect(() => {
    if (temMais && !carregandoMais && resumoPodeEstarIncompleto(itens)) void carregarMais();
  }, [temMais, carregandoMais, itens, carregarMais]);

  const resumo = useMemo(() => resumirPeriodos(itens), [itens]);
  const visiveis = useMemo(() => filtrarLancamentos(itens, filtro), [itens, filtro]);
  const dias = useMemo(() => agruparPorDia(visiveis), [visiveis]);

  return {
    dias,
    resumo,
    filtro,
    setFiltro,
    totalLancamentos: itens.length,
    vazio: !carregando && !erro && itens.length === 0,
    vazioFiltro: !carregando && !erro && itens.length > 0 && visiveis.length === 0,
    carregando,
    carregandoMais,
    atualizando,
    erro,
    temMais,
    recarregar: carregar,
    atualizar,
    carregarMais,
  };
}
