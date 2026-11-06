// src/shared/offline/erroRede.ts
// Distingue "sem internet" de "o servidor recusou". Só o primeiro caso vai para a
// fila offline: um erro de regra (ex.: constraint, RLS) não passa a funcionar
// só porque o sinal voltou.
const PADROES_REDE =
  /network request failed|failed to fetch|fetch failed|network error|networkerror|load failed|timed? ?out|internet connection appears to be offline|offline|econnrefused|econnreset|enotfound|err_internet_disconnected|err_network|retryablefetch/i;

export function ehErroDeRede(erro: unknown): boolean {
  if (!erro) return false;
  if (typeof erro === 'string') return PADROES_REDE.test(erro);

  const e = erro as { message?: unknown; details?: unknown; hint?: unknown; name?: unknown; code?: unknown; cause?: unknown };
  const textos: unknown[] = [e.message, e.details, e.hint, e.name, e.code];
  const causa = e.cause as { message?: unknown } | undefined;
  if (causa && typeof causa === 'object') textos.push(causa.message);

  return textos.some((t) => typeof t === 'string' && PADROES_REDE.test(t));
}

/**
 * O supabase-js NÃO lança em falha de rede: devolve `{ data: null, error }`. Quem lê só
 * `data` acaba tratando "sem internet" como "sem registros" (progresso 0, dia vazio).
 * Passe o resultado por aqui para que erro de rede vire exceção (e o cache/aviso offline
 * entre em ação); erros de regra (RLS, constraint) continuam seguindo o fluxo de sempre.
 */
export function lancarSeErroDeRede<T extends { error?: unknown }>(resultado: T): T {
  if (resultado.error && ehErroDeRede(resultado.error)) throw resultado.error;
  return resultado;
}
