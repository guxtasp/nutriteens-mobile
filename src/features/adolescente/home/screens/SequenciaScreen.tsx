// src/features/adolescente/home/screens/SequenciaScreen.tsx
//
// Tela de Sequência, acessada a partir do "pill" do foguinho no HomeHeader.
// Layout montado com FORMAS (círculos, barras, ícones) como primeira
// passada visual/de interação — trocar por assets finais depois, sem mexer
// na estrutura.
//
// Cor única da sequência (COR_SEQUENCIA) no foguinho, na semana e no desafio;
// gradiente de fundo muda de tom conforme o estado; animações de entrada
// (contagem, barra, cartões em cascata).
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Pressable, ScrollView, Animated, Easing, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { formatarDataISO } from '../../../../shared/utils/data';
import { feedbackLeve, feedbackToque } from '../../../../shared/audio/feedback';
import { useHomeData } from '../hooks/useHomeData';
import { calcularDesafioBroxis } from '../utils/desafioBroxis';

// sombra única dos cartões (mesma do Extrato de pontos)
const sombra = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const;

const CORES_STATUS_MANTIDO = new Set(['mantido', 'hoje_mantido']);

// cor única da sequência — usada no foguinho grande, na semana e no badge
// do desafio, pra não ter cor "de marca" concorrente (era o motivo do rosa
// nas gotas da semana antes: agora é tudo a mesma cor)
const COR_SEQUENCIA = colors.primary;
const CINZA_INATIVO = '#C7D0CC';
const CINZA_FUNDO = '#F2F4F3';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return `${dia} ${MESES[mes - 1]} ${ano}`;
}

// A sequência é contada em dias corridos. Se hoje já foi mantido, o último dia
// da sequência é hoje; senão é ontem (hoje ainda pode ser mantido mais tarde).
// O início é, portanto, o último dia menos (sequência - 1) dias.
function calcularDataInicio(hojeISO: string, sequencia: number, hojeMantido: boolean): string {
  const [ano, mes, dia] = hojeISO.split('-').map(Number);
  const diasAtras = (hojeMantido ? 0 : 1) + (sequencia - 1);
  return formatarDataISO(new Date(ano, mes - 1, dia - diasAtras));
}

function textoDias(n: number): string {
  return n === 1 ? '1 dia' : `${n} dias`;
}

