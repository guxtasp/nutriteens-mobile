// src/features/conteudo/screens/LicaoPreviewScreen.tsx
// Pré-visualização de uma lição, em duas abas:
//  - "Como o adolescente vê": roda a lição com os componentes reais do app (sem gabarito antes
//    de responder, sem salvar progresso nem XP);
//  - "Revisão (com gabarito)": visão editorial, com as respostas certas e alertas de problemas
//    objetivos (ex.: quiz sem resposta correta).
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { buscarLicaoParaRevisao, type LicaoParaRevisao } from '../services/conteudoService';
import { buscarLicaoEditavel, type LicaoEditavel } from '../services/edicaoService';
import { AbasPrevia, type AbaPrevia } from '../components/preview/AbasPrevia';
import LicaoUsoPreview from '../components/preview/LicaoUsoPreview';
import { descreverQuestao, problemasDaQuestao } from '../utils/descreverQuestao';

export default function LicaoPreviewScreen({ route }: any) {
  const licaoId: string = route.params.licaoId;
  const [licao, setLicao] = useState<LicaoParaRevisao | null>(null);
  const [uso, setUso] = useState<LicaoEditavel | null>(null);
  const [aba, setAba] = useState<AbaPrevia>(route.params.aba ?? 'uso');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    buscarLicaoParaRevisao(licaoId)
      .then(setLicao)
      .catch((e) => setErro(e?.message ?? 'Não foi possível carregar a lição.'));
    // a prévia de uso precisa de ids de opção, ícone e hábito: leitura direta (a equipe lê qualquer status)
    buscarLicaoEditavel(licaoId)
      .then(setUso)
      .catch((e) => setErro((atual) => atual ?? e?.message ?? 'Não foi possível carregar a lição.'));
  }, [licaoId]);

  if (erro) return <AppText style={styles.erro}>{erro}</AppText>;
  if (!licao) return <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 60 }} />;

  const totalProblemas = licao.questoes.reduce((s, q) => s + problemasDaQuestao(q).length, 0);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.conteudo}>
      <AppText style={styles.titulo}>{licao.titulo}</AppText>
      <AppText style={styles.meta}>
        {licao.tipo} · {licao.xpRecompensa} XP · {licao.questoes.length} passo(s)
      </AppText>

      <View style={{ marginTop: 14, marginBottom: 6 }}>
        <AbasPrevia aba={aba} onTrocar={setAba} />
      </View>

      {aba === 'uso' && (uso ? <LicaoUsoPreview licao={uso} /> : <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />)}

      {aba === 'revisao' && (
        <>

      {totalProblemas > 0 && (
        <AppText style={styles.alerta}>
          ⚠ {totalProblemas} problema(s) encontrado(s) nesta lição — veja os avisos em vermelho antes de aprovar.
        </AppText>
      )}

      {!!licao.texto && (
        <View style={styles.bloco}>
          <AppText style={styles.rotulo}>Texto da lição</AppText>
          <AppText style={styles.texto}>{licao.texto}</AppText>
        </View>
      )}

      {licao.questoes.map((q, i) => {
        const d = descreverQuestao(q);
        const problemas = problemasDaQuestao(q);
        return (
          <View key={q.id} style={[styles.bloco, problemas.length > 0 && styles.blocoProblema]}>
            <AppText style={styles.rotulo}>
              Passo {i + 1} · {d.rotuloFormato}
            </AppText>
            <AppText style={styles.enunciado}>{d.titulo}</AppText>
            {d.linhas.map((linha, j) => (
              <AppText key={j} style={styles.texto}>
                {linha}
              </AppText>
            ))}
            {problemas.map((p, j) => (
              <AppText key={`p${j}`} style={styles.problema}>
                ⚠ {p}
              </AppText>
            ))}
          </View>
        );
      })}

      {licao.questoes.length === 0 && !licao.texto && (
        <AppText style={styles.meta}>Esta lição não tem conteúdo cadastrado (ex.: lição de hábito rastreável).</AppText>
      )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  conteudo: { padding: 24, paddingBottom: 60 },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  meta: { fontFamily: typography.regular, fontSize: 12, color: '#8A8A8A', marginTop: 4 },
  erro: { fontFamily: typography.regular, fontSize: 13, color: colors.error, margin: 24 },
  alerta: { fontFamily: typography.semiBold, fontSize: 13, color: '#B3261E', backgroundColor: '#FDE3E1', borderRadius: 10, padding: 10, marginTop: 14 },
  bloco: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 12, padding: 12, marginTop: 12 },
  blocoProblema: { borderColor: '#B3261E' },
  rotulo: { fontFamily: typography.bold, fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', marginBottom: 4 },
  enunciado: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark, marginBottom: 6 },
  texto: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight, marginTop: 2 },
  problema: { fontFamily: typography.semiBold, fontSize: 12, color: '#B3261E', marginTop: 6 },
});
