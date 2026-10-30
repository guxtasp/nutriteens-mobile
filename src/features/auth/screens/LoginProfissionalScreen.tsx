// src/features/auth/screens/LoginProfissionalScreen.tsx
//
// Entrada de nutricionistas e administradores (só no computador; ver acessoProfissional.ts).
// O visual segue o da landing page: marca-texto inclinado, faixa lima inclinada, cartas do
// Álbum em leque, o Broxis e bordas curvas entre as áreas.
//  - não existe cadastro: as contas profissionais são criadas pela equipe do projeto;
//  - o erro fica na tela até a pessoa corrigir (não some sozinho depois de 4 s);
//  - tudo funciona só com teclado: Enter vai de campo em campo e envia;
//  - só há animação de entrada (uma vez), nada que fique se mexendo.
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../../../navigation/RootNavigator';
import { supabase } from '../../../lib/supabase';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { ErrosCredenciais, mensagemErroLogin, validarCredenciais } from '../utils/loginErros';
import { LARGURA_ACESSO_PROFISSIONAL } from '../utils/acessoProfissional';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginProfissional'>;

const LARGURA_DIVIDIDO = LARGURA_ACESSO_PROFISSIONAL;
const CREME = '#F1F8E8';
const OLIVA = '#3F6B0F'; // 6,3:1 sobre branco
const TEXTO_ERRO = '#9B2C20'; // 7,4:1 sobre o fundo do aviso
const FUNDO_ERRO = '#FDEBEA';
const PLACEHOLDER = '#6B7A73'; // 4,5:1 sobre branco (o cinza do tema, #9AA5A0, não passa)

// o que as duas áreas (nutricionista e administração) têm em comum no painel
const RECURSOS: { icone: React.ComponentProps<typeof Feather>['name']; texto: string }[] = [
  { icone: 'users', texto: 'Participantes' },
  { icone: 'check-circle', texto: 'Aprovação de conteúdos' },
  { icone: 'map', texto: 'Trilhas e receitas' },
  { icone: 'award', texto: 'Desafios' },
  { icone: 'bar-chart-2', texto: 'Analytics' },
  { icone: 'download', texto: 'Exportação de dados' },
];

const CARTAS = [
  { src: require('../../../../assets/img/cartas/passo_01_comida_de_verdade_mini.webp'), giro: '-9deg' },
  { src: require('../../../../assets/img/cartas/passo_05_com_calma_e_companhia_mini.webp'), giro: '0deg' },
  { src: require('../../../../assets/img/cartas/passo_07_mao_na_massa_mini.webp'), giro: '9deg' },
];

// estilos que só existem no web (react-native-web); no nativo viram null
const soWeb = (estilo: object) => (Platform.OS === 'web' ? (estilo as any) : null);

interface CampoProps extends TextInputProps {
  rotulo: string;
  erro?: string;
  inputRef?: React.RefObject<TextInput | null>;
  direita?: React.ReactNode;
}

