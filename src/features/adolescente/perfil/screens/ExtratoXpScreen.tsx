// src/features/adolescente/perfil/screens/ExtratoXpScreen.tsx
//
// Extrato de pontos (RF054): de onde veio cada XP, com data, origem e valor.
// Somente leitura — os lançamentos são gravados pelo servidor (função conceder_xp).
// Visual no mesmo estilo da tela de Sequência: gradiente no topo, número que conta,
// brilho pulsante, cartões que sobem em cascata. Dinâmico: filtros por tipo, resumo
// de hoje/7 dias, puxar para atualizar e "ver mais".
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../../shared/ui/AppText';
import { ProgressBar } from '../../../../shared/ui/ProgressBar';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackLeve, feedbackSelecao, feedbackToque } from '../../../../shared/audio/feedback';
import { useExtratoXp } from '../hooks/useExtratoXp';
import { useGamificacao } from '../hooks/useGamificacao';
import {
  FILTROS_EXTRATO,
  formatarQuantidade,
  iconeOrigem,
  rotuloOrigem,
  tituloLancamento,
  type LancamentoXp,
} from '../utils/extratoXp';

const COR_XP = '#8BCF4A';
const CINZA_FUNDO = '#F2F4F3';
const CINZA_TEXTO = '#7A8B94';

const subida = (valor: Animated.Value) => ({
  opacity: valor,
  transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
});

/** Linha do extrato que entra com um pequeno atraso, em cascata. */
function LinhaExtrato({ item, indice, divisor }: { item: LancamentoXp; indice: number; divisor: boolean }) {
  const entrada = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrada, {
      toValue: 1,
      duration: 280,
      delay: Math.min(indice, 8) * 45,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [entrada, indice]);

  return (
    <Animated.View
      style={[styles.linha, divisor && styles.linhaDivisor, subida(entrada)]}
      accessible
      accessibilityLabel={`${tituloLancamento(item)}, ${rotuloOrigem(item.origem)}, ${item.quantidade} pontos`}
    >
      <View style={styles.icone}>
        <Ionicons name={iconeOrigem(item.origem) as any} size={18} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={styles.linhaTitulo} numberOfLines={2}>
          {tituloLancamento(item)}
        </AppText>
        <AppText style={styles.linhaSub}>{rotuloOrigem(item.origem)}</AppText>
      </View>
      <View style={styles.pilula}>
        <AppText style={styles.pilulaTexto}>{formatarQuantidade(item.quantidade)}</AppText>
      </View>
    </Animated.View>
  );
}

