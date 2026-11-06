// src/features/recordatorio/screens/RecordatorioRefeicaoScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator, TextInput, Pressable, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { filtrarAlimentosPorBusca } from '../utils/buscaAlimentos';

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

  // busca por nome: os alimentos já marcados continuam marcados mesmo fora do filtro
  const [busca, setBusca] = useState('');
  const indiceAtual = route.params?.indice ?? 0;
  useEffect(() => {
    setBusca('');
  }, [indiceAtual]);
  const visiveis = useMemo(() => filtrarAlimentosPorBusca(alimentos, busca), [alimentos, busca]);
  const buscando = busca.trim().length > 0;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.root, { paddingTop: insets.top + 20 }]}
    >
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <View style={styles.buscaCaixa}>
              <Ionicons name="search" size={18} color="#8A8A8A" />
              <TextInput
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar alimento"
                placeholderTextColor="#8A8A8A"
                style={styles.buscaInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Buscar alimento pelo nome"
              />
              {buscando && (
                <Pressable onPress={() => setBusca('')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Limpar busca">
                  <Ionicons name="close-circle" size={20} color="#8A8A8A" />
                </Pressable>
              )}
            </View>

            <OptionButton
                label="Não comi nada nessa refeição"
                ativo={naoComeuNada}
                onPress={marcarNaoComeuNada}
                style={styles.botaoNaoComeu}
            />

            {buscando && selecionados.size > 0 && (
              <AppText style={styles.dicaBusca}>
                {selecionados.size === 1 ? '1 alimento escolhido' : `${selecionados.size} alimentos escolhidos`} (os escolhidos
                continuam marcados mesmo fora desta busca)
              </AppText>
            )}

            {buscando && visiveis.length === 0 ? (
              <View style={styles.vazio}>
                <AppText style={styles.vazioTitulo}>Não encontrei esse alimento</AppText>
                <AppText style={styles.vazioTexto}>Confira a escrita ou tente uma parte do nome (ex.: “arroz”).</AppText>
                <Pressable onPress={() => setBusca('')} accessibilityRole="button" style={styles.vazioBotao}>
                  <AppText style={styles.vazioBotaoTexto}>Limpar busca</AppText>
                </Pressable>
              </View>
            ) : (
              <GradeDeAlimentos alimentos={visiveis} selecionados={selecionados} onAlternar={alternarSelecao} />
            )}
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
        style={[styles.continueButton, { marginBottom: insets.bottom + 16 }]}
      />
    </KeyboardAvoidingView>
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
    marginBottom: 16, // somado ao inset inferior real (barra de gestos / botões do Android) no JSX
  },
  buscaCaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    marginBottom: 14,
  },
  buscaInput: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 15,
    color: '#333333',
    paddingVertical: 10,
  },
  dicaBusca: {
    fontFamily: typography.regular,
    fontSize: 12,
    color: '#5A5A5A',
    marginBottom: 10,
  },
  vazio: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  vazioTitulo: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: colors.primaryDark,
  },
  vazioTexto: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: '#5A5A5A',
    textAlign: 'center',
  },
  vazioBotao: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  vazioBotaoTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
  botaoNaoComeu: {
    marginBottom: 16,
  },
});