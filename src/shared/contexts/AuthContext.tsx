import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

// Extrai access_token/refresh_token/type de um hash de URL no formato
// "#access_token=...&refresh_token=...&type=recovery" — mesmo formato usado
// tanto pelo retorno do login com Google quanto pelo link de "esqueci minha
// senha" enviado por email (supabase.auth.resetPasswordForEmail). O `type`
// é o que diferencia os dois: 'recovery' só vem do link de redefinição de
// senha (ver EsqueciSenhaScreen/RedefinirSenhaScreen).
function extrairTokensDoHash(hash: string): { access_token: string | null; refresh_token: string | null; type: string | null } {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    type: params.get('type'),
  };
}

async function recuperarSessaoDaUrlWeb(
  onTokens: (tokens: { access_token: string; refresh_token: string; type: string | null }) => Promise<void>
) {
  // Se não for web, não precisa fazer nada
  if (Platform.OS !== 'web') return;

  // Se não houver hash na URL, não precisa fazer nada
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) return;

  const { access_token, refresh_token, type } = extrairTokensDoHash(hash);

  // limpa o hash da URL pra não ficar reprocessando nem expor o token
  window.history.replaceState(null, '', window.location.pathname + window.location.search);

  if (access_token && refresh_token) {
    await onTokens({ access_token, refresh_token, type });
  }
}

// Versão nativa (iOS/Android) do mesmo processamento: o link de recuperação
// de senha abre o app via deep link (scheme `nutriteens://`, ver app.json),
// não como retorno de um WebBrowser.openAuthSessionAsync (esse padrão já
// existe só pro login com Google, autocontido dentro de LoginScreen) — pode
// chegar com o app fechado (getInitialURL) ou já aberto (addEventListener).
function extrairTokensDeUrlNativa(url: string) {
  // expo-linking dá os query params já parseados, mas o Supabase manda os
  // tokens depois de um `#`, que o parser de query string não separa do
  // resto — por isso extrai o hash manualmente, igual ao caminho web.
  const indiceHash = url.indexOf('#');
  if (indiceHash === -1) return { access_token: null, refresh_token: null, type: null };
  return extrairTokensDoHash(url.substring(indiceHash));
}

