import { createClient } from '@supabase/supabase-js'; // Usa o pacote oficial do Supabase para criar o cliente
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!; // Usa a variável de ambiente para obter a URL do Supabase
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!; // Usa a variável de ambiente para obter a chave anônima do Supabase

if (!supabaseUrl || !supabaseAnonKey) { // Se a URL ou a chave anônima não estiverem definidas, lança um erro
  throw new Error(
    'Supabase URL ou Anon Key não encontradas. Verifique o arquivo .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { // Cria o cliente do Supabase com as configurações de autenticação
  auth: {
    storage: AsyncStorage, // Usa o AsyncStorage para armazenar o token de autenticação
    autoRefreshToken: true, // Habilita a atualização automática do token de autenticação
    persistSession: true, // Habilita a persistência da sessão do usuário
    detectSessionInUrl: false, // Desabilita a detecção da sessão na URL
  }, 
});