jest.mock('@react-native-async-storage/async-storage', () => {
  const mem = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: async (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: async (k: string, v: string) => void mem.set(k, v),
      getAllKeys: async () => Array.from(mem.keys()),
      multiRemove: async (ks: string[]) => ks.forEach((k) => mem.delete(k)),
    },
  };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { comCache, limparCacheLocal, salvarCache } from '../cacheLocal';
import { lancarSeErroDeRede } from '../erroRede';

const REDE = new Error('TypeError: Network request failed');

describe('comCache', () => {
  it('online: devolve o valor novo e guarda a cópia', async () => {
    expect(await comCache('a', async () => 1)).toBe(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(await comCache('a', async () => { throw REDE; })).toBe(1);
  });

  it('sem internet e sem cópia: o erro continua sendo erro', async () => {
    await expect(comCache('sem-copia', async () => { throw REDE; })).rejects.toBe(REDE);
  });

  it('erro de regra NÃO cai na cópia (cópia velha não esconde recusa do servidor)', async () => {
    await salvarCache('b', 'velho');
    const recusa = { message: 'new row violates row-level security policy', code: '42501' };
    await expect(comCache('b', async () => { throw recusa; })).rejects.toBe(recusa);
  });

  it('timeout do fetchComTimeout conta como falta de internet', async () => {
    await salvarCache('c', 'copia');
    expect(await comCache('c', async () => { throw new Error('Request timed out'); })).toBe('copia');
  });

  it('cópia com valor falsy (0, lista vazia) é devolvida', async () => {
    await salvarCache('zero', 0);
    expect(await comCache('zero', async () => { throw REDE; })).toBe(0);
    await salvarCache('vazia', []);
    expect(await comCache('vazia', async () => { throw REDE; })).toEqual([]);
  });
});

describe('limparCacheLocal', () => {
  it('apaga só as chaves do cache, não as demais do app', async () => {
    await salvarCache('x', 1);
    await AsyncStorage.setItem('outra:chave', 'fica');
    await limparCacheLocal();
    expect(await AsyncStorage.getItem('outra:chave')).toBe('fica');
    await expect(comCache('x', async () => { throw REDE; })).rejects.toBe(REDE);
  });
});

describe('lancarSeErroDeRede', () => {
  it('erro de rede vira exceção', () => {
    expect(() => lancarSeErroDeRede({ data: null, error: { message: 'TypeError: Network request failed' } })).toThrow();
  });
  it('erro de regra segue o fluxo normal (devolve o resultado)', () => {
    const r = { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
    expect(lancarSeErroDeRede(r)).toBe(r);
  });
  it('sem erro devolve o resultado', () => {
    const r = { data: [1], error: null };
    expect(lancarSeErroDeRede(r)).toBe(r);
  });
});
