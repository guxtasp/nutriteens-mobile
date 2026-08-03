import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { supabase } from '../lib/supabase';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import AppPresentationScreen from '../features/signup-flow/domain/presentation/AppPresentationScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import SignupScreen from '../features/auth/screens/SignupScreen';
import LegalPlaceholderScreen from '../features/legal/screens/LegalPlaceholdersScreen';
import SplashScreen from '../shared/ui/SplashScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { signupState } from '../shared/state/signupFlag';
import AdolescenteNavigator from './AdolescenteNavigator';
import NutricionistaNavigator from './NutricionistaNavigator';
import AdminNavigator from './AdminNavigator';

export type RootStackParamList = {
  Onboarding: undefined;
  AppPresentation: undefined;
  Login: undefined;
  Signup: undefined;
  TermosDeUso: { title: string };
  PoliticaPrivacidade: { title: string };
};

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

  // Retorna false se a sessão for órfã (profile não existe mesmo depois de
  // uma segunda tentativa) — quem chamar deve tratar isso como "não logado".
 async function carregarPerfil(userId: string): Promise<boolean> {
  async function buscar() {
    return supabase
      .from('profiles')
      .select('papel, etapa_onboarding')
      .eq('id', userId)
      .single();
  }

  let { data, error } = await buscar();

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
        logado = await carregarPerfil(data.session.user.id);
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
        const logado = await carregarPerfil(session.user.id);
        setIsLoggedIn(logado);
      } else {
        setPapel(null);
        setEtapaOnboarding(null);
        setIsLoggedIn(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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