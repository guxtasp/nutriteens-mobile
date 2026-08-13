// src/navigation/AdolescenteNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TriagemIntroScreen from '../features/triagem/screens/TriagemIntroScreen';
import TriagemApresentacaoScreen from '../features/triagem/screens/TriagemApresentacaoScreen';
import RecordatorioRefeicaoScreen from '../features/recordatorio/screens/RecordatorioRefeicaoScreen';
import EbiaPerguntaScreen from '../features/ebia/screens/EbiaPerguntaScreen';
import HomeScreen from '../features/adolescente/screens/HomeScreen';
import AlimentacaoHomeScreen from '../features/adolescente/screens/AlimentacaoHomeScreen';
import TrilhaScreen from '../features/adolescente/screens/TrilhaScreen';
import SocialScreen from '../features/adolescente/screens/SocialScreen';
import MaisScreen from '../features/adolescente/screens/MaisScreen';
import AtividadeFisicaScreen from '../features/adolescente/screens/AtividadeFisicaScreen';
import BuscaAtividadeScreen from '../features/adolescente/screens/BuscaAtividadeScreen';
import ProfileScreen from '../features/adolescente/screens/ProfileScreen';
import { AtividadeFisicaProvider } from '../features/adolescente/contexts/AtividadeFisicaContext';
import ConsumoAguaScreen from '../features/adolescente/screens/ConsumoAguaScreen';
import TipoRefeicaoScreen from '../features/adolescente/screens/TipoRefeicaoScreen';
import MetodoRegistroScreen from '../features/adolescente/screens/MetodoRegistroScreen';
import type { Alimento, TipoRefeicao } from '../features/adolescente/services/alimentacaoService';
import NovoAlimentoOrigemScreen from '../features/adolescente/screens/NovoAlimentoOrigemScreen';
import type { OrigemAlimento } from '../features/adolescente/screens/NovoAlimentoOrigemScreen';
import BuscaAlimentoScreen from '../features/adolescente/screens/BuscaAlimentoScreen';
import NovoAlimentoFormScreen from '../features/adolescente/screens/NovoAlimentoFormScreen';
import AlimentoCadastradoScreen from '../features/adolescente/screens/AlimentoCadastradoScreen';
import FeedbackRefeicaoScreen from '../features/adolescente/screens/FeedbackRefeicaoScreen';
import { AlimentacaoProvider } from '../features/adolescente/contexts/AlimentacaoContext';

export type AdolescenteStackParamList = {
  TriagemIntro: undefined;
  TriagemApresentacao: undefined;
  RecordatorioRefeicao: { indice: number; recordatorioId?: string };
  EbiaPergunta: { indice: number; respostasAnteriores: boolean[] };
  Home: undefined;
  Alimentacao: undefined;
  Trilha: undefined;
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
                    {/* sem animação de transição entre essas 5 telas — a troca de
                        aba é sinalizada só pelo indicador que desliza dentro da
                        própria HomeBottomBar, não por um slide de tela */}
                    <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Alimentacao" component={AlimentacaoHomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Trilha" component={TrilhaScreen} options={{ animation: 'none' }} />
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
                    {/* sem animação de transição entre essas 5 telas — a troca de
                        aba é sinalizada só pelo indicador que desliza dentro da
                        própria HomeBottomBar, não por um slide de tela */}
                    <Stack.Screen name="Home" component={HomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Alimentacao" component={AlimentacaoHomeScreen} options={{ animation: 'none' }} />
                    <Stack.Screen name="Trilha" component={TrilhaScreen} options={{ animation: 'none' }} />
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