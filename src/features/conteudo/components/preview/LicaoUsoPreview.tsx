// src/features/conteudo/components/preview/LicaoUsoPreview.tsx
// Prévia de USO de uma lição: roda com os componentes reais do app do adolescente
// (ExercicioQuizContainer, que é puro: não grava progresso nem XP). Não mostra o gabarito
// antes de responder; o feedback aparece só depois, como para o adolescente.
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import ExercicioQuizContainer from '../../../adolescente/trilha/components/exercicios/ExercicioQuizContainer';
import { configPraticaReal } from '../../../adolescente/trilha/utils/praticaReal';
import type { QuestaoQuiz } from '../../../adolescente/trilha/services/trilhaService';
import type { LicaoEditavel } from '../../services/edicaoService';
import { paraQuestoesDoApp, usaSessaoDePassos } from '../../utils/previa';
import { QuadroCelular } from './QuadroCelular';

export default function LicaoUsoPreview({ licao, aviso, altura }: { licao: LicaoEditavel; aviso?: string; altura?: number }) {
  const questoes = useMemo(() => paraQuestoesDoApp(licao.questoes) as unknown as QuestaoQuiz[], [licao]);
  const [rodada, setRodada] = useState(0);
  const [fim, setFim] = useState<{ acertos: number; total: number } | null>(null);
  const sessao = usaSessaoDePassos(licao.tipo, questoes.length);
  const texto = typeof licao.conteudo?.texto === 'string' ? licao.conteudo.texto : '';
  const pratica = configPraticaReal(licao.tipoHabito);

  function reiniciar() {
    setFim(null);
    setRodada((r) => r + 1);
  }

  return (
    <QuadroCelular aviso={aviso} altura={altura}>
      {sessao && !fim && <ExercicioQuizContainer key={rodada} questoes={questoes} onConcluirTodas={(acertos, total) => setFim({ acertos, total })} />}

      {sessao && !!fim && (
        <View style={styles.centro}>
          <Ionicons name="gift" size={48} color={colors.primary} />
          <AppText style={styles.titulo}>Fim da prévia</AppText>
          <AppText style={styles.texto}>
            {fim.total > 0 ? `${fim.acertos} de ${fim.total} acerto(s) na primeira tentativa.` : 'Esta lição não tem passos pontuados.'}
          </AppText>
          <AppText style={styles.suave}>No aplicativo, aqui o adolescente ganharia {licao.xp} XP.</AppText>
          <AppButton label="VER DE NOVO" fullWidth onPress={reiniciar} />
        </View>
      )}

      {!sessao && licao.tipo === 'conteudo' && (
        <ScrollView contentContainerStyle={styles.corpo}>
          <AppText style={styles.titulo}>{licao.titulo}</AppText>
          <AppText style={styles.suave}>+{licao.xp} XP ao concluir</AppText>
          <AppText style={styles.texto}>{texto || 'Essa lição ainda não tem conteúdo cadastrado.'}</AppText>
          <AppButton label="Concluir lição" disabled onPress={() => {}} />
        </ScrollView>
      )}

      {!sessao && licao.tipo === 'atividade_rastreavel' && (
        <ScrollView contentContainerStyle={styles.corpo}>
          <AppText style={styles.titulo}>{licao.titulo}</AppText>
          <AppText style={styles.suave}>+{licao.xp} XP ao concluir</AppText>
          <View style={styles.centro}>
            <Ionicons name={pratica.icone} size={48} color={colors.primary} />
          </View>
          {!!texto && <AppText style={styles.texto}>{texto}</AppText>}
          <AppText style={styles.texto}>
            Ainda não encontramos um registro de {pratica.registroDe} nas últimas {licao.janelaHoras ?? 24}h. Registre sua atividade e volte aqui pra concluir a lição.
          </AppText>
          <AppButton label={pratica.botao} disabled onPress={() => {}} />
          <AppText style={styles.suave}>Na prévia os botões ficam desativados.</AppText>
        </ScrollView>
      )}
    </QuadroCelular>
  );
}

const styles = StyleSheet.create({
  corpo: { padding: 24, gap: 14 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  titulo: { fontFamily: typography.bold, fontSize: 22, color: colors.primaryDark },
  texto: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.textOnLight },
  suave: { fontFamily: typography.regular, fontSize: 12, color: '#8A8A8A', textAlign: 'center' },
});