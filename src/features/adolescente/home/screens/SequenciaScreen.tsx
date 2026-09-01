// src/features/adolescente/home/screens/SequenciaScreen.tsx
//
// Tela de Sequência, acessada a partir do "pill" do foguinho no HomeHeader.
// Layout montado com FORMAS (círculos, barras, ícones) como primeira
// passada visual/de interação — trocar por assets finais depois, sem mexer
// na estrutura.
//
// Revisão 2 (feedback de design): removidas as bordas tipo-botão dos
// cartões, unificada a cor da sequência (sem rosa — era o preenchimento das
// "gotas" da semana, trocado por flame na mesma cor do resto), adicionado
// gradiente de fundo que muda de tom conforme o estado, indicador de "você
// está aqui" proporcional na barra do desafio, e animações de entrada
// (contagem, barra, cartões em cascata).
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useHomeData } from '../hooks/useHomeData';
import { calcularDesafioBroxis } from '../utils/desafioBroxis';
import PerdaSequenciaOverlay, { DURACAO_MS as DURACAO_PERDA_MS } from '../components/PerdaSequenciaOverlay';

const CORES_STATUS_MANTIDO = new Set(['mantido', 'hoje_mantido']);

// cor única da sequência — usada no foguinho grande, na semana e no badge
// do desafio, pra não ter cor "de marca" concorrente (era o motivo do rosa
// nas gotas da semana antes: agora é tudo a mesma cor)
const COR_SEQUENCIA = '#8BCF4A';
const COR_SEQUENCIA_CLARA = '#8BCF4A';
const CINZA_INATIVO = '#C7D0CC';
const CINZA_FUNDO = '#F2F4F3';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatarDataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return `${dia} ${MESES[mes - 1]} ${ano}`;
}

