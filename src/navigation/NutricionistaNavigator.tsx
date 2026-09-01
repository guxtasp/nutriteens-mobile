import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NutricionistaHomeScreen from '../features/nutricionista/screens/NutricionistaHomeScreen';
import ParticipantesPlaceholderScreen from '../features/nutricionista/screens/ParticipantesPlaceholderScreen';
import ConteudoPlaceholderScreen from '../features/nutricionista/screens/ConteudoPlaceholderScreen';

export type NutricionistaStackParamList = {
  NutricionistaHome: undefined;
  ParticipantesList: undefined;
  ConteudoList: undefined;
};

const Stack = createNativeStackNavigator<NutricionistaStackParamList>();

export default function NutricionistaNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="NutricionistaHome" component={NutricionistaHomeScreen} options={{ title: 'Nutricionista' }} />
      <Stack.Screen name="ParticipantesList" component={ParticipantesPlaceholderScreen} options={{ title: 'Participantes' }} />
      <Stack.Screen name="ConteudoList" component={ConteudoPlaceholderScreen} options={{ title: 'Conteúdo' }} />
    </Stack.Navigator>
  );
}