// src/features/adolescente/screens/LicaoDetalheScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BackButton } from '../../../../shared/ui/BackButton';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../../shared/hooks/useMessageBanner';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import {
  buscarDetalheLicao,
  concluirLicao,
  verificarHabitoRecente,
  DetalheLicao,
} from '../services/trilhaService';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'LicaoDetalhe'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'LicaoDetalhe'>;

export default function LicaoDetalheScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { message, type, showMessage, clearMessage } = useMessageBanner();

  const { licaoId, titulo, xpRecompensa } = route.params;

  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState<DetalheLicao | null>(null);
  const [concluindo, setConcluindo] = useState(false);

  // estado do quiz
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondeu, setRespondeu] = useState(false);

  // estado da atividade rastreável
  const [habitoConfirmado, setHabitoConfirmado] = useState(false);
  const [verificandoHabito, setVerificandoHabito] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resultado = await buscarDetalheLicao(licaoId);
      setDetalhe(resultado);

      if (resultado.tipo === 'atividade_rastreavel' && userId && resultado.tipoHabito) {
        setVerificandoHabito(true);
        const ok = await verificarHabitoRecente(userId, resultado.tipoHabito, resultado.janelaHoras ?? 24);
        setHabitoConfirmado(ok);
        setVerificandoHabito(false);
      }
    } catch (erro) {
      console.error('Erro ao carregar lição:', erro);
      showMessage('Não foi possível carregar essa lição agora.', 'error');
    } finally {
      setCarregando(false);
    }
  }, [licaoId, userId, showMessage]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleConcluir() {
    if (!userId) return;
    setConcluindo(true);
    try {
      await concluirLicao(userId, licaoId, xpRecompensa);
      navigation.goBack();
    } catch (erro) {
      console.error('Erro ao concluir lição:', erro);
      showMessage('Não foi possível salvar sua conclusão. Tenta de novo.', 'error');
    } finally {
      setConcluindo(false);
    }
  }

  function handleResponderQuiz() {
    setRespondeu(true);
  }

  const questao = detalhe?.questoes[0];
  const opcaoCorreta = questao?.opcoes.find((o) => o.correta);
  const acertou = respondeu && respostaSelecionada === opcaoCorreta?.id;

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>{titulo}</AppText>
          <AppText style={styles.subtitulo}>+{xpRecompensa} XP ao concluir</AppText>
        </View>
      </View>

      <MessageBanner message={message} type={type} onClose={clearMessage} />

      {carregando || !detalhe ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.corpo}>
          {detalhe.tipo === 'conteudo' && (
            <>
              <AppText style={styles.texto}>{detalhe.texto ?? 'Essa lição ainda não tem conteúdo cadastrado.'}</AppText>
              <View style={styles.rodape}>
                <AppButton
                  label={concluindo ? 'Salvando...' : 'Concluir lição'}
                  onPress={handleConcluir}
                  disabled={concluindo}
                />
              </View>
            </>
          )}

          {detalhe.tipo === 'quiz' && (
            <>
              {!questao ? (
                <AppText style={styles.texto}>Esse quiz ainda não tem perguntas cadastradas.</AppText>
              ) : (
                <>
                  <AppText style={styles.enunciado}>{questao.enunciado}</AppText>

                  {questao.opcoes.map((opcao) => {
                    const selecionada = respostaSelecionada === opcao.id;
                    const mostrarCerta = respondeu && opcao.correta;
                    const mostrarErrada = respondeu && selecionada && !opcao.correta;

                    return (
                      <Pressable
                        key={opcao.id}
                        disabled={respondeu}
                        onPress={() => setRespostaSelecionada(opcao.id)}
                        style={[
                          styles.opcao,
                          selecionada && !respondeu && styles.opcaoSelecionada,
                          mostrarCerta && styles.opcaoCerta,
                          mostrarErrada && styles.opcaoErrada,
                        ]}
                      >
                        <AppText style={styles.opcaoTexto}>{opcao.texto}</AppText>
                        {mostrarCerta && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
                        {mostrarErrada && <Ionicons name="close-circle" size={20} color={colors.error} />}
                      </Pressable>
                    );
                  })}

                  <View style={styles.rodape}>
                    {!respondeu ? (
                      <AppButton
                        label="Responder"
                        onPress={handleResponderQuiz}
                        disabled={!respostaSelecionada}
                      />
                    ) : (
                      <>
                        <AppText style={[styles.feedback, { color: acertou ? colors.success : colors.error }]}>
                          {acertou ? 'Isso aí! Resposta certa.' : 'Não foi dessa vez — veja a resposta certa acima.'}
                        </AppText>
                        <AppButton
                          label={concluindo ? 'Salvando...' : 'Concluir lição'}
                          onPress={handleConcluir}
                          disabled={concluindo}
                        />
                      </>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {detalhe.tipo === 'atividade_rastreavel' && (
            <>
              {verificandoHabito ? (
                <View style={styles.centro}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : habitoConfirmado ? (
                <>
                  <View style={styles.iconeCentro}>
                    <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                  </View>
                  <AppText style={styles.texto}>
                    Encontramos um registro seu nas últimas {detalhe.janelaHoras ?? 24}h. Pode concluir a lição!
                  </AppText>
                  <View style={styles.rodape}>
                    <AppButton
                      label={concluindo ? 'Salvando...' : 'Concluir lição'}
                      onPress={handleConcluir}
                      disabled={concluindo}
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.iconeCentro}>
                    <Ionicons name="walk-outline" size={48} color={colors.primary} />
                  </View>
                  <AppText style={styles.texto}>
                    Ainda não encontramos um registro de atividade física nas últimas {detalhe.janelaHoras ?? 24}h.
                    Registre sua atividade e volte aqui pra concluir a lição.
                  </AppText>
                  <View style={styles.rodape}>
                    <AppButton
                      label="Registrar atividade física"
                      onPress={() => navigation.navigate('AtividadeFisica')}
                    />
                    <Pressable style={styles.botaoAtualizar} onPress={carregar}>
                      <AppText style={styles.textoAtualizar}>Já registrei, verificar de novo</AppText>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  tituloBloco: { flex: 1 },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 18,
    color: colors.primaryDark,
  },
  subtitulo: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.primary,
    marginTop: 2,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  corpo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  texto: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textOnLight,
  },
  enunciado: {
    fontFamily: typography.semiBold,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textOnLight,
    marginBottom: 16,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8DD',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  opcaoSelecionada: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 207, 74, 0.08)',
  },
  opcaoCerta: {
    borderColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  opcaoErrada: {
    borderColor: colors.error,
    backgroundColor: 'rgba(192, 57, 43, 0.08)',
  },
  opcaoTexto: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.textOnLight,
    marginRight: 8,
  },
  feedback: {
    fontFamily: typography.semiBold,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 14,
  },
  rodape: {
    marginTop: 24,
    gap: 12,
  },
  iconeCentro: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  botaoAtualizar: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  textoAtualizar: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
});