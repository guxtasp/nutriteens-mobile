// src/shared/offline/cacheLocal.ts
// Cópia local de dados de leitura (catálogos, receitas, estado do dia) para o app
// continuar útil sem internet. Nunca é fonte de verdade: sempre que a rede
// responde, a cópia é atualizada.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ehErroDeRede } from './erroRede';

const PREFIXO = 'nt:cache:';

type Entrada<T> = { salvoEm: number; valor: T };

export async function salvarCache<T>(chave: string, valor: T): Promise<void> {
  try {
    const entrada: Entrada<T> = { salvoEm: Date.now(), valor };
    await AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(entrada));
  } catch {
    // cache é opcional: falhar aqui nunca pode quebrar a tela
  }
}

export async function lerCache<T>(chave: string): Promise<T | null> {
  try {
    const bruto = await AsyncStorage.getItem(PREFIXO + chave);
    if (!bruto) return null;
    const entrada = JSON.parse(bruto) as Entrada<T>;
    return entrada && 'valor' in entrada ? entrada.valor : null;
  } catch {
    return null;
  }
}

/**
 * Busca online e guarda a cópia. Se (e só se) falhar por falta de internet e
 * houver cópia, devolve a cópia. Qualquer outro erro continua sendo erro.
 */
export async function comCache<T>(chave: string, buscar: () => Promise<T>): Promise<T> {
  try {
    const valor = await buscar();
    void salvarCache(chave, valor);
    return valor;
  } catch (erro) {
    if (ehErroDeRede(erro)) {
      const copia = await lerCache<T>(chave);
      if (copia !== null) return copia;
    }
    throw erro;
  }
}
