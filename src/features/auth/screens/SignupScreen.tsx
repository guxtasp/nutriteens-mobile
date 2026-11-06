// src/features/auth/screens/SignupScreen.tsx
//
// Cadastro em 2 etapas dentro da mesma tela (decisão 3.2). O estado fica aqui,
// então voltar da etapa 2 para a 1 não perde nada. A criação da conta continua
// toda no useSignup (inalterado).
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { PasswordInput } from '../../../shared/ui/PasswordInput';
import { DateInput } from '../../../shared/ui/DateInput';
import { Checkbox } from '../../../shared/ui/Checkbox';
import { Divider } from '../../../shared/ui/Divider';
import { GoogleButton } from '../../../shared/ui/GoogleButton';
import { MessageBanner } from '../../../shared/ui/MessageBanner';
import { CabecalhoCadastro } from '../components/CabecalhoCadastro';
import { CampoSelecao } from '../components/CampoSelecao';
import { SairDoCadastroModal } from '../components/SairDoCadastroModal';
import { TIPO_ESCOLA_OPTIONS } from '../constants/tipoEscolaOptions';
import { GENERO_OPTIONS } from '../constants/generoOptions';
import { useSignup } from '../hooks/useSignup';
import { irParaTelaAuth } from '../utils/navegacaoAuth';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAnimacaoEtapa } from '../hooks/useAnimacaoEtapa';
import {
  validateNome,
  validateDataNascimento,
  validateEmail,
  validatePassword,
  PASSWORD_MIN_LENGTH,
} from '../utils/signupValidators';
import {
  TOTAL_ETAPAS,
  etapa1Erro,
  etapa2Erro,
  primeiroNome,
  temDadosPreenchidos,
  type DadosCadastro,
} from '../utils/etapasCadastro';

type Etapa = 1 | 2;

