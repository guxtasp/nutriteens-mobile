// src/features/adolescente/trocas/screens/TrocaBaralhoScreen.tsx
//
// Baralho de ideias de uma categoria (HANDOFF_REBRAND, fase 3.2): uma carta por vez, "OUTRA IDEIA"
// passa para a próxima (circular) e "QUERO TESTAR" guarda a troca para o "Testei?" de daqui a
// 2 dias. Sem swipe nesta versão: os botões fazem tudo (acessível e sem gesto escondido).
// Animação calma: a carta nova desliza um pouco e aparece (sem giro nem mola); ao guardar, o selo
// "GUARDADA!" aparece com fade. As cartas do fundo ficam paradas. Tudo some com "reduzir movimento".
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import { ehErroDeRede } from '../../../../shared/offline/erroRede';
import * as Haptics from '../../../../shared/audio/haptics';
import CartaTroca from '../components/CartaTroca';
import { listarMinhasRespostas, listarTrocas, registrarTrocaSugerida, responderTroca } from '../services/trocasService';
import { proximaCarta, trocasGuardadas } from '../utils/avaliacaoTrocas';
import { CHAMADA_CATEGORIA, ordenarTrocas, ROTULO_CATEGORIA, semDestinoRepetido, type Troca } from '../utils/trocas';
import { BANNER_GUARDADA } from '../data/textosTestei';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'TrocaBaralho'>;

