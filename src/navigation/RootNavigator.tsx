import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import OnboardingScreen from '../features/onboarding/screens/OnboardingScreen';
import AppPresentationScreen from '../features/signup-flow/domain/presentation/AppPresentationScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import SignupScreen from '../features/auth/screens/SignupScreen';
import HomeScreen from '../features/home/screens/HomeScreen';
import SplashScreen from '../shared/ui/SplashScreen';
import LegalPlaceholderScreen from '../features/legal/screens/LegalPlaceholdersScreen.tsx';

export type RootStackParamList = {
  Onboarding: undefined;
  AppPresentation: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  TermosDeUso: { title: string };
  PoliticaPrivacidade: { title: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const MIN_SPLASH_TIME = 1000;
    const startTime = Date.now();

    supabase.auth.getSession().then(({ data }) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(MIN_SPLASH_TIME - elapsed, 0);

      setTimeout(() => {
        setIsLoggedIn(!!data.session);
      }, remaining);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (isLoggedIn === null) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <>
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}