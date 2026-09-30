// src/navigation/AdolescenteNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TriagemIntroScreen from '../features/adolescente/triagem/screens/TriagemIntroScreen';
import TriagemApresentacaoScreen from '../features/adolescente/triagem/screens/TriagemApresentacaoScreen';
import RecordatorioRefeicaoScreen from '../features/adolescente/triagem/recordatorio/screens/RecordatorioRefeicaoScreen';
import EbiaPerguntaScreen from '../features/adolescente/triagem/ebia/screens/EbiaPerguntaScreen';
import HomeScreen from '../features/adolescente/home/screens/HomeScreen';
import SequenciaScreen from '../features/adolescente/home/screens/SequenciaScreen';
import AlimentacaoHomeScreen from '../features/adolescente/alimentacao/screens/AlimentacaoHomeScreen';
import TrilhaScreen from '../features/adolescente/trilha/screens/TrilhaScreen';
import LicaoDetalheScreen from '../features/adolescente/trilha/screens/LicaoDetalheScreen';
import LicaoCompletaScreen from '../features/adolescente/trilha/screens/LicaoCompletaScreen';
import ModuloCompletaScreen from '../features/adolescente/trilha/screens/ModuloCompletaScreen';
import TrilhaCompletaScreen from '../features/adolescente/trilha/screens/TrilhaCompletaScreen';
import SocialScreen from '../features/adolescente/social/screens/SocialScreen';
import MaisScreen from '../features/adolescente/_shared/screens/MaisScreen';
import AtividadeFisicaScreen from '../features/adolescente/atividade-fisica/screens/AtividadeFisicaScreen';
import BuscaAtividadeScreen from '../features/adolescente/atividade-fisica/screens/BuscaAtividadeScreen';
import ProfileScreen from '../features/adolescente/perfil/screens/ProfileScreen';
import { AtividadeFisicaProvider } from '../features/adolescente/atividade-fisica/contexts/AtividadeFisicaContext';
import ConsumoAguaScreen from '../features/adolescente/agua/screens/ConsumoAguaScreen';
import TipoRefeicaoScreen from '../features/adolescente/alimentacao/screens/TipoRefeicaoScreen';
import MetodoRegistroScreen from '../features/adolescente/alimentacao/screens/MetodoRegistroScreen';
import type { Alimento, TipoRefeicao } from '../features/adolescente/alimentacao/services/alimentacaoService';
import NovoAlimentoOrigemScreen from '../features/adolescente/alimentacao/screens/NovoAlimentoOrigemScreen';
import type { OrigemAlimento } from '../features/adolescente/alimentacao/screens/NovoAlimentoOrigemScreen';
import BuscaAlimentoScreen from '../features/adolescente/alimentacao/screens/BuscaAlimentoScreen';
import NovoAlimentoFormScreen from '../features/adolescente/alimentacao/screens/NovoAlimentoFormScreen';
import AlimentoCadastradoScreen from '../features/adolescente/alimentacao/screens/AlimentoCadastradoScreen';
import FeedbackRefeicaoScreen from '../features/adolescente/alimentacao/screens/FeedbackRefeicaoScreen';
import { AlimentacaoProvider } from '../features/adolescente/alimentacao/contexts/AlimentacaoContext';

export type AdolescenteStackParamList = {
  TriagemIntro: undefined;
  TriagemApresentacao: undefined;
  RecordatorioRefeicao: { indice: number; recordatorioId?: string };
  EbiaPergunta: { indice: number; respostasAnteriores: boolean[] };
  Home: undefined;
  Sequencia: undefined;
  Alimentacao: undefined;
  Trilha: undefined;
  LicaoDetalhe: {
    licaoId: string;
    tipo: 'conteudo' | 'quiz' | 'atividade_rastreavel';
    titulo: string;
    xpRecompensa: number;
  };
  // Lição comum — não fechou módulo nem trilha.
  LicaoCompleta: { xpGanho: number };
  // Essa era a última lição pendente do módulo (a Revisão dele) — mostra
  // ACERTOS além do XP (decisão 3 do histórico de desenho).
  ModuloCompleta: { xpGanho: number; acertosPercentual: number };
  // Essa era a última lição pendente da trilha inteira (o "Fechamento do
  // Capítulo" do módulo 3) — também mostra ACERTOS.
  TrilhaCompleta: { xpGanho: number; acertosPercentual: number };
  Social: undefined;
  Mais: undefined;
  AtividadeFisica: undefined;
  BuscaAtividade: undefined;
  Profile: undefined;
  BuscaAlimento: { tipo: TipoRefeicao; nomeRefeicao: string; alimentoRecemCriado?: Alimento };
  NovoAlimentoOrigem: { tipo: TipoRefeicao; nomeRefeicao: string };
  NovoAlimentoForm: { tipo: TipoRefeicao; nomeRefeicao: string; origem: OrigemAlimento };
  AlimentoCadastrado: { tipo: TipoRefeicao; nomeRefeicao: string; alimento: Alimento };
  FeedbackRefeicao: {
  tipo: TipoRefeicao;
  nomeRefeicao: string;
  nivelQualidade: 'EXCELENTE' | 'EQUILIBRADO' | 'ATENCAO_ULTRAPROCESSADO';
  intensidade: number;
  processamento: string;
  nutricional: string;
  melhoria: string;
  missao: { titulo: string; texto: string; nutriente: string } | null;
  };  
  ConsumoAgua: undefined;
  TipoRefeicao:undefined;
  MetodoRegistroAlimentar: { tipo: TipoRefeicao; nomeRefeicao: string };
};

