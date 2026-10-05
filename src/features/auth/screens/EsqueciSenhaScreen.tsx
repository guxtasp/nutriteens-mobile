// src/features/auth/screens/EsqueciSenhaScreen.tsx
//
// Reaproveita o mesmo padrão de deep link já
// usado no login com Google (ver AuthContext) — o email do Supabase manda
// o usuário de volta pro app com um link do tipo `#access_token=...&type=recovery`,
// capturado pelo AuthProvider, que liga `emRecuperacaoSenha` e faz o
// RootNavigator mostrar só a RedefinirSenhaScreen.
import React, { useState } from 'react';
import { View, Image, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { BackButton } from '../../../shared/ui/BackButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { MessageBanner } from '../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../shared/hooks/useMessageBanner';
import { validateEmail } from '../utils/signupValidators';
import { supabase } from '../../../lib/supabase';

const LARGURA_DESKTOP = 760;

export default function EsqueciSenhaScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const { message, type, showMessage, clearMessage } = useMessageBanner();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const ehDesktop = Platform.OS === 'web' && width >= LARGURA_DESKTOP;

  async function handleEnviar() {
    const erro = validateEmail(email);
    if (erro) {
      showMessage(erro, 'error');
      return;
    }

    setLoading(true);

    // web: volta pra própria página (o hash com os tokens é processado no
    // recarregamento, igual ao retorno do Google). Nativo: reaproveita o
    // MESMO path de deep link já usado no login com Google
    // (`auth/callback`, ver LoginScreen.handleGoogleLogin) — como essa URL
    // já precisa estar cadastrada no Supabase Dashboard (Authentication >
    // URL Configuration > Redirect URLs) pro login com Google funcionar,
    // reaproveitar evita depender de cadastrar uma segunda URL lá; quem
    // decide o que fazer com o link é o `type=recovery` no hash, não o
    // path em si (ver AuthContext).
    const redirectTo =
      Platform.OS === 'web'
        ? window.location.origin + window.location.pathname
        : Linking.createURL('auth/callback');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);

    // Sempre mostra a mesma mensagem de sucesso, exista ou não uma conta
    // com esse email — não dá pra confirmar/negar a existência da conta
    // pra quem está de fora (enumeração de usuários).
    if (error) {
      console.error('Erro ao solicitar recuperação de senha:', error);
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <View style={[styles.outer, ehDesktop && styles.outerDesktop]}>
        <View style={[styles.container, ehDesktop && styles.containerDesktop]}>
          <BackButton onPress={() => navigation.navigate('Login')} style={styles.BackButton} />
          <Image
            source={require('../../../../assets/img/feedback/supercontente.png')}
            style={styles.mascoteConfirmacao}
            resizeMode="contain"
          />
          <AppText style={[styles.title, styles.tituloConfirmacao]}>Verifique seu e-mail</AppText>
          <AppText style={[styles.subtitle, styles.textoJustificado]}>
            Se {email.trim()} tiver uma conta no NutriTeens, você vai receber um link pra
            criar uma nova senha em alguns instantes. Não esqueça de olhar a caixa de spam.
          </AppText>
          <AppButton
            label="VOLTAR PARA O LOGIN"
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor="#123024"
            fullWidth={false}
            style={styles.botaoCentral}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.outer, ehDesktop && styles.outerDesktop]}>
      <MessageBanner
        message={message}
        type={type}
        onClose={clearMessage}
        style={[styles.topBanner, { top: insets.top + 12 }]}
      />
      <View style={[styles.container, ehDesktop && styles.containerDesktop]}>
        <BackButton onPress={() => navigation.goBack()} style={styles.BackButton} />

        <AppText style={[styles.title, styles.centralizado]}>Putz... Esqueceu a senha?</AppText>
        <AppText style={[styles.subtitle, styles.centralizado]}>
          Tudo bem! Vamos lá: informe o seu e-mail para recuperar a senha.
        </AppText>

        <LabeledInput
          label="E-mail"
          placeholder="Digite o seu E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <AppButton
          label={loading ? 'ENVIANDO...' : 'ENVIAR LINK'}
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          fullWidth={false}
          style={[styles.botaoCentral, styles.botaoEnviar]}
          onPress={handleEnviar}
          disabled={loading}
        />

        <Image
          source={require('../../../../assets/img/presentation/conhecer-voce.png')}
          style={styles.ilustracao}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.white },
  outerDesktop: { backgroundColor: '#F5F6F5', alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
  topBanner: { position: 'absolute', width: '90%', alignSelf: 'center', zIndex: 20 },
  BackButton: { marginBottom: 32 },
  title: {
    fontFamily: typography.bold,
    fontSize: 24,
    color: colors.primaryDark,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.regular,
    fontSize: 16,
    color: colors.primaryDark,
    marginBottom: 24,
    lineHeight: 22,
  },
  // protótipo: títulos e subtítulos centralizados; o texto da confirmação é justificado
  centralizado: { textAlign: 'center' },
  textoJustificado: { textAlign: 'justify' },
  tituloConfirmacao: { textAlign: 'center', marginTop: 16 },
  mascoteConfirmacao: { width: 130, height: 134, alignSelf: 'center' },
  // protótipo: botões mais estreitos que a tela, centralizados
  botaoCentral: { alignSelf: 'center', width: '66%' },
  botaoEnviar: { marginTop: 16 },
  ilustracao: { width: '90%', height: 260, alignSelf: 'center', marginTop: 24 },
});