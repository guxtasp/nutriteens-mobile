// src/features/adolescente/screens/ConsumoAguaScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { BackButton } from '../../../shared/ui/BackButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { useAguaHoje } from '../hooks/useAguaHoje';
import GarrafaAnimada from '../components/GarrafaAnimada';
import AguaSlider from '../components/AguaSlider';
import PesoAlturaModal from '../components/PesoAlturaModal';
import GuiaAguaSheet from '../components/GuiaAguaSheet';
import SucessoRegistroModal from '../components/SucessoRegistroModal';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'ConsumoAgua'>;

export default function ConsumoAguaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    precisaPesoAltura,
    metaMl,
    mlHoje,
    mediaSemanal,
    mediaMensal,
    registrando,
    progresso,
    salvarPesoAltura,
    registrar,
  } = useAguaHoje();

  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(200);
  const [sheetGuia, setSheetGuia] = useState(false);
  const [sucessoVisivel, setSucessoVisivel] = useState(false);
  const [metaAtingidaAgora, setMetaAtingidaAgora] = useState(false);

  const handleRegistrar = useCallback(async () => {
    const novoTotal = await registrar(quantidadeSelecionada);
    if (novoTotal != null) {
      setMetaAtingidaAgora(novoTotal >= metaMl);
    }
    setSucessoVisivel(true);
  }, [registrar, quantidadeSelecionada, metaMl]);

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>Consumo de água</AppText>
          <AppText style={styles.subtitulo}>Resumo diário do seu consumo de água</AppText>
        </View>
      </View>

      <View style={styles.corpo}>
        <View style={styles.garrafaBloco}>
          <GarrafaAnimada progresso={progresso} />

          <View style={styles.infoDireita}>
            <Pressable style={styles.botaoInfo} onPress={() => setSheetGuia(true)}>
            <Ionicons name="information" size={18} color="#fff" />
            </Pressable>
            <AppText style={styles.rotuloHoje}>Hoje</AppText>
            <AppText style={styles.valorHoje}>{mlHoje} ml</AppText>
            <AppText style={styles.meta}>Meta: {metaMl} ml</AppText>
          </View>
        </View>

        <View style={styles.progressoLinha}>
          <View style={styles.cardProgresso}>
            <View style={styles.cardProgressoTopo}>
              <Ionicons name="trending-up" size={14} color={colors.primaryDark} />
              <AppText style={styles.cardProgressoLabel}>Seu progresso semanal</AppText>
            </View>
            <AppText style={styles.cardProgressoValor}>
              {mediaSemanal} <AppText style={styles.cardProgressoUnidade}>ml</AppText>
            </AppText>
            <AppText style={styles.cardProgressoSub}>(Média)</AppText>
          </View>

          <View style={styles.cardProgresso}>
            <View style={styles.cardProgressoTopo}>
              <Ionicons name="trending-up" size={14} color={colors.primaryDark} />
              <AppText style={styles.cardProgressoLabel}>Seu progresso mensal</AppText>
            </View>
            <AppText style={styles.cardProgressoValor}>
              {mediaMensal} <AppText style={styles.cardProgressoUnidade}>ml</AppText>
            </AppText>
            <AppText style={styles.cardProgressoSub}>(Média)</AppText>
          </View>
        </View>

        <AppText style={styles.pergunta}>Quantos ml você consumiu?</AppText>

        <AguaSlider valor={quantidadeSelecionada} onChange={setQuantidadeSelecionada} step={100} min={0} max={1000} />
        <Pressable
          style={[styles.botaoRegistrar, registrando && { opacity: 0.6 }]}
          onPress={handleRegistrar}
          disabled={registrando}
        >
          <AppText style={styles.botaoRegistrarTexto}>REGISTRE AQUI</AppText>
        </Pressable>
      </View>

      <PesoAlturaModal visivel={precisaPesoAltura} onConfirmar={salvarPesoAltura} />
      <GuiaAguaSheet visivel={sheetGuia} onFechar={() => setSheetGuia(false)} />
      <SucessoRegistroModal
        visivel={sucessoVisivel}
        quantidade={quantidadeSelecionada}
        mensagem={
          metaAtingidaAgora
            ? 'Parabéns! Você atingiu sua meta diária de água! 🎉'
            : `Você registrou ${quantidadeSelecionada}ml de água agora!`
        }
        onFechar={() => setSucessoVisivel(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, marginTop: 20, backgroundColor: colors.white ?? '#fff' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  botaoInfo: { width: 25, height: 25, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  corpo: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  garrafaBloco: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20 },
  infoDireita: { flex: 1, alignItems: 'flex-end', paddingBottom: 40, marginLeft: 16 },
  rotuloHoje: { fontFamily: typography.medium, fontSize: 16, color: colors.primaryDark },
  valorHoje: { fontFamily: typography.bold, fontSize: 32, color: colors.primaryDark, marginTop: 4 },
  meta: { fontFamily: typography.regular, fontSize: 16, color: colors.primaryDark, marginTop: 4 },
  progressoLinha: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  cardProgresso: { flex: 1, backgroundColor: '#CDE7D6', borderRadius: 16, padding: 14 },
  cardProgressoTopo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardProgressoLabel: { fontFamily: typography.medium, fontSize: 11, color: colors.primaryDark, flexShrink: 1 },
  cardProgressoValor: { fontFamily: typography.bold, fontSize: 26, color: colors.primaryDark },
  cardProgressoUnidade: { fontFamily: typography.regular, fontSize: 14 },
  cardProgressoSub: { fontFamily: typography.regular, fontSize: 11, color: '#4A7A5A', marginTop: 2 },
  pergunta: { fontFamily: typography.medium, fontSize: 15, color: colors.primaryDark, textAlign: 'center', marginBottom: 12 },
  botaoRegistrar: { backgroundColor: colors.primaryDark, borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  botaoRegistrarTexto: { fontFamily: typography.bold, fontSize: 13, color: '#fff', letterSpacing: 0.5 },
});