// Campo com rótulo sempre visível, erro escrito embaixo e anel de foco bem marcado.
function Campo({ rotulo, erro, inputRef, direita, style, onFocus, onBlur, ...props }: CampoProps) {
  const [focado, setFocado] = useState(false);
  return (
    <View style={styles.campo}>
      <AppText style={styles.rotulo}>{rotulo}</AppText>
      <View>
        <TextInput
          ref={inputRef}
          accessibilityLabel={rotulo}
          accessibilityHint={erro}
          placeholderTextColor={PLACEHOLDER}
          style={[
            styles.input,
            soWeb({ outlineStyle: 'none' }),
            focado && styles.inputFocado,
            focado && soWeb({ boxShadow: '0 0 0 4px rgba(139, 207, 74, 0.45)' }),
            !!erro && styles.inputErro,
            !!direita && { paddingRight: 52 },
            style,
          ]}
          onFocus={(e) => {
            setFocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocado(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {direita}
      </View>
      {!!erro && (
        <View style={styles.erroCampo} accessibilityLiveRegion="polite">
          <Feather name="alert-circle" size={14} color={TEXTO_ERRO} />
          <AppText style={styles.erroCampoTexto}>{erro}</AppText>
        </View>
      )}
    </View>
  );
}

// Lado esquerdo (só em tela larga): a marca, a promessa e as ilustrações.
function PainelMarca({ pequeno }: { pequeno: boolean }) {
  return (
    <View style={styles.marca}>
      {/* círculos de fundo, só enfeite */}
      <View style={[styles.circulo, styles.circuloA]} pointerEvents="none" />
      <View style={[styles.circulo, styles.circuloB]} pointerEvents="none" />

      <View style={[styles.marcaConteudo, pequeno && { paddingHorizontal: 40 }]}>
        <Image
          source={require('../../../../assets/img/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="NutriTeens"
        />

        <View style={styles.selo}>
          <Feather name="shield" size={14} color="#CDE7D6" />
          <AppText style={styles.seloTexto}>PAINEL PARA PROFISSIONAIS</AppText>
        </View>

        <View accessible accessibilityLabel="Acompanhe a jornada dos adolescentes." style={styles.manchete}>
          <AppText style={[styles.mancheteTexto, pequeno && styles.mancheteMenor]}>Acompanhe a jornada</AppText>
          <View style={styles.mancheteLinha}>
            <AppText style={[styles.mancheteTexto, pequeno && styles.mancheteMenor]}>dos</AppText>
            <View style={styles.marcaTexto}>
              <AppText style={[styles.mancheteTexto, pequeno && styles.mancheteMenor, { color: colors.primaryDark }]}>adolescentes.</AppText>
            </View>
          </View>
        </View>

        <AppText style={styles.apoio}>
          Indicadores, conteúdos e gestão do NutriTeens em um só lugar, para quem cuida de transformar o Guia Alimentar em hábitos.
        </AppText>

        <View style={styles.recursos}>
          {RECURSOS.map((r) => (
            <View key={r.texto} style={styles.recurso}>
              <Feather name={r.icone} size={14} color={colors.primary} />
              <AppText style={styles.recursoTexto}>{r.texto}</AppText>
            </View>
          ))}
        </View>

        {/* cartas do Álbum em leque + Broxis */}
        <View style={styles.vitrine} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.leque}>
            {CARTAS.map((c, i) => (
              <MotiView
                key={i}
                from={{ opacity: 0, translateY: 30, rotate: '0deg' }}
                animate={{ opacity: 1, translateY: 0, rotate: c.giro }}
                transition={{ type: 'timing', duration: 600, delay: 250 + i * 120 }}
                style={[styles.cartaWrap, i > 0 && { marginLeft: -42 }, i === 1 && { zIndex: 2, marginTop: -14 }]}
              >
                <Image source={c.src} style={[styles.carta, pequeno && styles.cartaMenor]} resizeMode="cover" />
              </MotiView>
            ))}
          </View>
          <MotiView
            from={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 700, delay: 500 }}
          >
            <Image
              source={require('../../../../assets/img/mascot/broxis-apresentando.png')}
              style={[styles.mascote, pequeno && styles.mascoteMenor]}
              resizeMode="contain"
            />
          </MotiView>
        </View>
      </View>

      {/* faixa lima inclinada, como o letreiro da landing */}
      <View style={styles.faixa} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <AppText numberOfLines={1} style={styles.faixaTexto}>
          ÁGUA ✦ REFEIÇÕES ✦ TRILHAS ✦ MISSÕES ✦ CARTAS ✦ METAS ✦ ÁGUA ✦ REFEIÇÕES ✦ TRILHAS ✦ MISSÕES ✦ CARTAS ✦ METAS
        </AppText>
      </View>
    </View>
  );
}

export default function LoginProfissionalScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<ErrosCredenciais>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const senhaRef = useRef<TextInput | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { width, height } = useWindowDimensions();
  const dividido = width >= LARGURA_DIVIDIDO;

  useEffect(() => () => clearTimeout(temporizador.current), []);

  async function entrar() {
    if (entrando) return;
    setErroGeral(null);

    const invalidos = validarCredenciais(email, senha);
    setErros(invalidos);
    if (invalidos.email || invalidos.senha) return;

    setEntrando(true);
    // trim: teclados costumam deixar um espaço depois do e-mail
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });

    if (error) {
      setEntrando(false);
      setErroGeral(mensagemErroLogin(error));
      return;
    }
    // Deu certo: o RootNavigator percebe a sessão e troca de tela sozinho. Mantém o botão
    // "ENTRANDO..." nesse meio-tempo; se nada acontecer em 10 s, libera para tentar de novo.
    temporizador.current = setTimeout(() => setEntrando(false), 10000);
  }

  const cartao = (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 450 }}
      style={[styles.cartao, width < 1100 && styles.cartaoMedio, !dividido && styles.cartaoCompacto]}
    >
      <View style={styles.badge}>
        <Feather name="lock" size={13} color={OLIVA} />
        <AppText style={styles.badgeTexto}>ÁREA PROFISSIONAL</AppText>
      </View>

      <AppText accessibilityRole="header" style={styles.titulo}>
        Bem-vindo(a) de volta
      </AppText>
      <AppText style={styles.subtitulo}>Entre com o e-mail e a senha da sua conta de nutricionista ou administrador.</AppText>

      {!!erroGeral && (
        <View style={styles.avisoErro} accessibilityRole="alert" accessibilityLiveRegion="assertive">
          <Feather name="alert-circle" size={18} color={TEXTO_ERRO} />
          <AppText style={styles.avisoErroTexto}>{erroGeral}</AppText>
        </View>
      )}

      <Campo
        rotulo="E-mail"
        placeholder="nome@exemplo.com"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (erros.email) setErros((e) => ({ ...e, email: undefined }));
          if (erroGeral) setErroGeral(null);
        }}
        erro={erros.email}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        keyboardType="email-address"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => senhaRef.current?.focus()}
      />

      <Campo
        rotulo="Senha"
        inputRef={senhaRef}
        value={senha}
        onChangeText={(t) => {
          setSenha(t);
          if (erros.senha) setErros((e) => ({ ...e, senha: undefined }));
          if (erroGeral) setErroGeral(null);
        }}
        erro={erros.senha}
        secureTextEntry={!mostrarSenha}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={entrar}
        direita={
          <Pressable
            onPress={() => setMostrarSenha((v) => !v)}
            style={styles.olho}
            accessibilityRole="button"
            accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={4}
          >
            <Feather name={mostrarSenha ? 'eye-off' : 'eye'} size={20} color={colors.primaryDark} />
          </Pressable>
        }
      />

      <Pressable onPress={() => navigation.navigate('EsqueciSenha')} accessibilityRole="link" style={styles.esqueci}>
        <AppText style={styles.link}>Esqueci minha senha</AppText>
      </Pressable>

      <View style={styles.botao}>
        <AppButton
          label={entrando ? 'ENTRANDO...' : 'ENTRAR'}
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          disabled={entrando}
          accessibilityRole="button"
          accessibilityState={{ disabled: entrando, busy: entrando }}
          onPress={entrar}
        />
        {entrando && <ActivityIndicator style={styles.carregando} color={colors.white} />}
      </View>

      <View style={styles.rodape}>
        <AppText style={styles.rodapeTexto}>
          Ainda não tem acesso? As contas de nutricionista e administrador são criadas pela equipe do NutriTeens.
        </AppText>
        <Pressable onPress={() => navigation.navigate('Onboarding')} accessibilityRole="link" style={styles.voltar}>
          <AppText style={styles.link}>Sou adolescente: ir para o início</AppText>
        </Pressable>
      </View>
    </MotiView>
  );

  const instituicao = (
    <View style={styles.instituicao}>
      <View style={styles.logosInst} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Image source={require('../../../../assets/img/logo-departamento-1.png')} style={styles.logoInst1} resizeMode="contain" />
        <Image source={require('../../../../assets/img/logo-departamento-2.png')} style={styles.logoInst2} resizeMode="contain" />
      </View>
      <AppText style={styles.instituicaoTexto}>Projeto de pesquisa da Universidade Federal de Viçosa</AppText>
    </View>
  );

  return (
    <ScrollView
      style={styles.raiz}
      contentContainerStyle={[styles.conteudo, { minHeight: Math.max(height, 760) }, dividido && styles.conteudoLinha]}
      keyboardShouldPersistTaps="handled"
    >
      {dividido && <PainelMarca pequeno={width < 1200} />}

      <View style={styles.ladoForm}>
        {!dividido && (
          <View style={styles.logoCompactoBox}>
            <Image source={require('../../../../assets/img/logo.png')} style={styles.logoCompacto} resizeMode="contain" accessibilityLabel="NutriTeens" />
          </View>
        )}
        {cartao}
        {instituicao}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: CREME },
  conteudo: { flexGrow: 1 },
  conteudoLinha: { flexDirection: 'row' },

  // ---- lado da marca ----
  marca: {
    flex: 1.1,
    minWidth: 420,
    backgroundColor: colors.background,
    borderTopRightRadius: 56,
    borderBottomRightRadius: 56,
    overflow: 'hidden',
  },
  circulo: { position: 'absolute', borderRadius: 999, backgroundColor: colors.primary },
  circuloA: { width: 380, height: 380, top: -140, right: -120, opacity: 0.12 },
  circuloB: { width: 300, height: 300, bottom: 90, left: -150, opacity: 0.07 },
  marcaConteudo: { flex: 1, paddingHorizontal: 56, paddingTop: 48, paddingBottom: 110, maxWidth: 720, width: '100%' },
  logo: { width: 170, height: 50, marginBottom: 40 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 22,
  },
  seloTexto: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 1.2, color: '#CDE7D6' },
  manchete: { gap: 4 },
  mancheteMenor: { fontSize: 36, lineHeight: 44 },
  mancheteLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  mancheteTexto: { fontFamily: typography.bold, fontSize: 44, lineHeight: 54, color: colors.white },
  marcaTexto: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    transform: [{ rotate: '-2deg' }],
  },
  apoio: { fontFamily: typography.regular, fontSize: 17, lineHeight: 27, color: colors.textOnDarkMuted, marginTop: 22, maxWidth: 480 },
  recursos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 26, maxWidth: 520 },
  recurso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recursoTexto: { fontFamily: typography.semiBold, fontSize: 13, color: colors.white },
  vitrine: { marginTop: 'auto', paddingTop: 28, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  leque: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 12 },
  cartaWrap: { ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)' } as any) : { elevation: 6 }) },
  carta: { width: 112, height: 165, borderRadius: 10 },
  cartaMenor: { width: 92, height: 135 },
  mascote: { width: 170, height: 282 },
  mascoteMenor: { width: 120, height: 199 },
  faixa: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: 34,
    height: 46,
    justifyContent: 'center',
    backgroundColor: colors.primary,
    transform: [{ rotate: '-2deg' }],
    overflow: 'hidden',
  },
  faixaTexto: { fontFamily: typography.bold, fontSize: 14, letterSpacing: 1.6, color: colors.primaryDark, paddingHorizontal: 48 },

  // ---- lado do formulário ----
  ladoForm: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  logoCompactoBox: { backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 10 },
  logoCompacto: { width: 124, height: 36 },
  cartao: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.white,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E3EDD8',
    padding: 40,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 24px 60px rgba(27, 67, 50, 0.14)' } as any) : {}),
  },
  cartaoMedio: { padding: 28 },
  cartaoCompacto: { padding: 24, borderRadius: 24 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 18,
  },
  badgeTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1, color: OLIVA },
  titulo: { fontFamily: typography.bold, fontSize: 30, lineHeight: 38, color: colors.primaryDark },
  subtitulo: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: '#3C5A49', marginTop: 8, marginBottom: 24 },

  avisoErro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FUNDO_ERRO,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TEXTO_ERRO,
    padding: 14,
    marginBottom: 16,
  },
  avisoErroTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 14, lineHeight: 20, color: TEXTO_ERRO },

  campo: { marginBottom: 16 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark, marginBottom: 6 },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: typography.regular,
    fontSize: 16,
    color: colors.primaryDark,
    backgroundColor: colors.white,
  },
  inputFocado: { borderWidth: 2.5 },
  inputErro: { borderColor: TEXTO_ERRO, borderWidth: 2 },
  erroCampo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  erroCampoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, color: TEXTO_ERRO },
  olho: { position: 'absolute', right: 4, top: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  esqueci: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', marginBottom: 8 },
  link: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark, textDecorationLine: 'underline' },
  botao: { justifyContent: 'center' },
  carregando: { position: 'absolute', right: 20, top: 20 },

  rodape: { marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#E5E7E5' },
  rodapeTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 20, color: '#3C5A49' },
  voltar: { minHeight: 44, justifyContent: 'center', marginTop: 4 },

  // ---- instituição ----
  instituicao: { flexDirection: 'row', alignItems: 'center', gap: 14, maxWidth: 440, width: '100%', paddingHorizontal: 8 },
  logosInst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white, // o logo 1 é um JPEG com fundo branco
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoInst1: { width: 34, height: 31 },
  logoInst2: { width: 52, height: 27 },
  instituicaoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, lineHeight: 18, color: '#3C5A49' },
});
