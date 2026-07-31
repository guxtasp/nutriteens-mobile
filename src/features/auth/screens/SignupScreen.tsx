// src/features/auth/screens/SignupScreen.tsx
import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { BackButton } from '../../../shared/ui/BackButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { DateInput } from '../../../shared/ui/DateInput';
import { RadioGroup } from '../../../shared/ui/RadioGroup';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { Divider } from '../../../shared/ui/Divider';
import { MessageBanner } from '../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../shared/hooks/useMessageBanner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const TIPO_ESCOLA_OPTIONS = [
  { label: 'Pública', value: 'PUBLICA' },
  { label: 'Privada', value: 'PRIVADA' },
  { label: 'Filantrópica', value: 'FILANTROPICA' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

// converte DD/MM/AAAA -> AAAA-MM-DD (formato aceito pela coluna DATE do Postgres)
function toIsoDate(brDate: string): string | null {
  const match = brDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

// checa se dia/mês/ano formam uma data real (rejeita 31/02, 30/02 em ano não bissexto etc.)
function isRealDate(day: number, month: number, year: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validateNome(value: string): string | null {
  const palavras = value.trim().split(/\s+/).filter(Boolean);
  if (palavras.length < 2) {
    return 'Digite seu nome completo (nome e sobrenome)';
  }
  return null;
}

function validateDataNascimento(value: string): string | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return 'Digite a data no formato DD/MM/AAAA';
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (!isRealDate(day, month, year)) {
    return 'Digite uma data de nascimento válida';
  }

  const hoje = new Date();
  const dataInformada = new Date(year, month - 1, day);
  if (dataInformada > hoje) {
    return 'A data de nascimento não pode ser no futuro';
  }

  return null;
}

function validateEmail(value: string): string | null {
  if (!EMAIL_REGEX.test(value.trim())) {
    return 'Digite um e-mail em um formato válido';
  }
  return null;
}

function validatePassword(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (!/[a-z]/.test(value)) return 'A senha precisa ter pelo menos uma letra minúscula';
  if (!/[A-Z]/.test(value)) return 'A senha precisa ter pelo menos uma letra maiúscula';
  if (!/[0-9]/.test(value)) return 'A senha precisa ter pelo menos um número';
  if (!/[^A-Za-z0-9]/.test(value)) return 'A senha precisa ter pelo menos um caractere especial (ex: !@#$%)';
  return null;
}

export default function SignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [tipoEscola, setTipoEscola] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [loading, setLoading] = useState(false);
  const { message, type, showMessage, clearMessage } = useMessageBanner();

  // dispara a validação de um campo no onBlur e mostra o erro no toast do topo
  function handleFieldBlur(validator: (value: string) => string | null, value: string) {
    const erro = validator(value);
    if (erro) {
      showMessage(erro, 'error');
    }
  }

  async function handleSignup() {
    const erroNome = validateNome(nome);
    if (erroNome) {
      showMessage(erroNome, 'error');
      return;
    }

    const erroData = validateDataNascimento(dataNascimento);
    if (erroData) {
      showMessage(erroData, 'error');
      return;
    }

    if (!tipoEscola) {
      showMessage('Selecione o tipo de escola', 'error');
      return;
    }

    const erroEmail = validateEmail(email);
    if (erroEmail) {
      showMessage(erroEmail, 'error');
      return;
    }

    const erroSenha = validatePassword(password);
    if (erroSenha) {
      showMessage(erroSenha, 'error');
      return;
    }

    if (!aceitouTermos) {
      showMessage('Você precisa aceitar os termos de uso para continuar', 'error');
      return;
    }

    setLoading(true);

    const dataIso = toIsoDate(dataNascimento) as string;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setLoading(false);
      let mensagem = 'Não conseguimos criar sua conta :(';
      if (error.message.includes('already registered')) {
        mensagem = 'Já existe uma conta com esse email';
      } else if (error.message.includes('Password')) {
        mensagem = 'A senha não atende aos requisitos de segurança do Supabase';
      }
      showMessage(mensagem, 'error');
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      showMessage('Não foi possível concluir o cadastro, tente novamente', 'error');
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      nome,
      data_nascimento: dataIso,
      tipo_instituicao: tipoEscola,
    });

    if (profileError) {
      setLoading(false);
      showMessage('Conta criada, mas houve um erro ao salvar seu perfil', 'error');
      return;
    }

    const { error: consentError } = await supabase.from('consentimentos').insert({
      user_id: userId,
      aceite_termos: true,
      versao_termo: '1.0',
    });

    setLoading(false);

    if (consentError) {
      showMessage('Conta criada, mas houve um erro ao registrar o aceite dos termos', 'error');
      return;
    }

    // a partir daqui o RootNavigator detecta a sessão e troca de stack sozinho
  }

  async function handleGoogleSignup() {
    showMessage('Cadastro com Google ainda não disponível', 'info');
  }

  return (
    <View style={styles.root}>
      <MessageBanner
        message={message}
        type={type}
        onClose={clearMessage}
        style={[styles.topBanner, { top: insets.top + 12 }]}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <BackButton onPress={() => navigation.goBack()} style={styles.BackButton} />

        <AppText style={styles.title}>Bem-vindo(a)! Vamos começar a sua jornada =D</AppText>

        <AppText style={styles.subtitle}>
          Cadastra-se ou{' '}
          <AppText style={styles.link} onPress={() => navigation.navigate('Login')}>
            acesse a sua conta aqui
          </AppText>
        </AppText>

        <LabeledInput
          label="Nome completo"
          placeholder="Digite o seu nome completo"
          value={nome}
          onChangeText={setNome}
          onBlur={() => handleFieldBlur(validateNome, nome)}
        />

        <DateInput
          label="Data de nascimento"
          value={dataNascimento}
          onChangeText={setDataNascimento}
          onBlur={() => handleFieldBlur(validateDataNascimento, dataNascimento)}
        />

        <RadioGroup
          label="Em que tipo de escola você estuda?"
          options={TIPO_ESCOLA_OPTIONS}
          value={tipoEscola}
          onChange={setTipoEscola}
        />

        <LabeledInput
          label="E-mail"
          placeholder="Digite o seu e-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onBlur={() => handleFieldBlur(validateEmail, email)}
        />

        <PasswordInput
          label="Senha"
          placeholder="Crie uma senha"
          value={password}
          onChangeText={setPassword}
          onBlur={() => handleFieldBlur(validatePassword, password)}
        />

        <Checkbox
          checked={aceitouTermos}
          onChange={setAceitouTermos}
          label={
            <AppText style={styles.termsText}>
              Li e aceito os{' '}
              <AppText
                style={styles.link}
                onPress={() =>
                  showMessage('Documento ainda não implementado', 'info')
                }
              >
                Termos de Uso
              </AppText>{' '}
              e a{' '}
              <AppText
                style={styles.link}
                onPress={() =>
                  showMessage('Documento ainda não implementado', 'info')
                }
              >
                Política de Privacidade
              </AppText>
            </AppText>
          }
        />

        <AppButton
          label={loading ? 'CRIANDO CONTA...' : 'VAMOS LÁ'}
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          fullWidth
          onPress={handleSignup}
        />

        <Divider />

        <AppButton
          label="G  CADASTRAR COM O GOOGLE"
          backgroundColor={colors.white}
          fullWidth
          borderWidth={0.5}
          outlineColor="#000000"
          textColor={colors.primaryDark}
          shadowColor={colors.primaryDark}
          onPress={handleGoogleSignup}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    marginBottom: 70, // espaço pro botão de navegação do Android
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
    topBanner: {
    position: 'absolute',
    width: '90%',
    alignSelf: 'center',
    zIndex: 20,
  },
  BackButton: {
    marginBottom: 32,
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
  },
  link: {
    fontFamily: typography.bold,
    textDecorationLine: 'underline',
  },
  termsText: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.primaryDark,
    lineHeight: 18,
  },
});