export default function ExtratoXpScreen() {
  const navigation = useNavigation();
  const { xpTotal, estado } = useGamificacao();
  const {
    dias,
    resumo,
    filtro,
    setFiltro,
    vazio,
    vazioFiltro,
    carregando,
    carregandoMais,
    atualizando,
    erro,
    temMais,
    recarregar,
    atualizar,
    carregarMais,
  } = useExtratoXp();

  // --- animações: cascata dos blocos, número que conta e brilho pulsante ---
  const entradaTopo = useRef(new Animated.Value(0)).current;
  const entradaResumo = useRef(new Animated.Value(0)).current;
  const entradaLista = useRef(new Animated.Value(0)).current;
  const numeroAnimado = useRef(new Animated.Value(0)).current;
  const brilhoEscala = useRef(new Animated.Value(1)).current;
  const brilhoOpacity = useRef(new Animated.Value(0.35)).current;
  const [numeroTexto, setNumeroTexto] = useState(0);

  useEffect(() => {
    const entrada = Animated.stagger(90, [
      Animated.timing(entradaTopo, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaResumo, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaLista, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]);
    entrada.start();

    const loopBrilho = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(brilhoEscala, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(brilhoOpacity, { toValue: 0.55, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(brilhoEscala, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(brilhoOpacity, { toValue: 0.35, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]),
    );
    loopBrilho.start();

    // sem isso o loop continua rodando depois que a tela fecha
    return () => {
      entrada.stop();
      loopBrilho.stop();
    };
  }, []);

  // conta até o saldo sempre que ele mudar (inclusive quando o valor real chega do servidor)
  useEffect(() => {
    const id = numeroAnimado.addListener(({ value }) => setNumeroTexto(Math.round(value)));
    const contagem = Animated.timing(numeroAnimado, {
      toValue: xpTotal,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // dirige um listener JS, não uma prop de estilo
    });
    // batidinha ao terminar de contar (só com saldo, pra tela zerada não vibrar à toa)
    contagem.start(({ finished }) => {
      if (finished && xpTotal > 0) feedbackLeve();
    });
    return () => {
      contagem.stop();
      numeroAnimado.removeListener(id);
    };
  }, [xpTotal]);

  // vibra quando o "puxar para atualizar" termina (true -> false)
  const estavaAtualizando = useRef(false);
  useEffect(() => {
    if (estavaAtualizando.current && !atualizando) feedbackLeve();
    estavaAtualizando.current = atualizando;
  }, [atualizando]);

  return (
    <SafeAreaView style={styles.tela}>
      <LinearGradient
        colors={[COR_XP, colors.white, colors.white, colors.white]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <Pressable
          onPress={() => {
            feedbackToque();
            navigation.goBack();
          }}
          style={styles.fechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <Ionicons name="close" size={22} color={colors.primaryDark} />
        </Pressable>
        <AppText style={styles.tituloHeader}>Extrato de pontos</AppText>
        <View style={styles.fecharEspaco} />
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => void atualizar()} tintColor={colors.primaryDark} />
        }
      >
        {/* --- bloco principal: círculo com brilho + saldo --- */}
        <Animated.View style={[styles.blocoSaldo, subida(entradaTopo)]}>
          <View style={styles.circuloWrap}>
            <Animated.View style={[styles.brilho, { opacity: brilhoOpacity, transform: [{ scale: brilhoEscala }] }]} />
            <View style={styles.circulo}>
              <Ionicons name="flash" size={64} color={COR_XP} />
            </View>
          </View>
          <AppText style={styles.numeroGrande} accessibilityLabel={`Saldo de ${xpTotal} pontos de experiência`}>
            {numeroTexto}
          </AppText>
          <AppText style={styles.rotulo}>pontos de experiência</AppText>

          <View style={styles.faseCartao}>
            <View style={styles.faseTopo}>
              <AppText style={styles.faseTitulo}>{estado.atual.titulo}</AppText>
              <AppText style={styles.faseSub}>
                {estado.proxima ? `faltam ${estado.xpFaltando} XP para ${estado.proxima.titulo}` : 'fase máxima!'}
              </AppText>
            </View>
            <ProgressBar progress={estado.progresso} />
          </View>
        </Animated.View>

        {/* --- resumo: hoje e últimos 7 dias --- */}
        <Animated.View style={[styles.resumo, subida(entradaResumo)]}>
          <View style={styles.resumoCaixa}>
            <AppText style={styles.resumoValor}>+{resumo.hoje}</AppText>
            <AppText style={styles.resumoLabel}>Hoje</AppText>
          </View>
          <View style={styles.resumoDivisor} />
          <View style={styles.resumoCaixa}>
            <AppText style={styles.resumoValor}>+{resumo.ultimos7Dias}</AppText>
            <AppText style={styles.resumoLabel}>Últimos 7 dias</AppText>
          </View>
        </Animated.View>

        {/* --- filtros + lista --- */}
        <Animated.View style={subida(entradaLista)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
            {FILTROS_EXTRATO.map((f) => {
              const ativo = f.id === filtro;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    if (!ativo) feedbackSelecao();
                    setFiltro(f.id);
                  }}
                  style={[styles.chip, ativo && styles.chipAtivo]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={`Filtrar por ${f.rotulo}`}
                >
                  <Ionicons name={f.icone as any} size={14} color={ativo ? colors.white : colors.primaryDark} />
                  <AppText style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{f.rotulo}</AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          {carregando ? (
            <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />
          ) : erro ? (
            <View style={styles.vazio}>
              <Ionicons name="cloud-offline-outline" size={36} color={CINZA_TEXTO} />
              <AppText style={styles.vazioTexto}>Não deu para carregar o extrato agora.</AppText>
              <Pressable
                style={styles.botao}
                onPress={() => {
                  feedbackLeve();
                  void recarregar();
                }}
                accessibilityRole="button"
              >
                <AppText style={styles.botaoTexto}>Tentar de novo</AppText>
              </Pressable>
            </View>
          ) : vazio ? (
            <View style={styles.vazio}>
              <Ionicons name="leaf-outline" size={36} color={CINZA_TEXTO} />
              <AppText style={styles.vazioTexto}>
                Você ainda não ganhou pontos. Conclua uma lição ou a missão do dia e ele aparece aqui!
              </AppText>
            </View>
          ) : vazioFiltro ? (
            <View style={styles.vazio}>
              <Ionicons name="search-outline" size={36} color={CINZA_TEXTO} />
              <AppText style={styles.vazioTexto}>Nada nessa categoria ainda.</AppText>
            </View>
          ) : (
            <>
              {dias.map((dia) => (
                // a chave inclui o filtro: ao trocar de filtro as linhas entram animadas de novo
                <View key={`${filtro}-${dia.data}`} style={styles.dia}>
                  <View style={styles.diaTopo}>
                    <AppText style={styles.diaTitulo}>{dia.titulo}</AppText>
                    <AppText style={styles.diaTotal}>{formatarQuantidade(dia.total)}</AppText>
                  </View>
                  <View style={styles.cartao}>
                    {dia.itens.map((item, i) => (
                      <LinhaExtrato key={item.id} item={item} indice={i} divisor={i > 0} />
                    ))}
                  </View>
                </View>
              ))}

              {temMais && (
                <Pressable
                  style={[styles.botao, { alignSelf: 'center', marginTop: 18 }]}
                  onPress={() => {
                    feedbackLeve();
                    void carregarMais();
                  }}
                  disabled={carregandoMais}
                  accessibilityRole="button"
                >
                  {carregandoMais ? (
                    <ActivityIndicator color={colors.primaryDark} />
                  ) : (
                    <AppText style={styles.botaoTexto}>Ver mais</AppText>
                  )}
                </Pressable>
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const sombra = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 },
  fechar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  fecharEspaco: { width: 36 },
  tituloHeader: { flex: 1, textAlign: 'center', fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  conteudo: { paddingHorizontal: 20, paddingBottom: 50, marginTop: 12 },

  blocoSaldo: { alignItems: 'center', marginTop: 8, marginBottom: 22 },
  circuloWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brilho: { position: 'absolute', width: 148, height: 148, borderRadius: 74, backgroundColor: COR_XP },
  circulo: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroGrande: { marginTop: 18, fontFamily: typography.bold, fontSize: 50, color: colors.primary, lineHeight: 52 },
  rotulo: { fontFamily: typography.bold, fontSize: 15, color: CINZA_TEXTO, marginTop: 2 },
  faseCartao: { alignSelf: 'stretch', backgroundColor: colors.white, borderRadius: 16, padding: 14, marginTop: 18, gap: 10, ...sombra },
  faseTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faseTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  faseSub: { fontFamily: typography.regular, fontSize: 12, color: CINZA_TEXTO },

  resumo: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, paddingVertical: 16, marginBottom: 20, ...sombra },
  resumoCaixa: { flex: 1, alignItems: 'center', gap: 2 },
  resumoDivisor: { width: 1, backgroundColor: '#E4E9E6' },
  resumoValor: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  resumoLabel: { fontFamily: typography.regular, fontSize: 12, color: CINZA_TEXTO },

  filtros: { gap: 8, paddingBottom: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: CINZA_FUNDO,
  },
  chipAtivo: { backgroundColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark },
  chipTextoAtivo: { color: colors.white },

  dia: { marginTop: 18 },
  diaTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  diaTitulo: { fontFamily: typography.bold, fontSize: 15, color: COR_XP },
  diaTotal: { fontFamily: typography.semiBold, fontSize: 12, color: CINZA_TEXTO },
  cartao: { backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 14, ...sombra },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  linhaDivisor: { borderTopWidth: 1, borderTopColor: '#E4E9E6' },
  icone: { width: 36, height: 36, borderRadius: 18, backgroundColor: COR_XP, alignItems: 'center', justifyContent: 'center' },
  linhaTitulo: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
  linhaSub: { fontFamily: typography.regular, fontSize: 11, color: CINZA_TEXTO, marginTop: 1 },
  pilula: { backgroundColor: '#EEF8E3', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pilulaTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },

  vazio: { alignItems: 'center', gap: 12, marginTop: 36, paddingHorizontal: 10 },
  vazioTexto: { fontSize: 14, color: colors.primaryDark, textAlign: 'center' },
  botao: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
});