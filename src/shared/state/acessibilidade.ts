// src/shared/state/acessibilidade.ts
//
// Preferências de acessibilidade DENTRO do app (além das do aparelho).
// Ficam guardadas no aparelho (AsyncStorage) e valem para todas as telas.
//
// - reduzirAnimacoes: desliga confete, brilhos, bolhas e animações em repetição.
//   Soma com o "reduzir movimento" do sistema: se qualquer um dos dois estiver ligado, reduz.
// - vibracao: liga/desliga as vibrações de feedback (toques, conquistas).
//
// Os sons continuam em shared/audio/sons.ts (já têm a própria preferência).
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE = '@nutriteens:acessibilidade';

export type PreferenciasAcessibilidade = {
  reduzirAnimacoes: boolean;
  vibracao: boolean;
};

export const PREFERENCIAS_PADRAO: PreferenciasAcessibilidade = {
  reduzirAnimacoes: false,
  vibracao: true,
};

let atual: PreferenciasAcessibilidade = { ...PREFERENCIAS_PADRAO };
const ouvintes = new Set<() => void>();

function avisar() {
  ouvintes.forEach((f) => f());
}

/** Lê o valor salvo; qualquer coisa estranha vira o padrão. */
export function interpretarPreferencias(bruto: string | null): PreferenciasAcessibilidade {
  if (!bruto) return { ...PREFERENCIAS_PADRAO };
  try {
    const dado = JSON.parse(bruto);
    return {
      reduzirAnimacoes: dado?.reduzirAnimacoes === true,
      vibracao: dado?.vibracao !== false,
    };
  } catch {
    return { ...PREFERENCIAS_PADRAO };
  }
}

export function obterPreferencias(): PreferenciasAcessibilidade {
  return atual;
}

export function assinarPreferencias(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export async function definirPreferencia<K extends keyof PreferenciasAcessibilidade>(
  chave: K,
  valor: PreferenciasAcessibilidade[K],
): Promise<void> {
  atual = { ...atual, [chave]: valor };
  avisar();
  try {
    await AsyncStorage.setItem(CHAVE, JSON.stringify(atual));
  } catch (e) {
    console.warn('[acessibilidade] não foi possível salvar:', e);
  }
}

/** Carrega do aparelho (chamado uma vez ao importar o módulo). */
export async function carregarPreferencias(): Promise<void> {
  try {
    atual = interpretarPreferencias(await AsyncStorage.getItem(CHAVE));
    avisar();
  } catch {
    /* mantém o padrão */
  }
}

carregarPreferencias();
