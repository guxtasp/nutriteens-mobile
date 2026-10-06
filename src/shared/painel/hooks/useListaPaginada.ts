// src/shared/painel/hooks/useListaPaginada.ts
// Busca (com atraso), filtro, ordenação e "carregar mais" para listas do painel.
// O servidor pagina; aqui só controlamos estado, erro e corridas entre requisições.
import { useCallback, useEffect, useRef, useState } from 'react';

export type ParamsLista = { busca: string; filtro: string | null; ordem: string; limite: number; offset: number };
export type PaginaLista<T> = { itens: T[]; total: number };

const TAMANHO_PAGINA = 25;

export function useListaPaginada<T>(
  buscar: (p: ParamsLista) => Promise<PaginaLista<T>>,
  opcoes: { ordemInicial?: string; filtroInicial?: string | null } = {}
) {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [filtro, setFiltro] = useState<string | null>(opcoes.filtroInicial ?? null);
  const [ordem, setOrdem] = useState(opcoes.ordemInicial ?? 'recentes');
  const [itens, setItens] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const requisicao = useRef(0);
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  // espera o usuário parar de digitar
  useEffect(() => {
    const t = setTimeout(() => setBuscaAplicada(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    const id = ++requisicao.current;
    setCarregando(true);
    setErro(null);
    buscarRef
      .current({ busca: buscaAplicada, filtro, ordem, limite: TAMANHO_PAGINA, offset: 0 })
      .then((r) => {
        if (id !== requisicao.current) return;
        setItens(r.itens);
        setTotal(r.total);
      })
      .catch((e: any) => {
        if (id !== requisicao.current) return;
        setErro(e?.message ?? 'Não foi possível carregar a lista.');
      })
      .finally(() => {
        if (id === requisicao.current) setCarregando(false);
      });
  }, [buscaAplicada, filtro, ordem, tentativa]);

  const carregarMais = useCallback(async () => {
    if (carregandoMais || itens.length >= total) return;
    const id = requisicao.current;
    setCarregandoMais(true);
    try {
      const r = await buscarRef.current({ busca: buscaAplicada, filtro, ordem, limite: TAMANHO_PAGINA, offset: itens.length });
      if (id !== requisicao.current) return;
      setItens((atual) => [...atual, ...r.itens]);
      setTotal(r.total);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar mais.');
    } finally {
      setCarregandoMais(false);
    }
  }, [carregandoMais, itens.length, total, buscaAplicada, filtro, ordem]);

  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);

  return {
    busca, setBusca, filtro, setFiltro, ordem, setOrdem,
    itens, total, carregando, carregandoMais, erro, carregarMais, recarregar,
    temMais: itens.length < total,
  };
}
