import { createClient } from '@supabase/supabase-js'; // Usa o pacote oficial do Supabase para criar o cliente
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import { criarFetchComTimeout } from './fetchComTimeout'; // fetch com tempo máximo de espera (ver o arquivo)
import { estaOnline, verificarConexao } from '../shared/offline/conexao'; // sabe se estamos sem internet

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!; // Usa a variável de ambiente para obter a URL do Supabase
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!; // Usa a variável de ambiente para obter a chave anônima do Supabase

if (!supabaseUrl || !supabaseAnonKey) { // Se a URL ou a chave anônima não estiverem definidas, lança um erro
  throw new Error(
    'Supabase URL ou Anon Key não encontradas. Verifique o arquivo .env (desenvolvimento) ou as variáveis de ambiente do EAS (builds).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { // Cria o cliente do Supabase com as configurações de autenticação
  auth: {
    storage: AsyncStorage, // Usa o AsyncStorage para armazenar o token de autenticação
    autoRefreshToken: true, // Habilita a atualização automática do token de autenticação
    persistSession: true, // Habilita a persistência da sessão do usuário
    detectSessionInUrl: false, // Desabilita a detecção da sessão na URL
  },
  global: {
    // sem internet conhecida, falha na hora (antes esperava 20 s por chamada: o app parecia travado)
    fetch: criarFetchComTimeout(undefined, {
      semConexao: () => !estaOnline(),
      aoFalharRede: () => void verificarConexao(),
    }),
  },
});

// Recomendação oficial do Supabase para React Native: o renovador de token só
// deve rodar com o app em primeiro plano. Ao voltar do background, retomar na
// hora faz o token ser renovado ANTES das primeiras chamadas, evitando uma janela
// de "JWT expirado". No web a própria biblioteca já cuida disso (visibilitychange).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}