export default function SequenciaScreen() {
  const navigation = useNavigation();
  const { carregando, dadosCarregados, sequenciaAtual, maiorSequencia, dias, hojeISO, diaDeHojeMantido, recarregar } =
    useHomeData();

  const desafio = calcularDesafioBroxis(sequenciaAtual);
  const progresso = desafio.diaAtual / desafio.duracaoDias;

  const dataInicioEstim = sequenciaAtual > 0
    ? formatarDataCurta(calcularDataInicio(hojeISO, sequenciaAtual, diaDeHojeMantido))
    : null;

  const diasMantidosNaSemana = dias.filter((dia) => CORES_STATUS_MANTIDO.has(dia.status)).length;
  const diasFaltando = desafio.duracaoDias - desafio.diaAtual;

  // cartão de status (mesmo papel do cartão de fase no Extrato de pontos): diz o que fazer agora
  const status: { icone: keyof typeof Ionicons.glyphMap; cor: string; titulo: string; sub: string } = diaDeHojeMantido
    ? { icone: 'checkmark', cor: COR_SEQUENCIA, titulo: 'Hoje já contou!', sub: 'Volte amanhã para manter o foguinho aceso.' }
    : sequenciaAtual > 0
      ? { icone: 'time', cor: colors.warning, titulo: 'Falta registrar hoje', sub: 'Registre água, refeição ou atividade para não perder a sequência.' }
      : { icone: 'flame', cor: CINZA_INATIVO, titulo: 'Acenda o foguinho', sub: 'Registre algo hoje para começar sua sequência.' };

  // puxar para atualizar, igual ao Extrato
  const [atualizando, setAtualizando] = useState(false);
  async function handleAtualizar() {
    setAtualizando(true);
    try {
      await recarregar();
    } finally {
      setAtualizando(false);
    }
  }

  // --- animações de entrada: cascata dos blocos + contagem do número + barra ---
  const entradaFoguinho = useRef(new Animated.Value(0)).current;
  const entradaSemana = useRef(new Animated.Value(0)).current;
  const entradaDesafio = useRef(new Animated.Value(0)).current;
  const entradaRodape = useRef(new Animated.Value(0)).current;
  const numeroAnimado = useRef(new Animated.Value(0)).current;
  const barraAnimada = useRef(new Animated.Value(0)).current;
  const [numeroExibidoTexto, setNumeroExibidoTexto] = useState(sequenciaAtual);
  // brilho pulsante atrás do foguinho grande, mesmo princípio da celebração
  const brilhoEscala = useRef(new Animated.Value(1)).current;
  const brilhoOpacity = useRef(new Animated.Value(0.35)).current;
  // pulso do badge "você está aqui" na barra do desafio
  const badgePulso = useRef(new Animated.Value(1)).current;

  // cascata de entrada: só começa quando os dados chegam (até lá a tela mostra o carregando,
  // em vez de piscar uma sequência "0" cinza e depois trocar)
  useEffect(() => {
    if (!dadosCarregados) return;
    const entrada = Animated.stagger(90, [
      Animated.timing(entradaFoguinho, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaSemana, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaDesafio, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaRodape, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]);
    entrada.start();
    return () => entrada.stop();
  }, [dadosCarregados]);

  useEffect(() => {
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
      ])
    );
    loopBrilho.start();

    const loopBadge = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulso, { toValue: 1.18, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(badgePulso, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loopBadge.start();

    // sem isso os loops continuam rodando depois que a tela fecha
    return () => {
      loopBrilho.stop();
      loopBadge.stop();
    };
  }, []);

  // contagem do número sempre que a sequência mudar (ex.: quando o valor real chega)
  useEffect(() => {
    numeroAnimado.setValue(0);
    const id = numeroAnimado.addListener(({ value }) => {
      setNumeroExibidoTexto(Math.round(value));
    });
    const contagem = Animated.timing(numeroAnimado, {
      toValue: sequenciaAtual,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // dirige um listener JS, não uma prop de estilo
    });
    // batidinha ao terminar de contar (só quando há sequência, pra tela zerada não vibrar à toa)
    contagem.start(({ finished }) => {
      if (finished && sequenciaAtual > 0) feedbackLeve();
    });
    return () => {
      contagem.stop();
      numeroAnimado.removeListener(id);
    };
  }, [sequenciaAtual]);

  // barra do desafio sempre acompanhando o progresso atual
  useEffect(() => {
    const animacao = Animated.timing(barraAnimada, {
      toValue: progresso,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // anima 'width', que não é suportado pelo driver nativo
    });
    animacao.start();
    return () => animacao.stop();
  }, [progresso]);

  const corGradienteTopo = sequenciaAtual > 0 ? COR_SEQUENCIA : CINZA_FUNDO;
  const barraLargura = barraAnimada.interpolate({
    inputRange: [0, 1],
    outputRange: ['4%', '100%'],
  });
  const badgeLeft = barraAnimada.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '96%'], // 96% em vez de 100% pra o badge não vazar da borda do cartão
  });

  const subida = (valor: Animated.Value) => ({
    opacity: valor,
    transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  });

  return (
    <SafeAreaView style={styles.tela}>
      <LinearGradient
        colors={[corGradienteTopo, colors.white, colors.white, colors.white]}
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
        <AppText style={styles.tituloHeader}>Sequência</AppText>
        <View style={styles.fecharEspaco} />
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={atualizando} onRefresh={() => void handleAtualizar()} tintColor={colors.primaryDark} />
        }
      >
        {!dadosCarregados ? (
          carregando ? (
            <ActivityIndicator color={colors.primaryDark} style={styles.carregando} />
          ) : (
            <View style={styles.vazio}>
              <Ionicons name="cloud-offline-outline" size={36} color="#7A8B94" />
              <AppText style={styles.vazioTexto}>Não deu para carregar sua sequência agora.</AppText>
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
          )
        ) : (
          <>
            {/* --- bloco principal: círculo do foguinho + número --- */}
            <Animated.View style={[styles.blocoFoguinho, subida(entradaFoguinho)]}>
              <View style={styles.circuloFoguinhoWrap}>
                <Animated.View
                  style={[
                    styles.brilhoFoguinho,
                    sequenciaAtual === 0 && { backgroundColor: CINZA_INATIVO },
                    { opacity: sequenciaAtual > 0 ? brilhoOpacity : 0.15, transform: [{ scale: brilhoEscala }] },
                  ]}
                />
                <View style={[styles.circuloFoguinho, sequenciaAtual === 0 && styles.circuloFoguinhoApagado]}>
                  <Ionicons
                    name="flame"
                    size={72}
                    color={sequenciaAtual > 0 ? COR_SEQUENCIA : CINZA_INATIVO}
                  />
                </View>
              </View>
              <AppText style={styles.numeroGrande}>{numeroExibidoTexto}</AppText>
              <AppText style={styles.rotulo}>
                {sequenciaAtual === 1 ? 'dia de sequência' : 'dias de sequência'}
              </AppText>

              <View style={styles.statusCartao} accessible accessibilityLabel={`${status.titulo}. ${status.sub}`}>
                <View style={[styles.statusIcone, { backgroundColor: status.cor }]}>
                  <Ionicons name={status.icone} size={18} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.statusTitulo}>{status.titulo}</AppText>
                  <AppText style={styles.statusSub}>{status.sub}</AppText>
                </View>
              </View>
            </Animated.View>

            {/* --- semana --- */}
            <Animated.View style={subida(entradaSemana)}>
              <View style={styles.secaoTopo}>
                <AppText style={styles.tituloSecao}>Esta semana</AppText>
                <AppText style={styles.secaoTotal}>{diasMantidosNaSemana} de 7 dias</AppText>
              </View>
              <View style={styles.cartaoSemana}>
                {dias.map((dia) => {
                  const mantido = CORES_STATUS_MANTIDO.has(dia.status);
                  const ehHoje = dia.status === 'hoje_pendente' || dia.status === 'hoje_mantido';
                  return (
                    <View key={dia.data} style={styles.colunaDia}>
                      <AppText style={[styles.labelDia, ehHoje && styles.labelDiaHoje]}>{dia.label.charAt(0)}</AppText>
                      <AppText style={[styles.numeroDia, ehHoje && styles.labelDiaHoje]}>{dia.numero}</AppText>
                      <View
                        style={[
                          styles.chamaBase,
                          mantido && styles.chamaMantida,
                          ehHoje && styles.chamaHoje,
                        ]}
                      >
                        <Ionicons name="flame" size={16} color={mantido ? colors.white : CINZA_INATIVO} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* --- desafio do Bróxis --- */}
            <Animated.View style={subida(entradaDesafio)}>
              <View style={styles.secaoTopo}>
                <AppText style={styles.tituloSecao}>Desafio do Bróxis</AppText>
                <AppText style={styles.secaoTotal}>
                  Dia {desafio.diaAtual} de {desafio.duracaoDias}
                </AppText>
              </View>
              <View style={styles.cartaoDesafio}>
                <View style={styles.linhaDesafioTopo}>
                  <AppText style={styles.desafioTitulo}>Desafio em {desafio.duracaoDias} dias</AppText>
                  <AppText style={styles.desafioContagem}>
                    {diasFaltando > 0
                      ? `faltam ${diasFaltando} ${diasFaltando === 1 ? 'dia' : 'dias'}`
                      : 'desafio máximo!'}
                  </AppText>
                </View>

                <View style={styles.barraArea}>
                  <View style={styles.barraFundo}>
                    <Animated.View style={[styles.barraPreenchida, { width: barraLargura }]} />
                  </View>

                  {/* marco de início (dia 0) */}
                  <View style={[styles.marcoBarra, { left: 0 }]}>
                    <Ionicons name="calendar" size={16} color={COR_SEQUENCIA} />
                  </View>
                  {/* marco final (dia = duração do desafio) */}
                  <View style={[styles.marcoBarra, { right: 0 }]}>
                    <Ionicons name="calendar" size={16} color={CINZA_INATIVO} />
                  </View>

                  {/* "você está aqui" — badge proporcional à posição real do progresso, com pulso.
                      Importante: 'left' (JS driver, width/left não são suportados pelo driver nativo)
                      e 'scale' (driver nativo) precisam estar em DOIS Animated.View separados —
                      misturar os dois no mesmo nó é o que causava os erros de animação nativa. */}
                  <Animated.View style={[styles.badgeHojeWrap, { left: badgeLeft }]}>
                    <Animated.View style={[styles.badgeHoje, { transform: [{ scale: badgePulso }] }]}>
                      <AppText style={styles.badgeHojeTexto}>{desafio.diaAtual}</AppText>
                    </Animated.View>
                  </Animated.View>
                </View>
              </View>
            </Animated.View>

            {/* --- rodapé: iniciada / recorde --- */}
            <Animated.View style={[styles.rodape, subida(entradaRodape)]}>
              <View style={styles.rodapeCaixa}>
                <AppText style={styles.rodapeValor}>{dataInicioEstim ?? '-'}</AppText>
                <AppText style={styles.rodapeLabel}>
                  {dataInicioEstim ? 'Sequência iniciada' : 'Sequência não iniciada'}
                </AppText>
              </View>
              <View style={styles.rodapeDivisor} />
              <View style={styles.rodapeCaixa}>
                <AppText style={styles.rodapeValor}>{textoDias(maiorSequencia)}</AppText>
                <AppText style={styles.rodapeLabel}>Sequência recorde</AppText>
              </View>
            </Animated.View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
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
  carregando: { marginTop: 80 },
  vazio: { alignItems: 'center', gap: 12, marginTop: 60, paddingHorizontal: 10 },
  vazioTexto: { fontSize: 14, color: colors.primaryDark, textAlign: 'center' },
  botao: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  tituloHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  conteudo: { paddingHorizontal: 20, paddingBottom: 50, marginTop: 12 },
  blocoFoguinho: { alignItems: 'center', marginTop: 8, marginBottom: 22 },
  circuloFoguinhoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  brilhoFoguinho: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: COR_SEQUENCIA,
  },
  circuloFoguinho: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloFoguinhoApagado: { backgroundColor: CINZA_FUNDO },
  numeroGrande: {
    marginTop: 18,
    fontFamily: typography.bold,
    fontSize: 50,
    color: colors.primary,
    lineHeight: 52,
  },
  rotulo: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: '#7A8B94',
    marginTop: 2,
  },
  cartaoSemana: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 24,
    ...sombra,
  },
  colunaDia: { alignItems: 'center', gap: 4, width: 36 },
  labelDia: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  numeroDia: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  labelDiaHoje: { color: COR_SEQUENCIA },
  chamaBase: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: CINZA_FUNDO,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  chamaMantida: { backgroundColor: COR_SEQUENCIA },
  chamaHoje: { borderWidth: 2, borderColor: colors.primaryDark },
  secaoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tituloSecao: { fontFamily: typography.bold, fontSize: 15, color: COR_SEQUENCIA },
  secaoTotal: { fontFamily: typography.semiBold, fontSize: 12, color: '#7A8B94' },
  statusCartao: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    ...sombra,
  },
  statusIcone: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  statusSub: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 1 },
  cartaoDesafio: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    ...sombra,
  },
  linhaDesafioTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  desafioTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  desafioContagem: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94' },
  barraArea: { height: 10, justifyContent: 'center', marginTop: 4 },
  barraFundo: {
    height: 10,
    borderRadius: 5,
    backgroundColor: CINZA_FUNDO,
    overflow: 'hidden',
  },
  barraPreenchida: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: COR_SEQUENCIA,
  },
  marcoBarra: { position: 'absolute', top: -3 },
  badgeHojeWrap: {
    position: 'absolute',
    top: -13,
    width: 32,
    height: 32,
    marginLeft: -16,
  },
  badgeHoje: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: COR_SEQUENCIA,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeHojeTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  rodape: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
    ...sombra,
  },
  rodapeCaixa: { flex: 1, alignItems: 'center', gap: 2 },
  rodapeDivisor: { width: 1, backgroundColor: '#E4E9E6' },
  rodapeValor: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  rodapeLabel: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94' },
});