import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import OnboardingScreen from '../features/auth/screens/OnboardingScreen';
import AppPresentationScreen from '../features/auth/presentation/AppPresentationScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import SignupScreen from '../features/auth/screens/SignupScreen';
import EsqueciSenhaScreen from '../features/auth/screens/EsqueciSenhaScreen';
import RedefinirSenhaScreen from '../features/auth/screens/RedefinirSenhaScreen';
import CompletarCadastroScreen from '../features/auth/screens/CompletarCadastroScreen';
import LegalPlaceholderScreen from '../features/legal/screens/LegalPlaceholdersScreen';
import SplashScreen from '../shared/ui/SplashScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { signupState } from '../shared/state/signupFlag';
import { useAuth } from '../shared/contexts/AuthContext';
import AdolescenteNavigator from './AdolescenteNavigator';
import NutricionistaNavigator from './NutricionistaNavigator';
import AdminNavigator from './AdminNavigator';

export type RootStackParamList = {
  Onboarding: undefined;
  AppPresentation: undefined;
  Login: undefined;
  Signup: undefined;
  EsqueciSenha: undefined;
  RedefinirSenha: undefined;
  TermosDeUso: { title: string };
  PoliticaPrivacidade: { title: string };
};

const StackRecuperacao = createNativeStackNavigator<{ RedefinirSenha: undefined }>();
const StackCompletarCadastro = createNativeStackNavigator<{ CompletarCadastro: undefined }>();

const Stack = createNativeStackNavigator<RootStackParamList>();

type EtapaOnboarding = 'APRESENTACAO' | 'CADASTRO' | 'TRIAGEM' | 'ORIENTACOES' | 'CONCLUIDO';
type Papel = 'ADOLESCENTE' | 'NUTRICIONISTA' | 'ADMINISTRADOR';

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [papel, setPapel] = useState<Papel | null>(null);
  const [etapaOnboarding, setEtapaOnboarding] = useState<EtapaOnboarding | null>(null);
  // Sessão de login social (Google) que ainda não tem profile: em vez de
  // tratar como sessão órfã e deslogar, pede os dados que faltam.
  const [perfilPendente, setPerfilPendente] = useState<{ user: User; nomeSugerido: string } | null>(null);
  const { emRecuperacaoSenha } = useAuth();

  // Retorna false se a sessão for órfã (profile não existe mesmo depois de
  // uma segunda tentativa) — quem chamar deve tratar isso como "não logado".
 async function carregarPerfil(user: User): Promise<boolean> {
  const userId = user.id;
  async function buscar() {
    return supabase
      .from('profiles')
      .select('papel, etapa_onboarding')
      .eq('id', userId)
      .single();
  }

  let { data, error } = await buscar();

  // Login social sem profile = cadastro com Google ainda incompleto, não sessão órfã.
  if (error?.code === 'PGRST116' && !signupState.emAndamento) {
    const providers: string[] = user.app_metadata?.providers ?? [user.app_metadata?.provider ?? 'email'];
    if (providers.some((p) => p !== 'email')) {
      const meta = user.user_metadata ?? {};
      setPerfilPendente({ user, nomeSugerido: String(meta.full_name ?? meta.name ?? '') });
      return true;
    }
  }

if (error?.code === 'PGRST116') {
    if (signupState.emAndamento) {
      // cadastro em andamento: o insert do profile ainda não terminou.
      // não desloga — o useSignup avisa o RootNavigator quando terminar.
      return false;
    }
    await esperar(1500);
    ({ data, error } = await buscar());
  }

  if (error) {
    if (error.code === 'PGRST116') {
      if (signupState.emAndamento) {
        return false;
      }
      console.warn('Profile não encontrado para userId, sessão órfã. Deslogando.');
      await supabase.auth.signOut();
      return false;
    }
    console.error('Erro ao carregar profile:', error);
    return false;
  }

  if (!data) {
    console.error('Profile veio vazio sem erro reportado — caso inesperado');
    return false;
  }

  setPerfilPendente(null);
  setPapel(data.papel as Papel);
  setEtapaOnboarding(data.etapa_onboarding as EtapaOnboarding);
  return true;
}

  useEffect(() => {
    const MIN_SPLASH_TIME = 1000;
    const startTime = Date.now();

    supabase.auth.getSession().then(async ({ data }) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(MIN_SPLASH_TIME - elapsed, 0);

      let logado = false;
      if (data.session) {
        logado = await carregarPerfil(data.session.user);
      }

      setTimeout(() => {
        setIsLoggedIn(logado);
      }, remaining);
    }).catch((erro) => {
      console.error('Erro ao obter sessão inicial:', erro);
      setIsLoggedIn(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const logado = await carregarPerfil(session.user);
        setIsLoggedIn(logado);
      } else {
        setPapel(null);
        setEtapaOnboarding(null);
        setPerfilPendente(null);
        setIsLoggedIn(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Prioridade máxima: veio de um link de "esqueci minha senha". Ignora
  // isLoggedIn/papel de propósito — mesmo que a sessão do link pertença a
  // uma conta válida, não deixamos cair direto no app sem antes trocar a
  // senha (ver comentário em AuthContext.emRecuperacaoSenha).
  if (emRecuperacaoSenha) {
    return (
      <NavigationContainer>
        <StackRecuperacao.Navigator screenOptions={{ headerShown: false }}>
          <StackRecuperacao.Screen name="RedefinirSenha" component={RedefinirSenhaScreen} />
        </StackRecuperacao.Navigator>
      </NavigationContainer>
    );
  }

  if (perfilPendente) {
    const { user, nomeSugerido } = perfilPendente;
    return (
      <NavigationContainer>
        <StackCompletarCadastro.Navigator screenOptions={{ headerShown: false }}>
          <StackCompletarCadastro.Screen name="CompletarCadastro">
            {() => (
              <CompletarCadastroScreen
                userId={user.id}
                nomeSugerido={nomeSugerido}
                onConcluido={async () => {
                  await carregarPerfil(user);
                }}
                onSair={() => {
                  supabase.auth.signOut();
                }}
              />
            )}
          </StackCompletarCadastro.Screen>
        </StackCompletarCadastro.Navigator>
      </NavigationContainer>
    );
  }

  if (isLoggedIn === null || (isLoggedIn && papel === null)) {
    return <SplashScreen />;
  }

  function renderNavigatorLogado() {
    switch (papel) {
      case 'NUTRICIONISTA':
        return <NutricionistaNavigator />;
      case 'ADMINISTRADOR':
        return <AdminNavigator />;
      case 'ADOLESCENTE':
      default:
        return <AdolescenteNavigator etapaOnboarding={etapaOnboarding as EtapaOnboarding} />;
    }
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        renderNavigatorLogado()
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="AppPresentation" component={AppPresentationScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />
          <Stack.Screen
            name="TermosDeUso"
            component={LegalPlaceholderScreen}
            initialParams={{ title: 'Termos de Uso' }}
          />
          <Stack.Screen
            name="PoliticaPrivacidade"
            component={LegalPlaceholderScreen}
            initialParams={{ title: 'Política de Privacidade' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}