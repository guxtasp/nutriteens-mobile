// src/shared/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

type AuthContextValue = {
  session: Session | null;
  userId: string | null;
  carregando: boolean;
  nomeCompleto: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState<string | null>(null);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evento, novaSession) => {
      setSession(novaSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setNomeCompleto(null);
      return;
    }
    supabase
      .from('profiles')
      .select('nome')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // não decide deslogar aqui — o RootNavigator já cuida da sessão órfã
          // com tolerância pra não confundir com cadastro em andamento
          if (error.code !== 'PGRST116') {
            console.error('Erro ao buscar profile:', error);
          }
          return;
        }
        setNomeCompleto(data?.nome ?? null);
      });
  }, [userId]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao sair:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ session, userId, carregando, nomeCompleto, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider');
  }
  return contexto;
}