// src/features/adolescente/metricas/screens/MetricasScreen.tsx
//
// Tela de rota: liga o hook à apresentação e resolve os destinos dos "próximos passos".
import React, { useCallback } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { useMetricas } from '../hooks/useMetricas';
import type { ProximoPasso } from '../utils/feedbackBroxis';
import { MetricasView } from './MetricasView';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;
type Rota = RouteProp<AdolescenteStackParamList, 'Metricas'>;

export default function MetricasScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<Rota>();
  const { estado, periodo, setPeriodo, tentarNovamente, gruposInfo, apoio, semente } = useMetricas();

  const irParaPasso = useCallback((passo: ProximoPasso) => {
    switch (passo.tipo) {
      case 'registrar_refeicao': return navigation.navigate('TipoRefeicao');
      case 'registrar_agua': return navigation.navigate('ConsumoAgua');
      case 'registrar_atividade': return navigation.navigate('AtividadeFisica');
      case 'continuar_trilha': return navigation.navigate('Trilha');
      case 'ver_missao': return navigation.navigate('Missoes');
    }
  }, [navigation]);

  return (
    <MetricasView
      estado={estado}
      periodo={periodo}
      onMudarPeriodo={setPeriodo}
      onVoltar={() => navigation.goBack()}
      onTentarNovamente={tentarNovamente}
      onProximoPasso={irParaPasso}
      gruposInfo={gruposInfo}
      apoio={apoio}
      semente={semente}
      abaInicial={(params?.aba as any)}
    />
  );
}
