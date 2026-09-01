// src/features/auth/hooks/useSignup.ts
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useMessageBanner } from '../../../shared/hooks/useMessageBanner';
import { signupState } from '../../../shared/state/signupFlag';
import { useAuth } from '../../../shared/contexts/AuthContext';
import {
  toIsoDate,
  validateNome,
  validateDataNascimento,
  validateEmail,
  validatePassword,
} from '../utils/signupValidators';

interface SignupForm {
  nome: string;
  dataNascimento: string;
  tipoEscola: string | null;
  genero: string | null;
  email: string;
  password: string;
  aceitouTermos: boolean;
}

export function useSignup() {
  const [loading, setLoading] = useState(false);
  const { message, type, showMessage, clearMessage } = useMessageBanner();
  const { definirNomeCompleto } = useAuth();

  async function handleSignup(form: SignupForm): Promise<boolean> {
    const { nome, dataNascimento, tipoEscola, genero, email, password, aceitouTermos } = form;

    const erroNome = validateNome(nome);
    if (erroNome) {
      showMessage(erroNome, 'error');
      return false;
    }

    const erroData = validateDataNascimento(dataNascimento);
    if (erroData) {
      showMessage(erroData, 'error');
      return false;
    }

    if (!tipoEscola) {
      showMessage('Selecione o tipo de escola', 'error');
      return false;
    }

    if (!genero) {
      showMessage('Selecione o gênero', 'error');
      return false;
    }

    const erroEmail = validateEmail(email);
    if (erroEmail) {
      showMessage(erroEmail, 'error');
      return false;
    }

    const erroSenha = validatePassword(password);
    if (erroSenha) {
      showMessage(erroSenha, 'error');
      return false;
    }

    if (!aceitouTermos) {
      showMessage('Você precisa aceitar os termos de uso para continuar', 'error');
      return false;
    }

    setLoading(true);
    signupState.emAndamento = true; // liga a flag ANTES do signUp

    const dataIso = toIsoDate(dataNascimento) as string;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setLoading(false);
      signupState.emAndamento = false;
      let mensagem = 'Não conseguimos criar sua conta :(';
      if (error.message.includes('already registered')) {
        mensagem = 'Já existe uma conta com esse email';
      } else if (error.message.includes('Password')) {
        mensagem = 'A senha não atende aos requisitos de segurança do Supabase';
      }
      showMessage(mensagem, 'error');
      return false;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      signupState.emAndamento = false;
      showMessage('Não foi possível concluir o cadastro, tente novamente', 'error');
      return false;
    }

    if (data.session) {
      try {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      } catch (e) {
        console.error('[useSignup] setSession lançou exceção:', e);
      }
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      nome,
      data_nascimento: dataIso,
      tipo_instituicao: tipoEscola,
      genero: genero,
      etapa_onboarding: 'TRIAGEM', // <- próxima parada
    });

    if (profileError) {
        setLoading(false);
        signupState.emAndamento = false;
        console.error('Erro real ao salvar perfil:', profileError);
        showMessage('Conta criada, mas houve um erro ao salvar seu perfil', 'error');
        return false;
    }

    const { error: consentError } = await supabase.from('consentimentos').insert({
      user_id: userId,
      aceite_termos: true,
      versao_termo: '1.0',
      conteudo: 'Termos de uso e política de privacidade versão 1.0',
    });

    setLoading(false);

    if (consentError) {
      signupState.emAndamento = false;
      console.error('Erro real ao salvar consentimento:', consentError);
      showMessage('Conta criada, mas houve um erro ao registrar o aceite dos termos', 'error');
      return false;
    }

    // profile e consentimento já existem agora. Em vez de tentar buscar o
    // nome de volta do banco (o AuthContext pode ainda não ter processado
    // o SIGNED_IN e ter userId=null nesse instante — refrescarPerfil()
    // viraria um no-op silencioso), seta direto: quem está cadastrando já
    // digitou o próprio nome no formulário, não tem o que buscar de novo.
    definirNomeCompleto(nome);

    await supabase.auth.refreshSession();
    signupState.emAndamento = false;

    // a partir daqui o RootNavigator detecta a sessão e troca de stack sozinho
    return true;
  }

  return { loading, message, type, showMessage, clearMessage, handleSignup };
}