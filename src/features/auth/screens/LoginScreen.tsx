import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { BackButton } from '../../../shared/ui/BackButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { Divider } from '../../../shared/ui/Divider';
import { MessageBanner } from '../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../shared/hooks/useMessageBanner';
import { supabase } from '../../../lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const LARGURA_DESKTOP = 760;

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { message, type, showMessage, clearMessage } = useMessageBanner();
  const { width } = useWindowDimensions();
  const ehDesktop = Platform.OS === 'web' && width >= LARGURA_DESKTOP;

  async function handleLogin() {
    if (!email || !password) {
      showMessage('Preencha email e senha', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      let mensagem = 'Não conseguimos entrar :(';
      if (error.message.includes('Invalid login credentials')) {
        mensagem = 'Email ou senha estão incorretos';
      } else if (error.message.includes('User not found')) {
        mensagem = 'Essa conta não existe ainda';
      } else if (error.message.includes('Email not confirmed')) {
        mensagem = 'Confirme seu email antes de entrar';
      }
      showMessage(mensagem, 'error');
      return;
    }

    showMessage('Você entrou no app!', 'success');
  }

  async function handleGoogleLogin() {
    if (Platform.OS === 'web') {
      // No web não tem deep link nem WebBrowser: o próprio navegador é
      // redirecionado pro Google e depois volta pra cá com os tokens na
      // URL. Quem processa isso é o recuperarSessaoDaUrlWeb() no
      // AuthContext (roda em qualquer tela que a página recarregar).
      const redirectTo = window.location.origin + window.location.pathname;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });

      if (error) {
        showMessage('Erro ao entrar com Google: ' + error.message, 'error');
      }
      // se não deu erro, o navegador já está saindo desta página
      return;
    }

    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error) {
      showMessage('Erro ao entrar com Google: ' + error.message, 'error');
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'success') {
      const { url } = result;
      const params = Linking.parse(url).queryParams;

      if (params?.access_token && params?.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token as string,
          refresh_token: params.refresh_token as string,
        });
      }
    }
  }

  return (
    <View style={[styles.outer, ehDesktop && styles.outerDesktop]}>
    <View style={[styles.container, ehDesktop && styles.containerDesktop]}>
      <BackButton onPress={() => navigation.goBack()} style={styles.BackButton} />

      <AppText style={styles.title}>Olha você! Seja bem-vindo(a) novamente ;)</AppText>

      <AppText style={styles.subtitle}>
        Faça login ou{' '}
        <AppText style={styles.link} onPress={() => navigation.navigate('AppPresentation')}>
          crie uma conta aqui
        </AppText>
      </AppText>

      <LabeledInput
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <PasswordInput label="Senha" value={password} onChangeText={setPassword} />

      <Pressable onPress={() => showMessage('Funcionalidade ainda não implementada', 'info')}>
        <AppText style={styles.forgotPassword}>Esqueci minha senha</AppText>
      </Pressable>

      <Divider />

      <AppButton
        label="G  ENTRAR COM O GOOGLE"
        backgroundColor={colors.white}
        fullWidth
        borderWidth={0.5}
        outlineColor="#000000"
        textColor={colors.primaryDark}
        shadowColor={colors.primaryDark}
        onPress={handleGoogleLogin}
      />

      <View style={styles.spacer} />
      <View style={styles.messageContainer}>
        <MessageBanner message={message} type={type} onClose={clearMessage} />
        <AppButton
          label={loading ? 'ENTRANDO...' : 'VAMOS LÁ'}
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          onPress={handleLogin}
        />
      </View>

    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // No mobile o form ocupa a tela toda; no desktop web ele vira um card
  // centralizado (senão fica esticado até a borda de uma janela larga).
  outer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  outerDesktop: {
    backgroundColor: '#F5F6F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { 
    flex: 1, 
    backgroundColor: colors.white, 
    paddingHorizontal: 24, 
    paddingTop: 60,
    paddingBottom: 70, // espaço pro botão de navegação do Android
  },
  containerDesktop: {
    flex: undefined,
    width: '100%',
    maxWidth: 420,
    paddingTop: 40,
    paddingBottom: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7E5',
    // @ts-ignore — boxShadow só existe no web (react-native-web aceita)
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
  },
  BackButton: {
    marginBottom: 32,
  },
  title: { 
    fontFamily: typography.bold, 
    fontSize: 24, 
    color: colors.primaryDark, 
    lineHeight: 32, 
    marginBottom: 8 
  },
  subtitle: { 
    fontFamily: typography.regular, 
    fontSize: 16, 
    color: colors.primaryDark, 
    marginBottom: 24 
  },
  link: { 
    fontFamily: typography.bold, 
    textDecorationLine: 'underline' 
  },
  forgotPassword: { 
    fontFamily: typography.regular, 
    color: colors.primaryDark, 
    textAlign: 'center', 
    textDecorationLine: 'underline', 
    marginTop: 10,
    marginBottom: 24 
  },
  messageContainer: { 
    marginTop: -40,
    flex:1,
    gap: 12, 
  },
  spacer: { 
    height: 60 
  },
});