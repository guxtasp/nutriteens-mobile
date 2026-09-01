import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

async function recuperarSessaoDaUrlWeb() {
  // Se não for web, não precisa fazer nada
  if (Platform.OS !== 'web') return;

  // Se não houver hash na URL, não precisa fazer nada
  const hash = window.location.hash; // cria uma variavel constante hash que recebe o valor do hash da URL atual
  if (!hash || !hash.includes('access_token')) return; // se o hash não existir ou não incluir 'access_token', retorna sem fazer nada

  // Se houver hash, extrai os tokens de acesso e refresh da URL e define a sessão no Supabase
  const params = new URLSearchParams(hash.substring(1)); // recebe os parametros da URL, removendo o '#' do inicio
  const access_token = params.get('access_token'); // recebe o valor do parametro 'access_token' da URL, ou seja, o token de acesso do usuário
  const refresh_token = params.get('refresh_token'); // recebe o valor do parametro que é o token de refresh do usuário

  // se existirem, cria uma sessão no Supabase com os tokens de acesso e refresh
  if (access_token && refresh_token) {
    await supabase.auth.setSession({ access_token, refresh_token }); // define a sessão no Supabase com os tokens de acesso e refresh
  }

  // limpa o hash da URL pra não ficar reprocessando nem expor o token
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
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
};
// cria o contexto de autenticação com o tipo definido acima, inicializando com undefined
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// define o provedor de autenticação, que recebe os filhos (responsável pelo renderização dos componentes filhos) como props e retorna o 
// contexto de autenticação com os valores definidos
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); //armazena a sessão do usuário, inicializando com null
  const [carregando, setCarregando] = useState(true); //armazena o estado de carregamento do contexto, inicializando com true
  const [nomeCompleto, setNomeCompleto] = useState<string | null>(null); //armazena o nome completo do usuário, inicializando com null

  const userId = session?.user.id ?? null; //armazena o ID do usuário, que é obtido da sessão se existir, ou null se não houver sessão

  useEffect(() => { // executa o efeito colateral de recuperar a sessão da URL web e configurar o listener de mudança de estado de autenticação
    recuperarSessaoDaUrlWeb().finally(() => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setCarregando(false);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSession) => {
      setSession(novaSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
      value={{ session, userId, carregando, nomeCompleto, signOut, refrescarPerfil, definirNomeCompleto }}
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