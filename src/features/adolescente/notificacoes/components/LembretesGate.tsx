// src/features/adolescente/notificacoes/components/LembretesGate.tsx
//
// Componente invisível que liga os lembretes ao app. Fica dentro do
// AdolescenteNavigator (dentro do NavigationContainer). No modo web não faz
// nada: notificações locais só existem no app do celular.
import { Platform } from 'react-native';
import { useLembretes } from '../hooks/useLembretes';

function LembretesGateNativo({ ativo }: { ativo: boolean }) {
  useLembretes(ativo);
  return null;
}

export default function LembretesGate({ ativo }: { ativo: boolean }) {
  if (Platform.OS === 'web') return null;
  return <LembretesGateNativo ativo={ativo} />;
}
