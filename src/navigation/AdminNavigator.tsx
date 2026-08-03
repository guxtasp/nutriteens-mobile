// src/navigation/AdminNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminHomeScreen from '../features/admin/screens/AdminHomeScreen';
import AlimentosListScreen from '../features/admin/screens/AlimentosListScreen';
import AlimentoFormScreen from '../features/admin/screens/AlimentoFormScreen';
import UsuariosPlaceholderScreen from '../features/admin/screens/UsuariosPlaceholderScreen';
import MetricasPlaceholderScreen from '../features/admin/screens/MetricasPlaceholderScreen';

export type AdminStackParamList = {
  AdminHome: undefined;
  AlimentosList: undefined;
  AlimentoForm: { alimento?: any };
  Usuarios: undefined;
  Metricas: undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Administração' }} />
      <Stack.Screen name="AlimentosList" component={AlimentosListScreen} options={{ title: 'Alimentos' }} />
      <Stack.Screen name="AlimentoForm" component={AlimentoFormScreen} options={{ title: 'Alimento' }} />
      <Stack.Screen name="Usuarios" component={UsuariosPlaceholderScreen} options={{ title: 'Usuários' }} />
      <Stack.Screen name="Metricas" component={MetricasPlaceholderScreen} options={{ title: 'Métricas' }} />
    </Stack.Navigator>
  );
}