export default function SequenciaScreen() {
  const navigation = useNavigation();
  const { sequenciaAtual, maiorSequencia, dias, hojeISO } = useHomeData();

  // --- estado só de demonstração: sobrepõe os números reais depois que a
  // animação de perda roda, pra dar pra ver a tela "resetada" sem precisar
  // de uma sequência de verdade quebrada agora. Remover quando o gatilho
  // real (abaixo) existir. ---
  const [demoQuebrada, setDemoQuebrada] = useState(false);
  const [animandoPerda, setAnimandoPerda] = useState(false);

  const sequenciaExibida = demoQuebrada ? 0 : sequenciaAtual;
  const desafio = calcularDesafioBroxis(sequenciaExibida);
  const progresso = desafio.diaAtual / desafio.duracaoDias;

  const dataInicioEstim = sequenciaAtual > 0
    ? formatarDataCurta(dias[Math.max(0, dias.length - sequenciaAtual)]?.data ?? hojeISO)
    : null;

  // --- animações de entrada: cascata dos blocos + contagem do número + barra ---
  const entradaFoguinho = useRef(new Animated.Value(0)).current;
  const entradaSemana = useRef(new Animated.Value(0)).current;
  const entradaDesafio = useRef(new Animated.Value(0)).current;
  const entradaRodape = useRef(new Animated.Value(0)).current;
  const numeroAnimado = useRef(new Animated.Value(0)).current;
  const barraAnimada = useRef(new Animated.Value(0)).current;
  const [numeroExibidoTexto, setNumeroExibidoTexto] = useState(sequenciaExibida);
  // brilho pulsante atrás do foguinho grande, mesmo princípio da celebração
  const brilhoEscala = useRef(new Animated.Value(1)).current;
  const brilhoOpacity = useRef(new Animated.Value(0.35)).current;
  // pulso do badge "você está aqui" na barra do desafio
  const badgePulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(entradaFoguinho, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaSemana, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaDesafio, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(entradaRodape, { toValue: 1, duration: 320, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    Animated.loop(
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
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulso, { toValue: 1.18, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(badgePulso, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // contagem do número sempre que a sequência exibida mudar (inclusive reset da demo)
  useEffect(() => {
    numeroAnimado.setValue(0);
    const id = numeroAnimado.addListener(({ value }) => {
      setNumeroExibidoTexto(Math.round(value));
    });
    Animated.timing(numeroAnimado, {
      toValue: sequenciaExibida,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // dirige um listener JS, não uma prop de estilo
    }).start();
    return () => numeroAnimado.removeListener(id);
  }, [sequenciaExibida]);

  // barra do desafio sempre acompanhando o progresso atual
  useEffect(() => {
    Animated.timing(barraAnimada, {
      toValue: progresso,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false, // anima 'width', que não é suportado pelo driver nativo
    }).start();
  }, [progresso]);

  // TODO: trocar esse gatilho de demonstração por um evento real, comparando
  // a sequência salva localmente na última visita com a sequência atual: se
  // caiu pra 0 sem o usuário ter aberto a celebração de hoje, dispara aqui.
  function handleSimularPerda() {
    setAnimandoPerda(true);
  }

  const corGradienteTopo = sequenciaExibida > 0 ? COR_SEQUENCIA_CLARA : CINZA_FUNDO;
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
          onPress={() => navigation.goBack()}
          style={styles.fechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
        >
          <Ionicons name="close" size={22} color={colors.primaryDark} />
        </Pressable>
        <AppText style={styles.tituloHeader}>Sequência</AppText>
        <View style={styles.fecharEspaco} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {/* --- bloco principal: círculo do foguinho + número --- */}
        <Animated.View style={[styles.blocoFoguinho, subida(entradaFoguinho)]}>
          <View style={styles.circuloFoguinhoWrap}>
            <Animated.View
              style={[
                styles.brilhoFoguinho,
                sequenciaExibida === 0 && { backgroundColor: CINZA_INATIVO },
                { opacity: sequenciaExibida > 0 ? brilhoOpacity : 0.15, transform: [{ scale: brilhoEscala }] },
              ]}
            />
            <View style={[styles.circuloFoguinho, sequenciaExibida === 0 && styles.circuloFoguinhoApagado]}>
              <Ionicons
                name="flame"
                size={72}
                color={sequenciaExibida > 0 ? COR_SEQUENCIA : CINZA_INATIVO}
              />
            </View>
          </View>
          <AppText style={styles.numeroGrande}>{numeroExibidoTexto}</AppText>
          <AppText style={styles.rotulo}>
            {sequenciaExibida === 1 ? 'dia de sequência' : 'dias de sequência'}
          </AppText>
        </Animated.View>

        {/* --- semana --- */}
        <Animated.View style={[styles.cartaoSemana, subida(entradaSemana)]}>
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
        </Animated.View>

        {/* --- desafio do Bróxis --- */}
        <Animated.View style={subida(entradaDesafio)}>
          <AppText style={styles.tituloSecao}>Desafio do Bróxis</AppText>
          <View style={styles.cartaoDesafio}>
            <View style={styles.linhaDesafioTopo}>
              <AppText style={styles.desafioTitulo}>Desafio em {desafio.duracaoDias} dias</AppText>
              <AppText style={styles.desafioContagem}>
                Dia {desafio.diaAtual} de {desafio.duracaoDias}
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
            <AppText style={styles.rodapeValor}>{maiorSequencia} dias</AppText>
            <AppText style={styles.rodapeLabel}>Sequência recorde</AppText>
          </View>
        </Animated.View>

        {sequenciaAtual > 0 && !demoQuebrada && (
          <Pressable onPress={handleSimularPerda} style={styles.botaoDemo}>
            <AppText style={styles.botaoDemoTexto}>Simular perda da sequência (demo)</AppText>
          </Pressable>
        )}
      </ScrollView>

      <PerdaSequenciaOverlay
        visivel={animandoPerda}
        onFinalizado={() => {
          setDemoQuebrada(true);
          setAnimandoPerda(false);
        }}
      />
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
  tituloHeader: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  conteudo: { paddingHorizontal: 20, paddingBottom: 40, marginTop: 20, },
  blocoFoguinho: { alignItems: 'center', marginTop: 12, marginBottom: 24 },
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
    marginTop:20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
  tituloSecao: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: COR_SEQUENCIA,
    marginBottom: 8,
  },
  cartaoDesafio: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  linhaDesafioTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  desafioTitulo: { fontFamily: typography.bold, fontSize: 14, color: COR_SEQUENCIA },
  desafioContagem: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rodapeCaixa: { flex: 1, alignItems: 'center', gap: 2 },
  rodapeDivisor: { width: 1, backgroundColor: '#E4E9E6' },
  rodapeValor: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  rodapeLabel: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94' },
  botaoDemo: {
    alignSelf: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: CINZA_INATIVO,
  },
  botaoDemoTexto: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94' },
});
