// src/features/auth/screens/SignupScreen.tsx
import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { TIPO_ESCOLA_OPTIONS } from '../constants/tipoEscolaOptions';
import { useSignup } from '../hooks/useSignup';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import {
  validateNome,
  validateDataNascimento,
  validateEmail,
  validatePassword,
} from '../utils/signupValidators';
import { GENERO_OPTIONS } from '../constants/generoOptions';


export default function SignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [tipoEscola, setTipoEscola] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [genero, setGenero] = useState<string | null>(null);
  const { loading, message, type, showMessage, clearMessage, handleSignup } = useSignup();
  const { carregandoGoogle, continuarComGoogle } = useGoogleAuth(showMessage);

  // dispara a validação de um campo no onBlur e mostra o erro no toast do topo
  function handleFieldBlur(validator: (value: string) => string | null, value: string) {
    const erro = validator(value);
    if (erro) {
      showMessage(erro, 'error');
    }
  }

  function onSubmit() {
    handleSignup({ nome, dataNascimento, tipoEscola, genero,  email, password, aceitouTermos });
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

        <RadioGroup
          label="Qual é o seu gênero?"
          options={GENERO_OPTIONS}
          value={genero}
          onChange={setGenero}
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
                onPress={() => showMessage('Documento ainda não implementado', 'info')}
              >
                Termos de Uso
              </AppText>{' '}
              e a{' '}
              <AppText
                style={styles.link}
                onPress={() => showMessage('Documento ainda não implementado', 'info')}
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
          onPress={onSubmit}
        />

        <Divider />

        <AppButton
          label={carregandoGoogle ? 'ABRINDO O GOOGLE...' : 'G  CADASTRAR COM O GOOGLE'}
          backgroundColor={colors.white}
          fullWidth
          borderWidth={0.5}
          outlineColor="#000000"
          textColor={colors.primaryDark}
          shadowColor={colors.primaryDark}
          onPress={continuarComGoogle}
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