// define o tipo do contexto de autenticação, que inclui a sessão, o ID do usuário, o estado de carregamento, o nome completo do usuário e as funções de logout, atualização de perfil e definição do nome completo
type AuthContextValue = {
  session: Session | null; // a sessão do usuário, que pode ser nula se não houver usuário logado
  userId: string | null; // o ID do usuário, que pode ser nulo se não houver usuário logado
  carregando: boolean; // indica se o contexto ainda está carregando a sessão do usuário
  nomeCompleto: string | null; // o nome completo do usuário, que pode ser nulo se não houver usuário logado ou se o nome não estiver definido
  signOut: () => Promise<void>; // função para deslogar o usuário, que retorna uma Promise que resolve quando o logout é concluído
  refrescarPerfil: () => Promise<void>; // função para atualizar o perfil do usuário, que retorna uma Promise que resolve quando a atualização é concluída
  definirNomeCompleto: (nome: string) => void; // função para definir o nome completo do usuário, que recebe uma string como parâmetro e não retorna nada
  // true quando a sessão atual veio de um link de "esqueci minha senha"
  // (type=recovery). Enquanto true, o RootNavigator mostra só a tela de
  // redefinir senha — mesmo que já exista uma sessão válida — pra não
  // deixar quem clicou no link cair direto dentro do app de outra pessoa
  // (ex: email compartilhado) sem antes trocar a senha.
  emRecuperacaoSenha: boolean;
  sairDoModoRecuperacao: () => void;
};
// cria o contexto de autenticação com o tipo definido acima, inicializando com undefined
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// define o provedor de autenticação, que recebe os filhos (responsável pelo renderização dos componentes filhos) como props e retorna o 
// contexto de autenticação com os valores definidos
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); //armazena a sessão do usuário, inicializando com null
  const [carregando, setCarregando] = useState(true); //armazena o estado de carregamento do contexto, inicializando com true
  const [nomeCompleto, setNomeCompleto] = useState<string | null>(null); //armazena o nome completo do usuário, inicializando com null
  const [emRecuperacaoSenha, setEmRecuperacaoSenha] = useState(false);

  const userId = session?.user.id ?? null; //armazena o ID do usuário, que é obtido da sessão se existir, ou null se não houver sessão

  // usado tanto pelo caminho web (hash da URL) quanto pelo nativo (deep
  // link) — decide a sessão E se é um link de recuperação de senha
  const processarTokens = useCallback(
    async (tokens: { access_token: string; refresh_token: string; type: string | null }) => {
      if (tokens.type === 'recovery') setEmRecuperacaoSenha(true);
      await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      });
    },
    []
  );

  const sairDoModoRecuperacao = useCallback(() => setEmRecuperacaoSenha(false), []);

  useEffect(() => { // executa o efeito colateral de recuperar a sessão da URL/deep link e configurar o listener de mudança de estado de autenticação
    async function processarUrlInicial() {
      if (Platform.OS === 'web') {
        await recuperarSessaoDaUrlWeb(processarTokens);
        return;
      }

      // nativo: cobre tanto o app sendo aberto a partir do link (cold
      // start) quanto o link chegando com o app já em primeiro plano
      const urlInicial = await Linking.getInitialURL();
      if (urlInicial) {
        const { access_token, refresh_token, type } = extrairTokensDeUrlNativa(urlInicial);
        if (access_token && refresh_token) {
          await processarTokens({ access_token, refresh_token, type });
        }
      }
    }

    processarUrlInicial().finally(() => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setCarregando(false);
      });
    });

    const assinaturaLinking =
      Platform.OS !== 'web'
        ? Linking.addEventListener('url', ({ url }) => {
            const { access_token, refresh_token, type } = extrairTokensDeUrlNativa(url);
            if (access_token && refresh_token) {
              processarTokens({ access_token, refresh_token, type });
            }
          })
        : null;

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSession) => {
      setSession(novaSession);
    });

    return () => {
      listener.subscription.unsubscribe();
      assinaturaLinking?.remove();
    };
  }, [processarTokens]);

  const buscarNome = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', id)
      .single();

    if (error) {
      // não decide deslogar aqui — o RootNavigator já cuida da sessão órfã
      // com tolerância pra não confundir com cadastro em andamento
      if (error.code !== 'PGRST116') {
        console.error('Erro ao buscar profile:', error);
      }
      return;
    }
    setNomeCompleto(data?.nome ?? null);
  }, []);

  useEffect(() => {
    if (!userId) {
      setNomeCompleto(null);
      return;
    }
    buscarNome(userId);
  }, [userId, buscarNome]);

  // Usado quando algo FORA do fluxo normal de login precisa reconferir o
  // nome (ex.: depois de editar o perfil). Depende do userId já estar
  // presente no Context — não serve pro momento do cadastro, porque nesse
  // instante o evento SIGNED_IN pode ainda não ter sido processado aqui
  // dentro (ver definirNomeCompleto abaixo pra esse caso).
  const refrescarPerfil = useCallback(async () => {
    if (!userId) return;
    await buscarNome(userId);
  }, [userId, buscarNome]);

  // Set direto, sem depender do Context já saber o userId nem de round-trip
  // no banco. Usado no cadastro: quem está criando a conta já digitou o
  // próprio nome no formulário, então não precisa esperar o
  // onAuthStateChange processar pra depois buscar de volta algo que já se
  // sabe. Elimina a corrida de vez.
  const definirNomeCompleto = useCallback((nome: string) => {
    setNomeCompleto(nome);
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao sair:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        userId,
        carregando,
        nomeCompleto,
        signOut,
        refrescarPerfil,
        definirNomeCompleto,
        emRecuperacaoSenha,
        sairDoModoRecuperacao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para acessar o contexto de autenticação, que lança um erro se for usado fora do provedor de autenticação
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return contexto;
}