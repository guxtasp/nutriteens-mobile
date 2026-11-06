import {
  criarFetchComTimeout,
  limiteParaUrl,
  TIMEOUT_PADRAO_MS,
  TIMEOUT_STORAGE_MS,
} from '../fetchComTimeout';
import { ehErroDeRede } from '../../shared/offline/erroRede';

// fetch falso que só termina quando o signal é abortado (simula sinal "pendurado")
function fetchPendurado(): typeof fetch {
  return ((_url: unknown, init?: RequestInit) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        const e = new Error('Aborted');
        e.name = 'AbortError';
        reject(e);
      });
    })) as unknown as typeof fetch;
}

describe('fetchComTimeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('devolve a resposta normalmente e limpa o temporizador', async () => {
    const resposta = { ok: true } as Response;
    const base = jest.fn().mockResolvedValue(resposta) as unknown as typeof fetch;
    const f = criarFetchComTimeout(base);

    await expect(f('https://x.supabase.co/rest/v1/profiles')).resolves.toBe(resposta);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('estoura depois do prazo padrão e o erro é reconhecido como erro de rede', async () => {
    const f = criarFetchComTimeout(fetchPendurado());
    const promessa = f('https://x.supabase.co/rest/v1/profiles');
    const capturada = promessa.catch((e) => e);

    jest.advanceTimersByTime(TIMEOUT_PADRAO_MS);
    const erro = await capturada;

    expect(erro).toBeInstanceOf(TypeError);
    expect(ehErroDeRede(erro)).toBe(true);
  });

  it('não estoura antes do prazo', async () => {
    const f = criarFetchComTimeout(fetchPendurado());
    let terminou = false;
    f('https://x.supabase.co/rest/v1/profiles').catch(() => { terminou = true; });

    jest.advanceTimersByTime(TIMEOUT_PADRAO_MS - 1);
    await Promise.resolve();
    expect(terminou).toBe(false);
  });

  it('upload no Storage tem prazo maior que o das demais chamadas', async () => {
    expect(limiteParaUrl('https://x.supabase.co/storage/v1/object/img.png')).toBe(TIMEOUT_STORAGE_MS);
    expect(limiteParaUrl('https://x.supabase.co/rest/v1/rpc/algo')).toBe(TIMEOUT_PADRAO_MS);
    expect(TIMEOUT_STORAGE_MS).toBeGreaterThan(TIMEOUT_PADRAO_MS);

    const f = criarFetchComTimeout(fetchPendurado());
    let terminou = false;
    f('https://x.supabase.co/storage/v1/object/img.png').catch(() => { terminou = true; });

    jest.advanceTimersByTime(TIMEOUT_PADRAO_MS + 1);
    await Promise.resolve();
    expect(terminou).toBe(false); // passou do prazo padrão, mas storage ainda espera

    // versão assíncrona: avança o relógio E descarrega a cadeia catch -> finally -> catch
    await jest.advanceTimersByTimeAsync(TIMEOUT_STORAGE_MS);
    expect(terminou).toBe(true);
  });

  it('respeita um signal já abortado vindo de quem chamou, sem virar "timeout"', async () => {
    const f = criarFetchComTimeout(fetchPendurado());
    const externo = new AbortController();
    const promessa = f('https://x.supabase.co/rest/v1/profiles', { signal: externo.signal });
    const capturada = promessa.catch((e) => e);

    externo.abort();
    const erro = await capturada;

    expect((erro as Error).name).toBe('AbortError'); // cancelamento de quem chamou NÃO é erro de rede
  });

  it('propaga erros comuns de rede sem alterá-los', async () => {
    const original = new TypeError('Network request failed');
    const base = jest.fn().mockRejectedValue(original) as unknown as typeof fetch;
    const f = criarFetchComTimeout(base);

    await expect(f('https://x.supabase.co/rest/v1/profiles')).rejects.toBe(original);
    expect(jest.getTimerCount()).toBe(0);
  });
});