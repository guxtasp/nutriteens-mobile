// src/features/auth/screens/RedefinirSenhaScreen.tsx
//
// Só é montada pelo RootNavigator quando `emRecuperacaoSenha` está true
// (ver AuthContext) — ou seja, exclusivamente depois que o usuário clicou
// no link de "esqueci minha senha" recebido por email. Nesse momento já
// existe uma sessão válida (o Supabase autentica via o token do próprio
// link), então aqui só falta pedir a senha nova e chamar updateUser.
import React, { useState } from 'react';
import { View, Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { MessageBanner } from '../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../shared/hooks/useMessageBanner';
import { validatePassword } from '../utils/signupValidators';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../shared/contexts/AuthContext';

const LARGURA_DESKTOP = 760;

export default function RedefinirSenhaScreen() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [loading, setLoading] = useState(false);
  const { message, type, showMessage, clearMessage } = useMessageBanner();
  const { sairDoModoRecuperacao } = useAuth();
  const { width } = useWindowDimensions();
  const ehDesktop = Platform.OS === 'web' && width >= LARGURA_DESKTOP;

  async function handleConfirmar() {
    const erroSenha = validatePassword(novaSenha);
    if (erroSenha) {
      showMessage(erroSenha, 'error');
      return;
    }
    if (novaSenha !== confirmacao) {
      showMessage('As senhas digitadas não são iguais', 'error');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setLoading(false);

    if (error) {
      console.error('Erro ao redefinir senha:', error);
      showMessage('Não conseguimos trocar sua senha. Tente pedir um novo link.', 'error');
      return;
    }

    // Desloga de propósito em vez de deixar o usuário seguir direto pro
    // app: a sessão atual veio de um link de email (pode ter ficado aberta
    // numa caixa de entrada compartilhada) — pedir login de novo com a
    // senha nova confirma que foi o dono da conta quem trocou.
    await supabase.auth.signOut();
    sairDoModoRecuperacao();
  }

  return (
    <View style={[styles.outer, ehDesktop && styles.outerDesktop]}>
      <View style={[styles.container, ehDesktop && styles.containerDesktop]}>
        <AppText style={styles.title}>Crie uma nova senha</AppText>
        <AppText style={styles.subtitle}>
          Escolha uma senha nova para a sua conta NutriTeens.
        </AppText>

        <PasswordInput label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} />
        <PasswordInput label="Confirme a nova senha" value={confirmacao} onChangeText={setConfirmacao} />

        <View style={styles.spacer} />
        <View style={styles.messageContainer}>
          <MessageBanner message={message} type={type} onClose={clearMessage} />
          <AppButton
            label={loading ? 'SALVANDO...' : 'SALVAR NOVA SENHA'}
            backgroundColor={colors.primaryDark}
            textColor={colors.white}
            shadowColor="#123024"
            fullWidth
            onPress={handleConfirmar}
          />
        </View>
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
    paddingBottom: 70,
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
  messageContainer: { marginTop: -40, flex: 1, gap: 12 },
  spacer: { height: 60 },
});
