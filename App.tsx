import React from 'react';
import { useFonts, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/shared/ui/SplashScreen';
import ErrorBoundary from './src/shared/ui/ErrorBoundary';
import { AuthProvider } from './src/shared/contexts/AuthContext';

export default function App() {
  // Carregando as fontes do Google Fonts
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  // Enquanto as fontes não carregam, exibe a tela de splash. Se o carregamento
  // FALHAR, segue em frente com a fonte do sistema em vez de ficar preso na
  // splash para sempre.
  const prontoParaRenderizar = fontsLoaded || !!fontError;

  return (
    // ErrorBoundary na raiz: erro de renderização em qualquer tela mostra uma
    // tela de recuperação em vez de derrubar o app.
    <ErrorBoundary>
      {/* SafeAreaProvider na raiz: dá insets (status bar, recorte, barra de
          navegação) também para o que fica FORA dos stacks, como o OfflineBanner. */}
      <SafeAreaProvider>
        {prontoParaRenderizar ? (
          // Envolvendo o RootNavigator com o AuthProvider para fornecer o contexto de autenticação
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        ) : (
          <SplashScreen />
        )}
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}