export default function SignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [genero, setGenero] = useState<string | null>(null);
  const [tipoEscola, setTipoEscola] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [tecladoAberto, setTecladoAberto] = useState(false);

  const { loading, message, type, showMessage, clearMessage, handleSignup } = useSignup();
  const { carregandoGoogle, continuarComGoogle } = useGoogleAuth(showMessage);

  const { estiloFormulario, reduzirMovimento } = useAnimacaoEtapa(etapa);
  const scrollRef = useRef<ScrollView>(null);
  // refs lidos pelo listener de navegação (assim ele não precisa ser recriado a cada tecla)
  const dados: DadosCadastro = { nome, dataNascimento, genero, tipoEscola, email, password, aceitouTermos };
  const dadosRef = useRef(dados);
  dadosRef.current = dados;
  const etapaRef = useRef<Etapa>(etapa);
  etapaRef.current = etapa;
  const saidaLiberadaRef = useRef(false); // true = deixa a tela sair sem perguntar
  const acaoPendenteRef = useRef<any>(null); // a ação de navegação interceptada (voltar/gesto)

  // Voltar do Android, gesto de voltar do iOS e navigation.goBack() passam todos por aqui:
  // etapa 2 -> volta para a etapa 1; etapa 1 com algo preenchido -> pede confirmação.
  useEffect(() => {
    const cancelar = navigation.addListener('beforeRemove', (e: any) => {
      if (saidaLiberadaRef.current) return;

      if (etapaRef.current === 2) {
        e.preventDefault();
        setEtapa(1);
        return;
      }
      if (temDadosPreenchidos(dadosRef.current)) {
        e.preventDefault();
        acaoPendenteRef.current = e.data.action;
        setConfirmandoSaida(true);
      }
    });
    return cancelar;
  }, [navigation]);

  // Com o teclado aberto o safe-area de baixo já está coberto: não soma de novo no rodapé.
  useEffect(() => {
    const evShow = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const evHide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s1 = Keyboard.addListener(evShow, () => setTecladoAberto(true));
    const s2 = Keyboard.addListener(evHide, () => setTecladoAberto(false));
    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  // dispara a validação de um campo no onBlur e mostra o erro no toast do topo
  function handleFieldBlur(validator: (value: string) => string | null, value: string) {
    const erro = validator(value);
    if (erro) {
      showMessage(erro, 'error');
    }
  }

  function irParaEtapa(nova: Etapa) {
    Keyboard.dismiss();
    clearMessage();
    setEtapa(nova);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }

  function onVoltar() {
    if (etapa === 2) {
      irParaEtapa(1);
    } else {
      navigation.goBack(); // o listener beforeRemove decide se pede confirmação
    }
  }

  function onContinuar() {
    const erro = etapa1Erro(dados);
    if (erro) {
      showMessage(erro, 'error');
      return;
    }
    irParaEtapa(2);
  }

  async function onSubmit() {
    if (loading) return;
    const erro = etapa2Erro(dados);
    if (erro) {
      showMessage(erro, 'error');
      return;
    }
    const ok = await handleSignup(dados);
    if (ok) {
      // a conta existe: o RootNavigator troca de stack sozinho, sem confirmação de saída
      saidaLiberadaRef.current = true;
    }
  }

  function sairEPerder() {
    saidaLiberadaRef.current = true;
    setConfirmandoSaida(false);
    const acao = acaoPendenteRef.current;
    acaoPendenteRef.current = null;
    if (acao) {
      navigation.dispatch(acao);
    } else {
      navigation.goBack();
    }
  }

  function continuarPreenchendo() {
    acaoPendenteRef.current = null;
    setConfirmandoSaida(false);
  }

  const titulo = etapa === 1 ? 'Vamos nos conhecer!' : `Quase lá, ${primeiroNome(nome)}!`;
  const subtitulo =
    etapa === 1
      ? 'Conte um pouco sobre você para personalizar a sua jornada.'
      : 'Falta só criar o acesso à sua conta.';
  const mascote =
    etapa === 1
      ? require('../../../../assets/img/cadastro/acolhedor.png')
      : require('../../../../assets/img/cadastro/supercontente.png');

  return (
    <View style={styles.root}>
      <MessageBanner
        message={message}
        type={type}
        onClose={clearMessage}
        style={[styles.topBanner, { top: insets.top + 12 }]}
      />

      {/* 'padding' nos dois sistemas: com edge-to-edge no Android a janela não é redimensionada pelo teclado */}
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView
          ref={scrollRef}
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* o cabeçalho rola junto: em telas pequenas/fonte grande com o teclado aberto sobra espaço para os campos */}
          <CabecalhoCadastro
            etapa={etapa}
            totalEtapas={TOTAL_ETAPAS}
            titulo={titulo}
            subtitulo={subtitulo}
            mascote={mascote}
            reduzirMovimento={reduzirMovimento}
            onVoltar={onVoltar}
          />

          <Animated.View style={[styles.formulario, estiloFormulario]}>
            {etapa === 1 ? (
              <>
                {/* cadastro com Google primeiro: evita o formulário para quem prefere a conta Google */}
                <GoogleButton
                  label="Cadastrar com o Google"
                  loading={carregandoGoogle}
                  onPress={continuarComGoogle}
                />

                {/* quem tocou em "cadastrar" sem querer volta para o login sem usar a seta */}
                <Pressable
                  onPress={() => irParaTelaAuth(navigation, 'Login')}
                  accessibilityRole="link"
                  accessibilityLabel="Já tenho conta. Entrar"
                  style={styles.linkConta}
                >
                  <AppText style={styles.textoConta}>
                    Já tenho conta · <AppText style={styles.link}>Entrar</AppText>
                  </AppText>
                </Pressable>

                <Divider label="ou preencha os dados" />

                <View style={styles.espacoInput}>
                  <LabeledInput
                    label="Nome completo"
                    placeholder="Digite o seu nome completo"
                    value={nome}
                    onChangeText={setNome}
                    onBlur={() => handleFieldBlur(validateNome, nome)}
                    autoCapitalize="words"
                    textContentType="name"
                  />
                </View>

                <DateInput
                  label="Data de nascimento"
                  value={dataNascimento}
                  onChangeText={setDataNascimento}
                  onBlur={() => handleFieldBlur(validateDataNascimento, dataNascimento)}
                />

                <CampoSelecao
                  label="Qual é o seu gênero?"
                  placeholder="Selecione"
                  options={GENERO_OPTIONS}
                  value={genero}
                  onChange={setGenero}
                />

                <CampoSelecao
                  label="Em que tipo de escola você estuda?"
                  placeholder="Selecione"
                  options={TIPO_ESCOLA_OPTIONS}
                  value={tipoEscola}
                  onChange={setTipoEscola}
                />
              </>
            ) : (
              <>
                <View style={styles.espacoInput}>
                  <LabeledInput
                    label="E-mail"
                    placeholder="Digite o seu e-mail"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    value={email}
                    onChangeText={setEmail}
                    onBlur={() => handleFieldBlur(validateEmail, email)}
                  />
                </View>

                <PasswordInput
                  label="Senha"
                  placeholder="Crie uma senha"
                  hint={`Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`}
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
                        onPress={() => navigation.navigate('TermosDeUso')}
                        accessibilityRole="link"
                      >
                        Termos de Uso
                      </AppText>{' '}
                      e a{' '}
                      <AppText
                        style={styles.link}
                        onPress={() => navigation.navigate('PoliticaPrivacidade')}
                        accessibilityRole="link"
                      >
                        Política de Privacidade
                      </AppText>
                    </AppText>
                  }
                />
              </>
            )}
          </Animated.View>
        </ScrollView>

        {/* rodapé fixo: o botão principal fica sempre alcançável, inclusive com o teclado aberto */}
        <View
          style={[
            styles.rodape,
            { paddingBottom: tecladoAberto ? 12 : 16 + insets.bottom },
          ]}
        >
          {etapa === 1 ? (
            <AppButton
              label="CONTINUAR"
              backgroundColor={colors.primaryDark}
              textColor={colors.white}
              shadowColor="#123024"
              fullWidth
              onPress={onContinuar}
            />
          ) : (
            <AppButton
              label={loading ? 'CRIANDO CONTA...' : 'VAMOS LÁ'}
              backgroundColor={colors.primaryDark}
              textColor={colors.white}
              shadowColor="#123024"
              fullWidth
              disabled={loading}
              onPress={onSubmit}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <SairDoCadastroModal
        visible={confirmandoSaida}
        onContinuar={continuarPreenchendo}
        onSair={sairEPerder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formulario: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  // o LabeledInput já traz 10 de margem; +10 iguala ao espaçamento dos outros campos (20)
  espacoInput: {
    marginBottom: 10,
  },
  rodape: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: colors.white,
  },
  topBanner: {
    position: 'absolute',
    width: '90%',
    alignSelf: 'center',
    zIndex: 20,
  },
  link: {
    fontFamily: typography.bold,
    textDecorationLine: 'underline',
    color: colors.background,
  },
  linkConta: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textoConta: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  termsText: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    lineHeight: 20,
  },
});
