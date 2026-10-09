// src/navigation/NutricionistaNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PainelLayout } from '../shared/painel/PainelLayout';
import { criarScreenLayout } from '../shared/painel/components/LimiteErroRota';
import { NUTRICIONISTA_PAINEL } from '../features/nutricionista/navigation/nutricionistaMenu';
import AnalyticsScreen from '../shared/painel/screens/AnalyticsScreen';
import FluxoConteudoScreen from '../features/conteudo/screens/FluxoConteudoScreen';
import ConteudoDetalheScreen from '../features/conteudo/screens/ConteudoDetalheScreen';
import LicaoPreviewScreen from '../features/conteudo/screens/LicaoPreviewScreen';
import ParticipantesScreen from '../features/nutricionista/screens/ParticipantesScreen';
import ParticipanteDetalheScreen from '../features/nutricionista/screens/ParticipanteDetalheScreen';
import DesafiosScreen from '../shared/painel/screens/DesafiosScreen';
import EditarTrilhaScreen from '../features/conteudo/screens/EditarTrilhaScreen';
import EditarLicaoScreen from '../features/conteudo/screens/EditarLicaoScreen';
import EditarReceitaScreen from '../features/conteudo/screens/EditarReceitaScreen';
import NutricionistaDashboardScreen from '../features/nutricionista/dashboard/screens/NutricionistaDashboardScreen';

export type NutricionistaStackParamList = {
  NutricionistaDashboard: undefined;
  ParticipantesList: undefined;
  NutriAprovacoes: undefined;
  ConteudoList: undefined;
  NutriReceitas: undefined;
  NutriTrilhas: undefined;
  NutriDesafios: undefined;
  NutriAnalytics: undefined;
  ConteudoDetalhe: { tipo: 'TRILHA' | 'RECEITA'; conteudoId: string };
  LicaoPreview: { licaoId: string };
  ParticipanteDetalhe: { id: string };
  EditarTrilha: { trilhaId?: string } | undefined;
  EditarLicao: { licaoId?: string; moduloId?: string; proximaOrdem?: number };
  EditarReceita: { receitaId?: string } | undefined;
};

const Stack = createNativeStackNavigator<NutricionistaStackParamList>();
const screenLayout = criarScreenLayout(NUTRICIONISTA_PAINEL);

function comPainel(Tela: React.ComponentType<any>, titulo: string) {
  return function TelaNoPainel(props: any) {
    return (
      <PainelLayout config={NUTRICIONISTA_PAINEL} titulo={titulo} rolagem={false} moldura voltar>
        <Tela {...props} />
      </PainelLayout>
    );
  };
}
const DetalheNoPainel = (props: any) => <ConteudoDetalheScreen config={NUTRICIONISTA_PAINEL} route={props.route} />;
const LicaoPreviewNoPainel = comPainel(LicaoPreviewScreen, 'Lição');
const Aprovacoes = () => <FluxoConteudoScreen config={NUTRICIONISTA_PAINEL} titulo="Aprovações" subtitulo="Aguardando sua decisão ou publicação" fila />;
const Conteudos = () => <FluxoConteudoScreen config={NUTRICIONISTA_PAINEL} titulo="Conteúdos" subtitulo="Todo o conteúdo educativo e nutricional" />;
const Receitas = () => <FluxoConteudoScreen config={NUTRICIONISTA_PAINEL} titulo="Receitas" subtitulo="Revisão nutricional das receitas" tipo="RECEITA" />;
const Trilhas = () => <FluxoConteudoScreen config={NUTRICIONISTA_PAINEL} titulo="Trilhas" subtitulo="Revisão das trilhas educativas" tipo="TRILHA" />;
const Desafios = () => <DesafiosScreen config={NUTRICIONISTA_PAINEL} />;
const EditarTrilha = (props: any) => <EditarTrilhaScreen config={NUTRICIONISTA_PAINEL} route={props.route} />;
const EditarLicao = (props: any) => <EditarLicaoScreen config={NUTRICIONISTA_PAINEL} route={props.route} />;
const EditarReceita = (props: any) => <EditarReceitaScreen config={NUTRICIONISTA_PAINEL} route={props.route} />;
const Analytics = () => <AnalyticsScreen config={NUTRICIONISTA_PAINEL} />;

export default function NutricionistaNavigator() {
  return (
    <Stack.Navigator initialRouteName="NutricionistaDashboard" screenOptions={{ headerShown: false, animation: 'none' }} screenLayout={screenLayout}>
      <Stack.Screen name="NutricionistaDashboard" component={NutricionistaDashboardScreen} />
      <Stack.Screen name="ParticipantesList" component={ParticipantesScreen} />
      <Stack.Screen name="ParticipanteDetalhe" component={ParticipanteDetalheScreen} />
      <Stack.Screen name="NutriAprovacoes" component={Aprovacoes} />
      <Stack.Screen name="ConteudoList" component={Conteudos} />
      <Stack.Screen name="NutriReceitas" component={Receitas} />
      <Stack.Screen name="NutriTrilhas" component={Trilhas} />
      <Stack.Screen name="NutriDesafios" component={Desafios} />
      <Stack.Screen name="NutriAnalytics" component={Analytics} />
      <Stack.Screen name="ConteudoDetalhe" component={DetalheNoPainel} />
      <Stack.Screen name="LicaoPreview" component={LicaoPreviewNoPainel} />
      <Stack.Screen name="EditarTrilha" component={EditarTrilha} />
      <Stack.Screen name="EditarLicao" component={EditarLicao} />
      <Stack.Screen name="EditarReceita" component={EditarReceita} />
    </Stack.Navigator>
  );
}
