// src/features/auth/utils/oauthUrl.ts
//
// Lógica pura (sem React Native) pra ler o resultado de um retorno OAuth.
// O Supabase (fluxo implicit, o padrão do supabase-js) devolve os tokens
// depois de um `#`, e erros do provedor podem vir tanto no `#` quanto na
// query string — por isso lê os dois lugares. `Linking.parse().queryParams`
// NÃO enxerga o que vem depois do `#`, e foi por isso que o retorno nativo
// do login com Google não conseguia extrair os tokens.

export type ParamsOAuth = {
  access_token: string | null;
  refresh_token: string | null;
  type: string | null;
  erro: string | null;
};

export function extrairParamsOAuth(url: string): ParamsOAuth {
  const indiceHash = url.indexOf('#');
  const fragmento = indiceHash === -1 ? '' : url.substring(indiceHash + 1);
  const semHash = indiceHash === -1 ? url : url.substring(0, indiceHash);
  const indiceQuery = semHash.indexOf('?');
  const query = indiceQuery === -1 ? '' : semHash.substring(indiceQuery + 1);

  const doHash = new URLSearchParams(fragmento);
  const daQuery = new URLSearchParams(query);
  const ler = (chave: string) => doHash.get(chave) ?? daQuery.get(chave);

  return {
    access_token: ler('access_token'),
    refresh_token: ler('refresh_token'),
    type: ler('type'),
    erro: ler('error_description') ?? ler('error'),
  };
}
