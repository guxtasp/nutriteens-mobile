// src/navigation/decisaoSessao.ts
//
// Regras do RootNavigator sobre "o que fazer com o resultado de carregar o
// perfil", isoladas em funções puras para serem testáveis sem React nem Supabase.

// Resultado de tentar carregar o perfil de uma sessão:
//  - 'logado':       perfil carregado (da rede ou, se a rede falhou, da cópia local)
//  - 'deslogado':    não há como seguir logado (sessão órfã, cadastro em andamento)
//  - 'indisponivel': NÃO deu pra saber (rede caiu, timeout, erro do servidor).
//                    Isso NÃO é motivo para deslogar: a sessão continua válida.
export type ResultadoPerfil = 'logado' | 'deslogado' | 'indisponivel';

export type AcaoSessao = 'entrar' | 'sair' | 'aguardar_conexao' | 'manter';

export function decidirAcaoSessao(resultado: ResultadoPerfil, jaDentroDoApp: boolean): AcaoSessao {
  if (resultado === 'logado') return 'entrar';
  if (resultado === 'deslogado') return 'sair';
  // 'indisponivel':
  //  - com o usuário JÁ dentro do app (ex.: a rede caiu na hora de renovar o
  //    token): não muda nada. Antes isto mandava a pessoa para a tela de login.
  //  - na abertura do app, sem conseguir carregar a conta e sem cópia local:
  //    espera a internet voltar.
  return jaDentroDoApp ? 'manter' : 'aguardar_conexao';
}

// INITIAL_SESSION já é tratado pelo getSession() da abertura do app; reagir a ele
// também carregaria o perfil duas vezes ao mesmo tempo.
// ATENÇÃO: TOKEN_REFRESHED NÃO pode ser ignorado: useSignup e useEbiaPergunta
// chamam supabase.auth.refreshSession() justamente para avisar o RootNavigator de
// que etapa_onboarding mudou no banco.
export function deveIgnorarEventoDeAuth(evento: string): boolean {
  return evento === 'INITIAL_SESSION';
}