export default function TrocaBaralhoScreen({ navigation, route }: Props) {
  const { categoria, trocaInicialId } = route.params;
  const insets = useSafeAreaInsets();
  const reduzirMovimento = useReduzirMovimento();

  const [cartas, setCartas] = useState<Troca[] | null>(null);
  const [erro, setErro] = useState(false);
  const [indice, setIndice] = useState(0);
  const [virada, setVirada] = useState(false);
  const [guardadas, setGuardadas] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [bannerDe, setBannerDe] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(false);
    try {
      const [lista, respostas] = await Promise.all([
        listarTrocas(categoria),
        listarMinhasRespostas().catch(() => []), // sem isso só não mostra "GUARDADA" nas antigas
      ]);
      const ordenadas = semDestinoRepetido(ordenarTrocas(lista));
      setCartas(ordenadas);
      setGuardadas(new Set(trocasGuardadas(respostas).map((g) => g.trocaId)));
      const inicial = trocaInicialId ? ordenadas.findIndex((t) => t.id === trocaInicialId) : -1;
      setIndice(inicial >= 0 ? inicial : 0);
    } catch (e) {
      console.error('Erro ao carregar o baralho de trocas:', e);
      setErro(true);
    }
  }, [categoria, trocaInicialId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const carta = cartas && cartas.length > 0 ? cartas[indice % cartas.length] : null;
  const jaGuardada = !!carta && guardadas.has(carta.id);

  // cada carta que aparece conta como "sugerida" (só o id vai para o analytics)
  useEffect(() => {
    if (carta) registrarTrocaSugerida(carta.id, 'aba');
  }, [carta]);

  function outra() {
    if (!cartas) return;
    void Haptics.selectionAsync();
    setVirada(false);
    setAviso(null);
    setIndice((i) => proximaCarta(i, cartas.length));
  }

  async function quero() {
    if (!carta || jaGuardada || salvando) return;
    setSalvando(true);
    setAviso(null);
    try {
      await responderTroca(carta.id, 'TENTAR', 'aba');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGuardadas((s) => new Set(s).add(carta.id));
      setBannerDe(carta.id);
    } catch (e) {
      console.error('Erro ao guardar a troca:', e);
      setAviso(ehErroDeRede(e) ? 'Sem internet agora. Tenta guardar de novo daqui a pouco.' : 'Não deu pra guardar agora. Tenta de novo.');
    } finally {
      setSalvando(false);
    }
  }

  const subtitulo = useMemo(() => {
    if (!cartas || cartas.length === 0) return 'Ideias pra variar';
    return `Carta ${(indice % cartas.length) + 1} de ${cartas.length}`;
  }, [cartas, indice]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScreenHeader titulo={ROTULO_CATEGORIA[categoria]} subtitulo={subtitulo} onVoltar={() => navigation.goBack()} />

      <View style={[styles.corpo, { paddingBottom: 16 + insets.bottom }]}>
        <AppText style={styles.chamada}>{CHAMADA_CATEGORIA[categoria]}</AppText>

        {cartas === null && !erro && <ActivityIndicator color={colors.primary} style={styles.carregando} />}
        {erro && (
          <View style={styles.vazio}>
            <AppText style={styles.vazioTexto}>Não deu pra carregar as ideias agora. Tenta de novo daqui a pouco.</AppText>
            <AppButton label="TENTAR DE NOVO" onPress={carregar} />
          </View>
        )}
        {cartas !== null && !erro && cartas.length === 0 && (
          <AppText style={styles.vazioTexto}>Ainda não temos ideias nessa categoria. Em breve tem novidade!</AppText>
        )}

        {carta && (
          <>
            <View style={styles.pilha}>
              <View style={[styles.cartaFundo, styles.cartaFundo2]} accessibilityElementsHidden importantForAccessibility="no" />
              <View style={[styles.cartaFundo, styles.cartaFundo1]} accessibilityElementsHidden importantForAccessibility="no" />
              <MotiView
                key={carta.id}
                style={styles.flex}
                from={reduzirMovimento ? { opacity: 1 } : { opacity: 0, translateX: 24 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: reduzirMovimento ? 0 : 220 }}
              >
                <CartaTroca
                  troca={carta}
                  virada={virada}
                  onVirar={() => setVirada((v) => !v)}
                  reduzirMovimento={reduzirMovimento}
                />
                {bannerDe === carta.id && (
                  <MotiView
                    pointerEvents="none"
                    style={styles.carimbo}
                    from={{ opacity: reduzirMovimento ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'timing', duration: reduzirMovimento ? 0 : 200 }}
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    <AppText style={styles.carimboTexto}>GUARDADA!</AppText>
                  </MotiView>
                )}
              </MotiView>
            </View>

            <View style={styles.botoes}>
              <AppButton
                label="OUTRA IDEIA"
                outlineColor={colors.destaqueTexto}
                fullWidth={false}
                style={styles.botao}
                onPress={outra}
                disabled={cartas!.length < 2}
              />
              <AppButton
                label={jaGuardada ? 'GUARDADA' : salvando ? 'GUARDANDO...' : 'QUERO TESTAR'}
                fullWidth={false}
                style={styles.botao}
                onPress={quero}
                disabled={jaGuardada || salvando}
                accessibilityLabel={jaGuardada ? `${carta.destinoNome} já está guardada` : `Quero testar ${carta.destinoNome}`}
              />
            </View>

            {!!aviso && (
              <AppText style={styles.aviso} accessibilityRole="alert">
                {aviso}
              </AppText>
            )}
            {bannerDe === carta.id && (
              <MotiView
                from={reduzirMovimento ? { opacity: 1 } : { opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.banner}
                accessibilityLiveRegion="polite"
                accessibilityRole="text"
              >
                <Ionicons name="bookmark-outline" size={18} color={colors.primary} />
                <AppText style={styles.bannerTexto}>{BANNER_GUARDADA}</AppText>
              </MotiView>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  corpo: { flex: 1, paddingHorizontal: 24 },
  chamada: {
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textoSuave,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  carregando: { marginTop: 40 },
  vazio: { gap: 16, marginTop: 32 },
  vazioTexto: { fontFamily: typography.regular, fontSize: 14, color: colors.textoSuave, textAlign: 'center', marginTop: 32 },
  pilha: { flex: 1, maxHeight: 520, marginBottom: 26 },
  cartaFundo: { ...StyleSheet.absoluteFillObject, borderRadius: 28 },
  cartaFundo1: { backgroundColor: colors.pilhaCartaClara, transform: [{ rotate: '3deg' }, { translateY: 14 }], left: 14, right: 14 },
  cartaFundo2: { backgroundColor: colors.pilhaCartaMedia, transform: [{ rotate: '-4deg' }, { translateY: 24 }], left: 22, right: 22 },
  botoes: { flexDirection: 'row', gap: 10 },
  carimbo: {
    position: 'absolute',
    top: 22,
    right: 18,
    transform: [{ rotate: '-8deg' }],
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primaryDark,
  },
  carimboTexto: { fontFamily: typography.bold, fontSize: 16, letterSpacing: 1.5, color: colors.primary },
  botao: { flex: 1 },
  aviso: { fontFamily: typography.semiBold, fontSize: 13, color: colors.error, textAlign: 'center', marginTop: 10 },
  banner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 13, lineHeight: 18, color: colors.white },
});
