import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { BackButton } from '../../../shared/ui/BackButton';
import { AppButton } from '../../../shared/ui/AppButton';
import { AppText } from '../../../shared/ui/AppText';
import { BroxisMascot } from '../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../shared/ui/SpeechBubble';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { PERGUNTAS_EBIA, calcularPontuacaoEbia, classificarEbia } from '../data/ebiaData';

const OPCOES = [
  { label: 'Sim', value: true },
  { label: 'Não', value: false },
];

// Tela genérica reaproveitada para as 5 perguntas da EBIA adaptada.
// Recebe `indice` via navigation params e vai empilhando as respostas
// (passadas adiante nos params) até a última pergunta, quando calcula e
// salva o resultado.
export default function TriagemPerguntaScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const indice: number = route.params?.indice ?? 0;
  const respostasAnteriores: boolean[] = route.params?.respostas ?? [];

  const [selecionado, setSelecionado] = useState<boolean | null>(null);
  const [salvando, setSalvando] = useState(false);

  const pergunta = PERGUNTAS_EBIA[indice];
  const ehUltima = indice === PERGUNTAS_EBIA.length - 1;

  async function handleContinuar() {
    if (selecionado === null) return;

    const respostas = [...respostasAnteriores, selecionado];

    if (!ehUltima) {
      navigation.navigate('TriagemPergunta', { indice: indice + 1, respostas });
      return;
    }

    setSalvando(true);
    const pontuacao = calcularPontuacaoEbia(respostas);
    const classificacao = classificarEbia(pontuacao);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (userId) {
      // upsert incremental: assume que a linha "em aberto" já existe desde
      // o início da triagem, criada antes das perguntas (decisão anterior)
      await supabase
        .from('avaliacoes_ebia')
        .update({ pontuacao_total: pontuacao, classificacao })
        .eq('user_id', userId);

      await supabase.from('respostas_ebia').insert(
        respostas.map((resposta, i) => ({
          user_id: userId,
          pergunta_id: PERGUNTAS_EBIA[i].id,
          resposta,
        }))
      );
    }

    setSalvando(false);
    navigation.navigate('NutritionistGuidance', { classificacao });
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.header}>
        <BroxisMascot pose="pensando" entrance="fade" size={70} showParticles={false} />
        <SpeechBubble text={pergunta.texto} typewriter={false} style={styles.bubble} />
      </View>

      <AppText style={styles.hint}>Toque para selecionar</AppText>

      <View style={styles.opcoes}>
        {OPCOES.map((opcao) => {
          const ativo = selecionado === opcao.value;
          return (
            <Pressable
              key={opcao.label}
              onPress={() => setSelecionado(opcao.value)}
              style={[styles.opcaoBotao, ativo && styles.opcaoBotaoAtiva]}
            >
              <AppText style={[styles.opcaoTexto, ativo && styles.opcaoTextoAtivo]}>
                {opcao.label.toUpperCase()}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <AppButton
        label={salvando ? 'SALVANDO...' : ehUltima ? 'FINALIZAR' : 'CONTINUAR'}
        backgroundColor={selecionado !== null ? colors.primaryDark : '#B8B8B8'}
        textColor={colors.white}
        shadowColor="#123024"
        fullWidth
        disabled={selecionado === null || salvando}
        onPress={handleContinuar}
        style={styles.continueButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 32,
  },
  bubble: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 8,
  },
  hint: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 16,
  },
  opcoes: {
    gap: 16,
  },
  opcaoBotao: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  opcaoBotaoAtiva: {
    borderColor: colors.primaryDark,
  },
  opcaoTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: '#8A8A8A',
  },
  opcaoTextoAtivo: {
    color: colors.primaryDark,
  },
  continueButton: {
    marginTop: 'auto',
    marginBottom: 40,
  },
});