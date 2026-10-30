// src/shared/painel/tema/TemaPainelContext.tsx
//
// Tema claro/escuro do painel. A escolha fica salva no aparelho; enquanto a
// pessoa não escolher, o painel acompanha o tema do sistema.
// Fora do provider, o hook devolve o tema claro (nada quebra em telas que
// ainda não foram migradas).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TEMAS, type NomeTema, type TemaPainel } from './paletas';

const CHAVE = 'painel_tema_v1';

type ContextoTema = {
  tema: TemaPainel;
  nome: NomeTema;
  definir: (nome: NomeTema) => void;
  alternar: () => void;
};

const PADRAO: ContextoTema = { tema: TEMAS.claro, nome: 'claro', definir: () => {}, alternar: () => {} };
const Contexto = createContext<ContextoTema>(PADRAO);

export function TemaPainelProvider({ children }: { children: React.ReactNode }) {
  const sistema = useColorScheme();
  const [escolha, setEscolha] = useState<NomeTema | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let ativo = true;
    AsyncStorage.getItem(CHAVE)
      .then((v) => {
        if (ativo && (v === 'claro' || v === 'escuro')) setEscolha(v);
      })
      .catch(() => {})
      .finally(() => ativo && setPronto(true));
    return () => {
      ativo = false;
    };
  }, []);

  const nome: NomeTema = escolha ?? (sistema === 'dark' ? 'escuro' : 'claro');

  const definir = useCallback((n: NomeTema) => {
    setEscolha(n);
    AsyncStorage.setItem(CHAVE, n).catch(() => {});
  }, []);
  const alternar = useCallback(() => definir(nome === 'escuro' ? 'claro' : 'escuro'), [definir, nome]);

  const valor = useMemo<ContextoTema>(() => ({ tema: TEMAS[nome], nome, definir, alternar }), [nome, definir, alternar]);

  // evita o "pisca" de tema errado no primeiro quadro (a leitura é rápida)
  if (!pronto) return null;
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Força um tema só para os filhos (usado nas telas legadas dentro do tema escuro). Não salva nada. */
export function TemaPainelFixo({ nome, children }: { nome: NomeTema; children: React.ReactNode }) {
  const valor = useMemo<ContextoTema>(() => ({ tema: TEMAS[nome], nome, definir: () => {}, alternar: () => {} }), [nome]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTemaPainel(): ContextoTema {
  return useContext(Contexto);
}

/**
 * Cria o StyleSheet do componente a partir do tema atual.
 * `criar` deve ser uma função declarada fora do componente (referência estável).
 */
export function useEstilos<T extends StyleSheet.NamedStyles<T>>(criar: (tema: TemaPainel) => T): T {
  const { tema } = useTemaPainel();
  return useMemo(() => StyleSheet.create(criar(tema)), [criar, tema]);
}
