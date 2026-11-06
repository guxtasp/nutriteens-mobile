// src/lib/fetchComTimeout.ts
//
// fetch com tempo máximo de espera, usado pelo cliente do Supabase. O fetch do
// React Native não tem timeout próprio: com sinal "pendurado" (existe, mas não
// trafega), a requisição fica pendente para sempre e a tela, carregando.
//
// Módulo separado do supabase.ts para poder ser testado sem variáveis de
// ambiente nem React Native.

export const TIMEOUT_PADRAO_MS = 20_000;
// Upload de imagens (Storage) é maior e mais lento: prazo mais folgado.
export const TIMEOUT_STORAGE_MS = 90_000;

type Entrada = string | URL | { url: string };

function urlDe(input: Entrada): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function limiteParaUrl(url: string): number {
  return url.includes('/storage/v1/') ? TIMEOUT_STORAGE_MS : TIMEOUT_PADRAO_MS;
}

export type OpcoesFetch = {
  /** true = já sabemos que está sem internet: falha na hora em vez de esperar o timeout (20 s) */
  semConexao?: () => boolean;
  /** chamado quando uma requisição falha por rede (ex.: para re-testar a conexão) */
  aoFalharRede?: () => void;
};

export function criarFetchComTimeout(
  base: typeof fetch = (input, init) => fetch(input, init),
  opcoes: OpcoesFetch = {}
): typeof fetch {
  return ((input: Entrada, init?: RequestInit) => {
    if (opcoes.semConexao?.()) {
      // mesma mensagem que o ehErroDeRede() reconhece: cai na fila offline / cache na hora
      return Promise.reject(new TypeError('Network request failed'));
    }
    const limite = limiteParaUrl(urlDe(input));
    const controle = new AbortController();
    let estourou = false;

    // respeita um signal que a própria biblioteca já tenha passado
    const sinalOriginal = init?.signal;
    if (sinalOriginal) {
      if (sinalOriginal.aborted) controle.abort();
      else sinalOriginal.addEventListener('abort', () => controle.abort(), { once: true });
    }

    const temporizador = setTimeout(() => {
      estourou = true;
      controle.abort();
    }, limite);

    return base(input as Parameters<typeof fetch>[0], { ...init, signal: controle.signal })
      .catch((erro: unknown) => {
        // Troca o "AbortError" genérico por uma mensagem que o ehErroDeRede()
        // (src/shared/offline/erroRede.ts) reconhece — assim o estouro de tempo
        // também cai na fila offline / cache em vez de virar "erro inesperado".
        if (estourou) {
          opcoes.aoFalharRede?.();
          throw new TypeError('Network request timed out');
        }
        if (erro instanceof TypeError) opcoes.aoFalharRede?.();
        throw erro;
      })
      .finally(() => clearTimeout(temporizador));
  }) as typeof fetch;
}