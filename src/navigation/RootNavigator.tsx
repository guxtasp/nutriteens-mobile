import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type { User } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';
import OnboardingScreen from '../features/auth/screens/OnboardingScreen';
import AppPresentationScreen from '../features/auth/presentation/AppPresentationScreen';
import LoginScreen from '../features/auth/screens/LoginScreen';
import LoginProfissionalScreen from '../features/auth/screens/LoginProfissionalScreen';
import SignupScreen from '../features/auth/screens/SignupScreen';
import EsqueciSenhaScreen from '../features/auth/screens/EsqueciSenhaScreen';
import RedefinirSenhaScreen from '../features/auth/screens/RedefinirSenhaScreen';
import CompletarCadastroScreen from '../features/auth/screens/CompletarCadastroScreen';
import LegalDocumentoScreen from '../features/legal/screens/LegalDocumentoScreen';
import SplashScreen from '../shared/ui/SplashScreen';
import SemConexaoScreen from '../shared/ui/SemConexaoScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { signupState } from '../shared/state/signupFlag';
import { useAuth } from '../shared/contexts/AuthContext';
import { ehErroDeRede } from '../shared/offline/erroRede';
import { lerCache, salvarCache } from '../shared/offline/cacheLocal';
import { decidirAcaoSessao, deveIgnorarEventoDeAuth, type ResultadoPerfil } from './decisaoSessao';
import AdolescenteNavigator from './AdolescenteNavigator';
import NutricionistaNavigator from './NutricionistaNavigator';
import AdminNavigator from './AdminNavigator';
import { TemaPainelProvider } from '../shared/painel/tema/TemaPainelContext';

export type RootStackParamList = {
  Onboarding: undefined;
  AppPresentation: undefined;
  Login: undefined;
  LoginProfissional: undefined;
  Signup: undefined;
  EsqueciSenha: undefined;
  RedefinirSenha: undefined;
  TermosDeUso: { documento: 'termos' };
  PoliticaPrivacidade: { documento: 'privacidade' };
};

const StackRecuperacao = createNativeStackNavigator<{ RedefinirSenha: undefined }>();
const StackCompletarCadastro = createNativeStackNavigator<{
  CompletarCadastro: undefined;
  TermosDeUso: { documento: 'termos' };
  PoliticaPrivacidade: { documento: 'privacidade' };
}>();

const Stack = createNativeStackNavigator<RootStackParamList>();

type EtapaOnboarding = 'APRESENTACAO' | 'CADASTRO' | 'TRIAGEM' | 'ORIENTACOES' | 'CONCLUIDO';
type Papel = 'ADOLESCENTE' | 'NUTRICIONISTA' | 'ADMINISTRADOR';

// Cópia mínima do perfil, só para o app conseguir abrir sem internet. Quem manda
// de verdade é sempre o servidor (RLS) — isto só decide qual navegador mostrar.
type PerfilEmCache = { papel: Papel; etapa_onboarding: EtapaOnboarding };
const chaveCachePerfil = (userId: string) => `perfil:${userId}`;

