// src/features/adolescente/screens/LicaoDetalheScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
import { layout } from '../../../../shared/theme/layout';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import {
  buscarDetalheLicao,
  concluirLicaoComProgresso,
  verificarHabitoRecente,
  DetalheLicao,
  NivelConclusao,
} from '../services/trilhaService';
import ExercicioQuizContainer from '../components/exercicios/ExercicioQuizContainer';
import { configPraticaReal } from '../utils/praticaReal';
import { registrarEvento } from '../../../../shared/analytics/analytics';

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
  const concluindoRef = useRef(false);
  const carregouRef = useRef(false);
  const concluidaRef = useRef(false);

  // estado da atividade rastreável
  const [habitoConfirmado, setHabitoConfirmado] = useState(false);
  const [verificandoHabito, setVerificandoHabito] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resultado = await buscarDetalheLicao(licaoId);
      setDetalhe(resultado);
      carregouRef.current = true;

      if (resultado.tipo === 'atividade_rastreavel' && userId && resultado.tipoHabito) {
        setVerificandoHabito(true);
        try {
          const ok = await verificarHabitoRecente(userId, resultado.tipoHabito, resultado.janelaHoras ?? 24);
          setHabitoConfirmado(ok);
        } finally {
          // sem isso, um erro na checagem deixaria o spinner girando pra sempre
          setVerificandoHabito(false);
        }
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

  // saiu da lição já carregada sem concluir => abandono
  useEffect(
    () => () => {
      if (carregouRef.current && !concluidaRef.current) {
        registrarEvento('conteudo_abandonado', { tipo: 'licao', licao_id: licaoId });
      }
    },
    [licaoId]
  );

  // Ao voltar da tela de registro (água, atividade, refeição), confere de novo
  // sozinho — antes só atualizava se a pessoa tocasse em "verificar de novo".
  useFocusEffect(
    useCallback(() => {
      if (!detalhe || detalhe.tipo !== 'atividade_rastreavel') return;
      if (!userId || !detalhe.tipoHabito || habitoConfirmado) return;

      let ativo = true;
      verificarHabitoRecente(userId, detalhe.tipoHabito, detalhe.janelaHoras ?? 24)
        .then((ok) => {
          if (ativo && ok) setHabitoConfirmado(true);
        })
        .catch((erro) => console.warn('Falha ao reverificar hábito:', erro));

      return () => {
        ativo = false;
      };
    }, [detalhe, userId, habitoConfirmado]),
  );

  /**
   * Ponto único de conclusão pra qualquer tipo de lição (conteúdo,
   * atividade rastreável ou quiz — o quiz chega aqui via
   * `handleConcluirQuiz`, que só repassa acertos/total). Decide a
   * navegação a partir do `nivel` devolvido pelo service: uma lição comum
   * vai pra `LicaoCompleta`, mas se essa era a última lição pendente do
   * módulo e/ou da trilha inteira, pula direto pra `ModuloCompleta` ou
   * `TrilhaCompleta` — não empilha as três telas em sequência.
   */
  async function concluirComNavegacao(acertos: number | null, total: number | null) {
    if (!userId) return;
    // `setConcluindo` só vale no próximo render; a trava abaixo é síncrona e
    // impede que um duplo toque dispare duas conclusões
    if (concluindoRef.current) return;
    concluindoRef.current = true;
    setConcluindo(true);
    try {
      const resultado = await concluirLicaoComProgresso(userId, licaoId, xpRecompensa, acertos, total);
      concluidaRef.current = true;
      navegarParaConclusao(resultado.nivel, resultado.xpGanhoLicao + resultado.xpGanhoBonus, resultado.acertosPercentual);
    } catch (erro) {
      console.error('Erro ao concluir lição:', erro);
      showMessage('Não foi possível salvar sua conclusão. Tenta de novo.', 'error');
    } finally {
      concluindoRef.current = false;
      setConcluindo(false);
    }
  }

  function navegarParaConclusao(nivel: NivelConclusao, xpGanho: number, acertosPercentual: number | null) {
    if (nivel === 'trilha') {
      navigation.replace('TrilhaCompleta', { xpGanho, acertosPercentual: acertosPercentual ?? 0 });
    } else if (nivel === 'modulo') {
      navigation.replace('ModuloCompleta', { xpGanho, acertosPercentual: acertosPercentual ?? 0 });
    } else {
      navigation.replace('LicaoCompleta', { xpGanho });
    }
  }

  async function handleConcluir() {
    await concluirComNavegacao(null, null);
  }

  // usado só pelo branch de quiz (ExercicioQuizContainer chama isso depois
  // da última questão) — repassa acertos/total pra virar o % de ACERTOS
  // mostrado na tela de Módulo/Trilha completa (a de Lição não mostra).
  async function handleConcluirQuiz(acertos: number, total: number) {
    await concluirComNavegacao(acertos, total);
  }

  // quiz, ou lição de conteúdo que virou sessão de passos (tem questões
  // cadastradas): ambos rodam no mesmo container de exercícios
  const usaSessao = detalhe?.tipo === 'quiz' || (detalhe?.tipo === 'conteudo' && detalhe.questoes.length > 0);
  const pratica = configPraticaReal(detalhe?.tipoHabito ?? null);

  return (
    // nas sessões só o topo respeita a área segura: o painel de feedback precisa
    // chegar até a borda de baixo da tela
    <SafeAreaView style={styles.tela} edges={usaSessao ? ['top'] : undefined}>
      <View style={[styles.cabecalho, usaSessao && styles.cabecalhoQuiz]}>
        <BackButton onPress={() => navigation.goBack()} />
        {!usaSessao && (
          <View style={styles.tituloBloco}>
            <AppText style={styles.titulo}>{titulo}</AppText>
            <AppText style={styles.subtitulo}>+{xpRecompensa} XP ao concluir</AppText>
          </View>
        )}
      </View>

      <MessageBanner message={message} type={type} onClose={clearMessage} style={styles.avisoSobreposto} />

      {carregando || !detalhe ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : usaSessao ? (
        <ExercicioQuizContainer questoes={detalhe.questoes} onConcluirTodas={handleConcluirQuiz} />
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
                    <Ionicons name={pratica.icone} size={48} color={colors.primary} />
                  </View>
                  <AppText style={styles.texto}>
                    Ainda não encontramos um registro de {pratica.registroDe} nas últimas {detalhe.janelaHoras ?? 24}h.
                    Registre sua atividade e volte aqui pra concluir a lição.
                  </AppText>
                  <View style={styles.rodape}>
                    <AppButton
                      label={pratica.botao}
                      onPress={() => navigation.navigate(pratica.rota)}
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
    paddingHorizontal: layout.margemFluxoH,
    paddingTop: 20,
    paddingBottom: 12,
    gap: 12,
  },
  cabecalhoQuiz: { paddingBottom: 16 },
  // o aviso aparece por cima do conteúdo, sem reservar espaço em branco no topo
  avisoSobreposto: { minHeight: 0, height: 0, marginTop: 0, marginHorizontal: layout.margemFluxoH, zIndex: 20 },
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
    paddingHorizontal: layout.margemFluxoH,
    paddingBottom: 40,
  },
  texto: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textOnLight,
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