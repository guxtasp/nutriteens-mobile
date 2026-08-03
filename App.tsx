// App.tsx
import React from 'react';
import { useFonts, Sora_400Regular, Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/shared/ui/SplashScreen'; // ou onde ela estiver
import { AuthProvider } from './src/shared/contexts/AuthContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}