// Com a tela "sem conexão" aberta, tenta de novo sozinho neste intervalo.
const INTERVALO_RETENTATIVA_MS = 8000;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function RootNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [papel, setPapel] = useState<Papel | null>(null);
  const [etapaOnboarding, setEtapaOnboarding] = useState<EtapaOnboarding | null>(null);
  // Sessão de login social (Google) que ainda não tem profile: em vez de
  // tratar como sessão órfã e deslogar, pede os dados que faltam.
  const [perfilPendente, setPerfilPendente] = useState<{ user: User; nomeSugerido: string } | null>(null);
  // Há sessão salva, mas não deu pra carregar a conta (internet ruim) e ainda
  // não existe nada em cache: mostra "sem conexão" em vez da tela de login.
  const [perfilIndisponivel, setPerfilIndisponivel] = useState(false);
  const [tentandoNovamente, setTentandoNovamente] = useState(false);
  const { emRecuperacaoSenha } = useAuth();

  // Espelho do papel para os listeners (que ficam com a versão antiga do state).
  const papelRef = useRef<Papel | null>(null);
  useEffect(() => {
    papelRef.current = papel;
  }, [papel]);
  const retentativaEmAndamento = useRef(false);

  function aplicarPerfil(perfil: PerfilEmCache) {
    setPerfilPendente(null);
    setPapel(perfil.papel);
    setEtapaOnboarding(perfil.etapa_onboarding);
  }

  // Carrega papel e etapa do profile. Nunca decide "deslogar" por causa de falha
  // de rede: só uma resposta REAL do servidor dizendo que o profile não existe
  // (PGRST116, depois de uma segunda tentativa) conta como sessão órfã.
  async function carregarPerfil(user: User): Promise<ResultadoPerfil> {
    const userId = user.id;
    async function buscar() {
      return supabase
        .from('profiles')
        .select('papel, etapa_onboarding')
        .eq('id', userId)
        .single();
    }

    let { data, error } = await buscar();

    // Login social sem profile = cadastro com Google ainda incompleto, não sessão órfã.
    if (error?.code === 'PGRST116' && !signupState.emAndamento) {
      const providers: string[] = user.app_metadata?.providers ?? [user.app_metadata?.provider ?? 'email'];
      if (providers.some((p) => p !== 'email')) {
        const meta = user.user_metadata ?? {};
        setPerfilPendente({ user, nomeSugerido: String(meta.full_name ?? meta.name ?? '') });
        return 'logado';
      }
    }

    if (error?.code === 'PGRST116') {
      if (signupState.emAndamento) {
        // cadastro em andamento: o insert do profile ainda não terminou.
        // não desloga — o useSignup avisa o RootNavigator quando terminar.
        return 'deslogado';
      }
      await esperar(1500);
      ({ data, error } = await buscar());
    }

    if (error) {
      if (error.code === 'PGRST116') {
        if (signupState.emAndamento) {
          return 'deslogado';
        }
        console.warn('Profile não encontrado para userId, sessão órfã. Deslogando.');
        await supabase.auth.signOut();
        return 'deslogado';
      }

      // Qualquer outro erro (sem internet, timeout, servidor fora do ar) não
      // prova que a conta deixou de existir. Se já abrimos este usuário antes,
      // usa a cópia local e deixa o app funcionar offline.
      if (ehErroDeRede(error)) {
        const copia = await lerCache<PerfilEmCache>(chaveCachePerfil(userId));
        if (copia?.papel) {
          aplicarPerfil(copia);
          return 'logado';
        }
      }
      console.error('Erro ao carregar profile:', error);
      return 'indisponivel';
    }

    if (!data) {
      console.error('Profile veio vazio sem erro reportado — caso inesperado');
      return 'indisponivel';
    }

    const perfil: PerfilEmCache = {
      papel: data.papel as Papel,
      etapa_onboarding: data.etapa_onboarding as EtapaOnboarding,
    };
    aplicarPerfil(perfil);
    void salvarCache(chaveCachePerfil(userId), perfil);
    return 'logado';
  }

  function aplicarResultado(resultado: ResultadoPerfil) {
    // a regra de decisão fica em decisaoSessao.ts (testada); aqui só aplica
    switch (decidirAcaoSessao(resultado, papelRef.current !== null)) {
      case 'entrar':
        setPerfilIndisponivel(false);
        setIsLoggedIn(true);
        break;
      case 'sair':
        setPerfilIndisponivel(false);
        setIsLoggedIn(false);
        break;
      case 'aguardar_conexao':
        setPerfilIndisponivel(true);
        break;
      case 'manter':
        break;
    }
  }

  useEffect(() => {
    const MIN_SPLASH_TIME = 1000;
    const startTime = Date.now();

    supabase.auth.getSession().then(async ({ data, error }) => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(MIN_SPLASH_TIME - elapsed, 0);

      let resultado: ResultadoPerfil = 'deslogado';
      if (data.session) {
        resultado = await carregarPerfil(data.session.user);
      } else if (error && ehErroDeRede(error)) {
        // token vencido + sem internet: a sessão continua salva, só não deu pra
        // renová-la agora. Não é logout.
        resultado = 'indisponivel';
      }

      setTimeout(() => {
        aplicarResultado(resultado);
      }, remaining);
    }).catch((erro) => {
      console.error('Erro ao obter sessão inicial:', erro);
      aplicarResultado(ehErroDeRede(erro) ? 'indisponivel' : 'deslogado');
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (evento, session) => {
      // ver decisaoSessao.ts: só INITIAL_SESSION é ignorado. Os demais eventos
      // (inclusive TOKEN_REFRESHED) recarregam o perfil de propósito.
      if (deveIgnorarEventoDeAuth(evento)) return;

      if (session) {
        aplicarResultado(await carregarPerfil(session.user));
      } else {
        setPapel(null);
        setEtapaOnboarding(null);
        setPerfilPendente(null);
        setPerfilIndisponivel(false);
        setIsLoggedIn(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const tentarNovamente = useCallback(async () => {
    if (retentativaEmAndamento.current) return;
    retentativaEmAndamento.current = true;
    setTentandoNovamente(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        aplicarResultado(await carregarPerfil(data.session.user));
      } else if (!(error && ehErroDeRede(error))) {
        aplicarResultado('deslogado');
      }
      // senão: continua sem conexão; a próxima tentativa automática resolve
    } catch (erro) {
      console.error('Erro ao tentar reconectar:', erro);
    } finally {
      retentativaEmAndamento.current = false;
      setTentandoNovamente(false);
    }
  }, []);

  // Enquanto a tela "sem conexão" está aberta, tenta reconectar sozinho.
  useEffect(() => {
    if (!perfilIndisponivel) return;
    const intervalo = setInterval(() => {
      void tentarNovamente();
    }, INTERVALO_RETENTATIVA_MS);
    return () => clearInterval(intervalo);
  }, [perfilIndisponivel, tentarNovamente]);

  // Prioridade máxima: veio de um link de "esqueci minha senha". Ignora
  // isLoggedIn/papel de propósito — mesmo que a sessão do link pertença a
  // uma conta válida, não deixamos cair direto no app sem antes trocar a
  // senha (ver comentário em AuthContext.emRecuperacaoSenha).
  if (emRecuperacaoSenha) {
    return (
      <NavigationContainer>
        <StackRecuperacao.Navigator screenOptions={{ headerShown: false }}>
          <StackRecuperacao.Screen name="RedefinirSenha" component={RedefinirSenhaScreen} />
        </StackRecuperacao.Navigator>
      </NavigationContainer>
    );
  }

  if (perfilPendente) {
    const { user, nomeSugerido } = perfilPendente;
    return (
      <NavigationContainer>
        <StackCompletarCadastro.Navigator screenOptions={{ headerShown: false }}>
          <StackCompletarCadastro.Screen name="CompletarCadastro">
            {() => (
              <CompletarCadastroScreen
                userId={user.id}
                nomeSugerido={nomeSugerido}
                onConcluido={async () => {
                  await carregarPerfil(user);
                }}
                onSair={() => {
                  supabase.auth.signOut();
                }}
              />
            )}
          </StackCompletarCadastro.Screen>
          <StackCompletarCadastro.Screen
            name="TermosDeUso"
            component={LegalDocumentoScreen}
            initialParams={{ documento: 'termos' }}
          />
          <StackCompletarCadastro.Screen
            name="PoliticaPrivacidade"
            component={LegalDocumentoScreen}
            initialParams={{ documento: 'privacidade' }}
          />
        </StackCompletarCadastro.Navigator>
      </NavigationContainer>
    );
  }

  // Sessão salva, mas conta não carregou e não há cópia local: espera a internet
  // voltar em vez de mandar a pessoa para a tela de login.
  if (perfilIndisponivel) {
    return (
      <SemConexaoScreen
        tentando={tentandoNovamente}
        onTentarNovamente={() => void tentarNovamente()}
        // scope 'local': sair não depende de internet (só limpa o aparelho)
        onSair={() => void supabase.auth.signOut({ scope: 'local' })}
      />
    );
  }

  if (isLoggedIn === null || (isLoggedIn && papel === null)) {
    return <SplashScreen />;
  }

  function renderNavigatorLogado() {
    switch (papel) {
      case 'NUTRICIONISTA':
        return (
          <TemaPainelProvider>
            <NutricionistaNavigator />
          </TemaPainelProvider>
        );
      case 'ADMINISTRADOR':
        return (
          <TemaPainelProvider>
            <AdminNavigator />
          </TemaPainelProvider>
        );
      case 'ADOLESCENTE':
      default:
        return <AdolescenteNavigator etapaOnboarding={etapaOnboarding as EtapaOnboarding} />;
    }
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        renderNavigatorLogado()
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="AppPresentation" component={AppPresentationScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="LoginProfissional" component={LoginProfissionalScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />
          <Stack.Screen
            name="TermosDeUso"
            component={LegalDocumentoScreen}
            initialParams={{ documento: 'termos' }}
          />
          <Stack.Screen
            name="PoliticaPrivacidade"
            component={LegalDocumentoScreen}
            initialParams={{ documento: 'privacidade' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}