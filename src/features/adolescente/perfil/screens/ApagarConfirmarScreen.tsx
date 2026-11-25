// src/features/adolescente/perfil/screens/ApagarConfirmarScreen.tsx
//
// "Apagar meus dados", passo 2: segurar o botão por 2 s (um toque acidental não apaga nada).
// O tempo é contado por um timer em JS, não pelo fim da animação: com "reduzir movimento" a barra
// não anima, mas continua exigindo os 2 s. Com leitor de tela, segurar é difícil; o botão vira um
// toque comum seguido de uma confirmação.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, cancelAnimation } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { confirmar } from '../../../../shared/ui/dialogo';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import * as Haptics from '../../../../shared/audio/haptics';
import { excluirMinhaConta, limparDadosLocaisDaConta } from '../services/excluirContaService';
import { classificarErroExclusao } from '../utils/exclusaoConta';
import {
  APOIO_CONFIRMAR,
  ERRO_GENERICO,
  ERRO_SEM_INTERNET,
  ROTULO_SEGURANDO,
  ROTULO_SEGURAR,
  ROTULO_TOCAR,
  TITULO_CONFIRMAR,
} from '../data/textosExclusao';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'ApagarConfirmar'>;

const DURACAO_SEGURAR_MS = 2000;
const DURACAO_VOLTAR_MS = 250;

export default function ApagarConfirmarScreen({ navigation }: Props) {
  const { userId } = useAuth();
  const reduzirMovimento = useReduzirMovimento();
  const [leitorDeTela, setLeitorDeTela] = useState(false);
  const [segurando, setSegurando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [larguraBotao, setLarguraBotao] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apagandoRef = useRef(false);
  const progresso = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setLeitorDeTela).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setLeitorDeTela);
    return () => sub.remove();
  }, []);

  // enquanto apaga, não deixa sair da tela (gesto, botão voltar do Android ou do cabeçalho)
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !apagando });
  }, [navigation, apagando]);
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (apagandoRef.current) e.preventDefault();
      }),
    [navigation],
  );
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const barraStyle = useAnimatedStyle(() => ({ width: `${progresso.value * 100}%` }));

  const apagar = useCallback(async () => {
    if (apagandoRef.current) return;
    apagandoRef.current = true;
    setApagando(true);
    setErro(null);
    try {
      const { codigo } = await excluirMinhaConta();
      if (userId) await limparDadosLocaisDaConta(userId);
      apagandoRef.current = false;
      // reset: não existe "voltar" para dentro de uma conta que não existe mais
      navigation.reset({ index: 0, routes: [{ name: 'ApagarPronto', params: { codigo } }] });
    } catch (e) {
      // nunca a mensagem crua; e nada de id/e-mail no log
      console.warn('Exclusão de conta falhou:', classificarErroExclusao(e));
      setErro(classificarErroExclusao(e) === 'rede' ? ERRO_SEM_INTERNET : ERRO_GENERICO);
      progresso.value = reduzirMovimento ? 0 : withTiming(0, { duration: DURACAO_VOLTAR_MS });
      apagandoRef.current = false;
      setApagando(false);
    }
  }, [navigation, userId, progresso, reduzirMovimento]);

  function comecarASegurar() {
    if (apagandoRef.current || timer.current) return;
    setErro(null);
    setSegurando(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!reduzirMovimento) {
      progresso.value = withTiming(1, { duration: DURACAO_SEGURAR_MS, easing: Easing.linear });
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      cancelAnimation(progresso);
      progresso.value = 1;
      setSegurando(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void apagar();
    }, DURACAO_SEGURAR_MS);
  }

  function soltar() {
    if (!timer.current) return; // já completou (ou nem começou)
    clearTimeout(timer.current);
    timer.current = null;
    setSegurando(false);
    cancelAnimation(progresso);
    progresso.value = reduzirMovimento ? 0 : withTiming(0, { duration: DURACAO_VOLTAR_MS });
  }

  async function tocarComLeitor() {
    if (apagandoRef.current) return;
    const ok = await confirmar('Apagar tudo?', 'Sua conta e seus dados serão apagados. Não dá pra desfazer.', {
      confirmar: 'Apagar',
      destrutivo: true,
    });
    if (ok) {
      progresso.value = 1;
      void apagar();
    }
  }

  const rotulo = leitorDeTela ? ROTULO_TOCAR : segurando ? ROTULO_SEGURANDO : ROTULO_SEGURAR;

  return (
    <SafeAreaView style={styles.tela}>
      <ScreenHeader titulo="Confirmar" onVoltar={() => !apagando && navigation.goBack()} />
      <MessageBanner message={erro} onClose={() => setErro(null)} autoHideMs={6000} />

      <View style={styles.conteudo}>
        <View style={styles.icone}>
          <Ionicons name="trash-outline" size={44} color={colors.error} />
        </View>
        <AppText style={styles.titulo} accessibilityRole="header">
          {TITULO_CONFIRMAR}
        </AppText>
        <AppText style={styles.apoio}>{leitorDeTela ? 'Toque no botão e confirme.' : APOIO_CONFIRMAR}</AppText>
      </View>

      <View style={styles.rodape}>
        <Pressable
          onPressIn={leitorDeTela ? undefined : comecarASegurar}
          onPressOut={leitorDeTela ? undefined : soltar}
          onPress={leitorDeTela ? tocarComLeitor : undefined}
          disabled={apagando}
          style={styles.botao}
          onLayout={(e) => setLarguraBotao(e.nativeEvent.layout.width)}
          accessibilityRole="button"
          accessibilityState={{ disabled: apagando, busy: apagando }}
          accessibilityLabel={leitorDeTela ? 'Apagar sua conta e seus dados' : 'Segure para apagar sua conta e seus dados'}
          accessibilityHint={leitorDeTela ? 'Abre uma confirmação' : undefined}
        >
          {/* texto vermelho embaixo; por cima, a barra recorta uma cópia branca do mesmo texto,
              então o rótulo fica legível em qualquer ponto do preenchimento */}
          <AppText style={styles.botaoTexto}>{rotulo}</AppText>
          <Animated.View style={[styles.barra, barraStyle]} pointerEvents="none">
            <View style={[styles.camadaClara, { width: larguraBotao }]}>
              {apagando ? (
                <ActivityIndicator color={colors.white} accessibilityLabel="Apagando" />
              ) : (
                <AppText style={[styles.botaoTexto, styles.botaoTextoClaro]}>{rotulo}</AppText>
              )}
            </View>
          </Animated.View>
        </Pressable>
        <Pressable
          onPress={() => navigation.goBack()}
          disabled={apagando}
          style={styles.link}
          accessibilityRole="button"
          accessibilityState={{ disabled: apagando }}
        >
          <AppText style={[styles.linkTexto, apagando && styles.desabilitado]}>Cancelar</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  conteudo: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center', gap: 16 },
  icone: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.erroSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: typography.bold, fontSize: 24, lineHeight: 29, color: colors.primaryDark, textAlign: 'center' },
  apoio: { fontFamily: typography.regular, fontSize: 14, lineHeight: 21, color: colors.textoSuave, textAlign: 'center' },
  rodape: { paddingHorizontal: 24, paddingBottom: 20, gap: 10 },
  botao: {
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.error,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  barra: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.error, overflow: 'hidden' },
  camadaClara: { position: 'absolute', left: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.error },
  botaoTextoClaro: { color: colors.white },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkTexto: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark, textDecorationLine: 'underline' },
  desabilitado: { opacity: 0.4 },
});
