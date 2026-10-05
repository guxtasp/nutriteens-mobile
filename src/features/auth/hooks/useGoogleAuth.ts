// src/features/auth/hooks/useGoogleAuth.ts
//
// Fluxo único de "Entrar/Cadastrar com Google", usado por LoginScreen e
// SignupScreen. Login e cadastro são o MESMO fluxo no Supabase OAuth: se a
// conta Google já tem profile, entra direto; se não tem, o RootNavigator
// leva pra CompletarCadastroScreen (nome já preenchido, falta data de
// nascimento, gênero, escola e termos — dados que o Google não fornece).
import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../../lib/supabase';
import { extrairParamsOAuth } from '../utils/oauthUrl';

WebBrowser.maybeCompleteAuthSession();

type ShowMessage = (mensagem: string, tipo: 'error' | 'success' | 'info') => void;

export function useGoogleAuth(showMessage: ShowMessage) {
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);

  async function continuarComGoogle() {
    if (carregandoGoogle) return;
    setCarregandoGoogle(true);
    try {
      if (Platform.OS === 'web') {
        // O navegador sai pra o Google e volta com os tokens no hash da URL;
        // quem processa é recuperarSessaoDaUrlWeb() no AuthContext.
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) showMessage('Não conseguimos entrar com o Google. Tente de novo.', 'error');
        return;
      }

      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        console.error('Erro ao iniciar login com Google:', error);
        showMessage('Não conseguimos entrar com o Google. Tente de novo.', 'error');
        return;
      }

      const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (resultado.type !== 'success') return; // usuário fechou a janela: não é erro

      const params = extrairParamsOAuth(resultado.url);
      if (params.erro) {
        console.error('Google devolveu erro:', params.erro);
        showMessage('O login com Google foi cancelado ou negado.', 'error');
        return;
      }
      if (!params.access_token || !params.refresh_token) {
        showMessage('Não recebemos a confirmação do Google. Tente de novo.', 'error');
        return;
      }

      const { error: erroSessao } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (erroSessao) {
        console.error('Erro ao criar sessão do Google:', erroSessao);
        showMessage('Não conseguimos concluir o login com o Google.', 'error');
      }
      // sucesso: o onAuthStateChange do RootNavigator assume daqui
    } catch (e) {
      console.error('Erro inesperado no login com Google:', e);
      showMessage('Algo deu errado com o login do Google. Tente de novo.', 'error');
    } finally {
      setCarregandoGoogle(false);
    }
  }

  return { carregandoGoogle, continuarComGoogle };
}
