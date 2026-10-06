// src/navigation/AdminNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PainelLayout } from '../shared/painel/PainelLayout';
import { ADMIN_PAINEL } from '../features/admin/navigation/adminMenu';
import AdminDashboardScreen from '../features/admin/dashboard/screens/AdminDashboardScreen';
import AlimentosListScreen from '../features/admin/screens/AlimentosListScreen';
import AlimentoFormScreen from '../features/admin/screens/AlimentoFormScreen';
import UsuariosScreen from '../features/admin/screens/UsuariosScreen';
import UsuarioDetalheScreen from '../features/admin/screens/UsuarioDetalheScreen';
import NutricionistasScreen from '../features/admin/screens/NutricionistasScreen';
import ModeracaoScreen from '../features/admin/screens/ModeracaoScreen';
import ConfiguracoesScreen from '../features/admin/screens/ConfiguracoesScreen';
import DesafiosScreen from '../shared/painel/screens/DesafiosScreen';
import EditarTrilhaScreen from '../features/conteudo/screens/EditarTrilhaScreen';
import EditarLicaoScreen from '../features/conteudo/screens/EditarLicaoScreen';
import EditarReceitaScreen from '../features/conteudo/screens/EditarReceitaScreen';
import AnalyticsScreen from '../shared/painel/screens/AnalyticsScreen';
import FluxoConteudoScreen from '../features/conteudo/screens/FluxoConteudoScreen';
import AuditoriaScreen from '../features/conteudo/screens/AuditoriaScreen';
import ConteudoDetalheScreen from '../features/conteudo/screens/ConteudoDetalheScreen';
import LicaoPreviewScreen from '../features/conteudo/screens/LicaoPreviewScreen';

export type AdminStackParamList = {
  AdminDashboard: undefined;
  Usuarios: undefined;
  AdminNutricionistas: undefined;
  AlimentosList: undefined;
  AlimentoForm: { alimento?: any };
  AdminReceitas: undefined;
  AdminConteudos: undefined;
  AdminTrilhas: undefined;
  AdminDesafios: undefined;
  AdminModeracao: undefined;
  Metricas: undefined;
  AdminAuditoria: undefined;
  AdminConfiguracoes: undefined;
  ConteudoDetalhe: { tipo: 'TRILHA' | 'RECEITA'; conteudoId: string };
  LicaoPreview: { licaoId: string };
  UsuarioDetalhe: { id: string };
  EditarTrilha: { trilhaId?: string } | undefined;
  EditarLicao: { licaoId?: string; moduloId?: string; proximaOrdem?: number };
  EditarReceita: { receitaId?: string } | undefined;
};

const Stack = createNativeStackNavigator<AdminStackParamList>();

// Telas que já existiam (têm fundo e rolagem próprios): entram dentro do
// layout do painel sem serem reescritas.
function comPainel(Tela: React.ComponentType<any>, titulo: string, opts: { voltar?: boolean } = {}) {
  return function TelaNoPainel(props: any) {
    return (
      <PainelLayout config={ADMIN_PAINEL} titulo={titulo} rolagem={false} moldura voltar={opts.voltar}>
        <Tela {...props} />
      </PainelLayout>
    );
  };
}

const AlimentosNoPainel = comPainel(AlimentosListScreen, 'Alimentos');
const AlimentoFormNoPainel = comPainel(AlimentoFormScreen, 'Alimento', { voltar: true });
const MetricasNoPainel = () => <AnalyticsScreen config={ADMIN_PAINEL} />;
const DetalheNoPainel = (props: any) => <ConteudoDetalheScreen config={ADMIN_PAINEL} route={props.route} />;
const LicaoPreviewNoPainel = comPainel(LicaoPreviewScreen, 'Lição', { voltar: true });
const Receitas = () => <FluxoConteudoScreen config={ADMIN_PAINEL} titulo="Receitas" subtitulo="Consulte, organize e envie receitas para revisão" tipo="RECEITA" />;
const Conteudos = () => <FluxoConteudoScreen config={ADMIN_PAINEL} titulo="Conteúdos" subtitulo="Consulte tudo que passa pela aprovação da nutricionista" />;
const Trilhas = () => <FluxoConteudoScreen config={ADMIN_PAINEL} titulo="Trilhas" subtitulo="Organize e envie trilhas para aprovação" tipo="TRILHA" />;
const Auditoria = () => <AuditoriaScreen config={ADMIN_PAINEL} />;
const Desafios = () => <DesafiosScreen config={ADMIN_PAINEL} />;
const EditarTrilha = (props: any) => <EditarTrilhaScreen config={ADMIN_PAINEL} route={props.route} />;
const EditarLicao = (props: any) => <EditarLicaoScreen config={ADMIN_PAINEL} route={props.route} />;
const EditarReceita = (props: any) => <EditarReceitaScreen config={ADMIN_PAINEL} route={props.route} />;

export default function AdminNavigator() {
  return (
    // animation:'none' — o menu lateral faz parte de cada tela; sem transição ele não "pisca"
    <Stack.Navigator initialRouteName="AdminDashboard" screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="Usuarios" component={UsuariosScreen} />
      <Stack.Screen name="UsuarioDetalhe" component={UsuarioDetalheScreen} />
      <Stack.Screen name="AdminNutricionistas" component={NutricionistasScreen} />
      <Stack.Screen name="AlimentosList" component={AlimentosNoPainel} />
      <Stack.Screen name="AlimentoForm" component={AlimentoFormNoPainel} />
      <Stack.Screen name="AdminReceitas" component={Receitas} />
      <Stack.Screen name="AdminConteudos" component={Conteudos} />
      <Stack.Screen name="AdminTrilhas" component={Trilhas} />
      <Stack.Screen name="AdminDesafios" component={Desafios} />
      <Stack.Screen name="AdminModeracao" component={ModeracaoScreen} />
      <Stack.Screen name="Metricas" component={MetricasNoPainel} />
      <Stack.Screen name="AdminAuditoria" component={Auditoria} />
      <Stack.Screen name="AdminConfiguracoes" component={ConfiguracoesScreen} />
      <Stack.Screen name="ConteudoDetalhe" component={DetalheNoPainel} />
      <Stack.Screen name="LicaoPreview" component={LicaoPreviewNoPainel} />
      <Stack.Screen name="EditarTrilha" component={EditarTrilha} />
      <Stack.Screen name="EditarLicao" component={EditarLicao} />
      <Stack.Screen name="EditarReceita" component={EditarReceita} />
    </Stack.Navigator>
  );
}
