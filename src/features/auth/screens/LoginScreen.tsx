import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { Divider } from '../../../shared/ui/Divider';
import { GoogleButton } from '../../../shared/ui/GoogleButton';
import { MessageBanner } from '../../../shared/ui/MessageBanner';
import { AuthFormLayout } from '../../../shared/ui/AuthFormLayout';
import { useMessageBanner } from '../../../shared/hooks/useMessageBanner';
import { supabase } from '../../../lib/supabase';

import { CabecalhoAuth } from '../components/CabecalhoAuth';
import { irParaTelaAuth } from '../utils/navegacaoAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { mensagemErroLogin } from '../utils/loginErros';
import { acessoProfissionalDisponivel } from '../utils/acessoProfissional';

const LARGURA_DESKTOP = 760;

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { message, type, showMessage, clearMessage } = useMessageBanner();
  const { carregandoGoogle, continuarComGoogle } = useGoogleAuth(showMessage);
  const { width } = useWindowDimensions();
  const ehDesktop = Platform.OS === 'web' && width >= LARGURA_DESKTOP;

  async function handleLogin() {
    if (!email || !password) {
      showMessage('Preencha email e senha', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      // Mesma mensagem para qualquer recusa de login (senha errada, conta inexistente, e-mail
      // não confirmado...): mensagens diferentes revelariam quais e-mails têm conta (RF005).
      // Só falha de conexão/servidor tem texto próprio, pois não diz nada sobre a conta.
      showMessage(mensagemErroLogin(error), 'error');
      return;
    }

    showMessage('Você entrou no app!', 'success');
  }

  return (
    <View style={[styles.outer, ehDesktop && styles.outerDesktop]}>
      <AuthFormLayout
        desktop={ehDesktop}
        desktopStyle={[styles.container, styles.containerDesktop]}
        header={
          <CabecalhoAuth
            titulo="Olha você! Seja bem-vindo(a) novamente ;)"
            subtitulo="Entre para continuar a sua jornada."
            mascote={require('../../../../assets/img/cadastro/supercontente.png')}
            onVoltar={() => navigation.goBack()}
          />
        }
      >
        {/* login social primeiro: o caminho mais curto, sem digitar nada */}
        <GoogleButton
          label="Entrar com o Google"
          loading={carregandoGoogle}
          onPress={continuarComGoogle}
        />

        <Divider label="ou entre com o e-mail" />

        <LabeledInput
          label="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <PasswordInput label="Senha" value={password} onChangeText={setPassword} />

        <Pressable onPress={() => navigation.navigate('EsqueciSenha')} accessibilityRole="link">
          <AppText style={styles.forgotPassword}>Esqueci minha senha</AppText>
        </Pressable>

        <View style={styles.acoes}>
          <MessageBanner message={message} type={type} onClose={clearMessage} />
          <AppButton
            label={loading ? 'ENTRANDO...' : 'VAMOS LÁ'}
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor="#123024"
            disabled={loading}
            onPress={handleLogin}
          />
        </View>

        {/* caminho claro para quem ainda não tem conta */}
        <Pressable
          onPress={() => irParaTelaAuth(navigation, 'Signup')}
          accessibilityRole="link"
          accessibilityLabel="Ainda não tenho conta. Cadastrar"
          style={styles.linkConta}
        >
          <AppText style={styles.textoConta}>
            Ainda não tenho conta · <AppText style={styles.link}>Cadastrar</AppText>
          </AppText>
        </Pressable>

        {/* só no computador (ver acessoProfissional.ts) */}
        {acessoProfissionalDisponivel(Platform.OS, width) && (
          <Pressable onPress={() => navigation.navigate('LoginProfissional')} accessibilityRole="link" style={styles.linkProfissional}>
            <AppText style={styles.link}>Sou nutricionista ou administrador</AppText>
          </Pressable>
        )}
      </AuthFormLayout>
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
  container: { flex: 1, backgroundColor: colors.white },
  containerDesktop: {
    flex: undefined,
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7E5',
    paddingBottom: 24,
    // @ts-ignore — boxShadow só existe no web (react-native-web aceita)
    boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
  },
  link: {
    fontFamily: typography.bold,
    textDecorationLine: 'underline',
    color: colors.primaryDark,
  },
  forgotPassword: {
    fontFamily: typography.regular,
    color: colors.primaryDark,
    textAlign: 'center',
    textDecorationLine: 'underline',
    paddingVertical: 12,
    marginBottom: 12,
  },
  acoes: { gap: 12 },
  linkConta: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  textoConta: {
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  linkProfissional: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
});
