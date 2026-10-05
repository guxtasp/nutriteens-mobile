// src/features/recordatorio/screens/RecordatorioRefeicaoScreen.tsx
import React from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../../../../shared/ui/BackButton';
import { AppButton } from '../../../../../shared/ui/AppButton';
import { AppText } from '../../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../../../shared/ui/SpeechBubble';
import { GradeDeAlimentos } from '../components/GradeDeAlimentos';
import { useRecordatorioRefeicao } from '../hooks/useRecordatorioRefeicao';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import { OptionButton } from '../../../../../shared/ui/OptionButton';
import { MessageBanner } from '../../../../../shared/ui/MessageBanner';

export default function RecordatorioRefeicaoScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();

  const {
    refeicao,
    ehUltima,
    alimentos,
    selecionados,
    naoComeuNada,
    carregando,
    salvando,
    podeAvancar,
    alternarSelecao,
    marcarNaoComeuNada,
    avancar,
    message,
    type,
    clearMessage,
  } = useRecordatorioRefeicao({
    navigation,
    indice: route.params?.indice ?? 0,
    recordatorioId: route.params?.recordatorioId,
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <MessageBanner message={message} type={type} onClose={clearMessage} style={[styles.topBanner, { top: insets.top + 12 }]} />
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.header}>
        <BroxisMascot pose="pensando" entrance="fade" size={70} showParticles={false} />
        <SpeechBubble text={refeicao.perguntaBroxis} typewriter={false} tailPosition="left" style={styles.bubble} />
      </View>

      <AppText style={styles.tituloRefeicao}>{refeicao.titulo}</AppText>

      {carregando ? (
        <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <OptionButton
                label="Não comi nada nessa refeição"
                ativo={naoComeuNada}
                onPress={marcarNaoComeuNada}
                style={styles.botaoNaoComeu}
            />

            <GradeDeAlimentos alimentos={alimentos} selecionados={selecionados} onAlternar={alternarSelecao} />
        </ScrollView>
      )}

      <AppButton
        label={salvando ? 'SALVANDO...' : ehUltima ? 'FINALIZAR' : 'CONTINUAR'}
        backgroundColor={podeAvancar ? colors.primaryDark : '#B8B8B8'}
        textColor={colors.white}
        shadowColor="#123024"
        fullWidth
        disabled={!podeAvancar || salvando}
        onPress={avancar}
        style={styles.continueButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBanner: { position: 'absolute', width: '90%', alignSelf: 'center', zIndex: 20 },
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bubble: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 8,
  },
  tituloRefeicao: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  linkNaoComeu: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkTexto: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: '#8A8A8A',
    textDecorationLine: 'underline',
  },
  linkTextoAtivo: {
    color: colors.primaryDark,
    fontFamily: typography.bold,
  },
  continueButton: {
    marginBottom: 70,
  },
  botaoNaoComeu: {
    marginBottom: 16,
  },
});