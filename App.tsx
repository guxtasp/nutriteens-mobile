import React from 'react';
import { useFonts, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/shared/ui/SplashScreen'; 
import { AuthProvider } from './src/shared/contexts/AuthContext';

export default function App() {
  // Carregando as fontes do Google Fonts
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  // Se as fontes ainda não foram carregadas, exibe a tela de splash
  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  // Se as fontes foram carregadas, renderiza o provedor de autenticação e o navegador raiz
  return (
    // Envolvendo o RootNavigator com o AuthProvider para fornecer o contexto de autenticação
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}