const Stack = createNativeStackNavigator<AdolescenteStackParamList>();

type EtapaOnboarding = 'APRESENTACAO' | 'CADASTRO' | 'TRIAGEM' | 'ORIENTACOES' | 'CONCLUIDO';

interface Props {
  etapaOnboarding: EtapaOnboarding;
}

export default function AdolescenteNavigator({ etapaOnboarding }: Props) {
  return (
    <AtividadeFisicaProvider>
        <AlimentacaoProvider>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {etapaOnboarding === 'TRIAGEM' ? (
                <>
                    <Stack.Screen name="TriagemIntro" component={TriagemIntroScreen} />
                    <Stack.Screen name="TriagemApresentacao" component={TriagemApresentacaoScreen} />
                    <Stack.Screen name="RecordatorioRefeicao" component={RecordatorioRefeicaoScreen} />
                    <Stack.Screen name="EbiaPergunta" component={EbiaPerguntaScreen} />
                    <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Sequencia" component={SequenciaScreen} options={{ presentation: 'modal' }} />
                    <Stack.Screen name="Alimentacao" component={AlimentacaoHomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Trilha" component={TrilhaScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="LicaoDetalhe" component={LicaoDetalheScreen} />
                    <Stack.Screen name="LicaoCompleta" component={LicaoCompletaScreen} />
                    <Stack.Screen name="ModuloCompleta" component={ModuloCompletaScreen} />
                    <Stack.Screen name="TrilhaCompleta" component={TrilhaCompletaScreen} />
                    <Stack.Screen name="Social" component={SocialScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Mais" component={MaisScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="AtividadeFisica" component={AtividadeFisicaScreen} />
                    <Stack.Screen name="BuscaAtividade" component={BuscaAtividadeScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="ConsumoAgua" component={ConsumoAguaScreen} />
                    <Stack.Screen name="TipoRefeicao" component={TipoRefeicaoScreen} />
                    <Stack.Screen name="MetodoRegistroAlimentar" component={MetodoRegistroScreen} />
                    <Stack.Screen name="BuscaAlimento" component={BuscaAlimentoScreen} />
                    <Stack.Screen name="NovoAlimentoOrigem" component={NovoAlimentoOrigemScreen} />
                    <Stack.Screen name="NovoAlimentoForm" component={NovoAlimentoFormScreen} />
                    <Stack.Screen name="AlimentoCadastrado" component={AlimentoCadastradoScreen} />
                    <Stack.Screen name="FeedbackRefeicao" component={FeedbackRefeicaoScreen} />                    
                </>
                ) : (
                <>
                    <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Sequencia" component={SequenciaScreen} options={{ presentation: 'modal' }} />
                    <Stack.Screen name="Alimentacao" component={AlimentacaoHomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Trilha" component={TrilhaScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="LicaoDetalhe" component={LicaoDetalheScreen} />
                    <Stack.Screen name="LicaoCompleta" component={LicaoCompletaScreen} />
                    <Stack.Screen name="ModuloCompleta" component={ModuloCompletaScreen} />
                    <Stack.Screen name="TrilhaCompleta" component={TrilhaCompletaScreen} />
                    <Stack.Screen name="Social" component={SocialScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Mais" component={MaisScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="AtividadeFisica" component={AtividadeFisicaScreen} />
                    <Stack.Screen name="BuscaAtividade" component={BuscaAtividadeScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="ConsumoAgua" component={ConsumoAguaScreen} />
                    <Stack.Screen name="TipoRefeicao" component={TipoRefeicaoScreen} />
                    <Stack.Screen name="MetodoRegistroAlimentar" component={MetodoRegistroScreen} />
                    <Stack.Screen name="BuscaAlimento" component={BuscaAlimentoScreen} />
                    <Stack.Screen name="NovoAlimentoOrigem" component={NovoAlimentoOrigemScreen} />
                    <Stack.Screen name="NovoAlimentoForm" component={NovoAlimentoFormScreen} />
                    <Stack.Screen name="AlimentoCadastrado" component={AlimentoCadastradoScreen} />
                    <Stack.Screen name="FeedbackRefeicao" component={FeedbackRefeicaoScreen} />
                </>
                )}
            </Stack.Navigator>
      </AlimentacaoProvider>
    </AtividadeFisicaProvider>
  );
}
