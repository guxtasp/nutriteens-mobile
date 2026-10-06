// src/features/conteudo/screens/TrilhaRevisaoScreen.tsx
// Detalhe de uma trilha: módulos/lições, histórico de revisões e ações.
// Nutricionista aprova/devolve; admin só acompanha (e vê o motivo da devolução).
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import {
  aprovarTrilha,
  buscarTrilhaParaRevisao,
  devolverTrilha,
  obterPapelAtual,
  type TrilhaParaRevisao,
} from '../services/conteudoService';
import {
  labelPapel,
  podeAprovar,
  resumoTamanho,
  seloDaTrilha,
  validarComentarioDevolucao,
  type Papel,
} from '../utils/regrasAprovacao';

type Modo = 'nenhum' | 'aprovando' | 'devolvendo';

const ROTULO_TIPO: Record<string, string> = { conteudo: 'Conteúdo', quiz: 'Quiz', atividade_rastreavel: 'Hábito' };

function formatarData(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function TrilhaRevisaoScreen({ route, navigation }: any) {
  const trilhaId: string = route.params.trilhaId;
  const [dados, setDados] = useState<TrilhaParaRevisao | null>(null);
  const [papel, setPapel] = useState<Papel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>('nenhum');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [d, p] = await Promise.all([buscarTrilhaParaRevisao(trilhaId), obterPapelAtual()]);
      setDados(d);
      setPapel(p);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar a trilha.');
    } finally {
      setCarregando(false);
    }
  }, [trilhaId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  async function confirmarAprovacao() {
    setEnviando(true);
    setErro(null);
    try {
      await aprovarTrilha(trilhaId, comentario);
      setAviso('Trilha aprovada e publicada para os adolescentes.');
      setModo('nenhum');
      setComentario('');
      await carregar();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível aprovar.');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarDevolucao() {
    const problema = validarComentarioDevolucao(comentario);
    if (problema) {
      setErro(problema);
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await devolverTrilha(trilhaId, comentario);
      setAviso('Trilha devolvida com o seu comentário.');
      setModo('nenhum');
      setComentario('');
      await carregar();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível devolver.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) return <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 60 }} />;
  if (!dados) return <AppText style={styles.erro}>{erro ?? 'Trilha não encontrada.'}</AppText>;

  const { trilha, modulos, revisoes } = dados;
  const selo = seloDaTrilha(trilha.status, trilha.ultimaDecisao);
  const aprovada = trilha.status === 'aprovada';
  const nutri = podeAprovar(papel);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.conteudo}>
      <AppText style={styles.titulo}>{trilha.titulo}</AppText>
      {!!trilha.descricao && <AppText style={styles.descricao}>{trilha.descricao}</AppText>}
      <AppText style={styles.meta}>
        {selo.texto} · {trilha.tema} · {resumoTamanho(trilha.totalModulos, trilha.totalLicoes)}
      </AppText>
      <AppText style={styles.meta}>
        Autor: {trilha.autorNome ?? '—'} ({labelPapel(trilha.autorPapel)}) · atualizada em {formatarData(trilha.atualizadoEm)}
      </AppText>

      {!!aviso && <AppText style={styles.aviso}>{aviso}</AppText>}
      {!!erro && <AppText style={styles.erro}>{erro}</AppText>}

      <AppText style={styles.secao}>Módulos e lições</AppText>
      {modulos.map((m) => (
        <View key={m.id} style={styles.modulo}>
          <AppText style={styles.moduloTitulo}>
            Módulo {m.ordem} — {m.titulo}
          </AppText>
          {m.licoes.map((l) => (
            <Pressable key={l.id} style={styles.licao} onPress={() => navigation.navigate('LicaoPreview', { licaoId: l.id })}>
              <AppText style={styles.licaoTitulo}>
                {l.ordem}. {l.titulo}
              </AppText>
              <AppText style={styles.licaoMeta}>
                {ROTULO_TIPO[l.tipo] ?? l.tipo} · {l.xpRecompensa} XP  ›
              </AppText>
            </Pressable>
          ))}
        </View>
      ))}

      <AppText style={styles.secao}>Histórico de revisões</AppText>
      {revisoes.length === 0 ? (
        <AppText style={styles.meta}>Ainda não foi revisada.</AppText>
      ) : (
        revisoes.map((r) => (
          <View key={r.id} style={styles.revisao}>
            <AppText style={[styles.revisaoTopo, { color: r.decisao === 'APROVADA' ? '#2F6B12' : '#B3261E' }]}>
              {r.decisao === 'APROVADA' ? 'Aprovada' : 'Devolvida'} por {r.revisorNome ?? '—'} · {formatarData(r.criadoEm)}
            </AppText>
            {!!r.comentario && <AppText style={styles.revisaoTexto}>{r.comentario}</AppText>}
          </View>
        ))
      )}

      {nutri ? (
        <View style={styles.acoes}>
          {modo === 'nenhum' && (
            <>
              {!aprovada && (
                <AppButton label="APROVAR E PUBLICAR" backgroundColor={colors.primaryDark} textColor={colors.white} shadowColor="#123024" onPress={() => setModo('aprovando')} />
              )}
              <AppButton
                label={aprovada ? 'DESPUBLICAR (VOLTAR PARA REVISÃO)' : 'DEVOLVER COM COMENTÁRIO'}
                backgroundColor={colors.white}
                textColor={colors.error}
                outlineColor={colors.error}
                onPress={() => setModo('devolvendo')}
              />
            </>
          )}

          {modo !== 'nenhum' && (
            <View style={styles.painel}>
              <AppText style={styles.painelTitulo}>
                {modo === 'aprovando' ? 'Confirmar aprovação? A trilha passa a aparecer para os adolescentes.' : 'O que precisa mudar? (obrigatório)'}
              </AppText>
              <TextInput
                style={styles.input}
                multiline
                value={comentario}
                onChangeText={setComentario}
                placeholder={modo === 'aprovando' ? 'Comentário (opcional)' : 'Ex.: o quiz da lição 3 tem 2 opções corretas…'}
                placeholderTextColor={colors.placeholder}
                maxLength={2000}
              />
              <AppButton
                label={enviando ? 'ENVIANDO…' : modo === 'aprovando' ? 'CONFIRMAR APROVAÇÃO' : 'CONFIRMAR DEVOLUÇÃO'}
                backgroundColor={colors.primaryDark}
                textColor={colors.white}
                shadowColor="#123024"
                disabled={enviando}
                onPress={modo === 'aprovando' ? confirmarAprovacao : confirmarDevolucao}
              />
              <AppButton
                label="CANCELAR"
                backgroundColor={colors.white}
                textColor={colors.primaryDark}
                outlineColor="#D9D9D9"
                disabled={enviando}
                onPress={() => {
                  setModo('nenhum');
                  setErro(null);
                }}
              />
            </View>
          )}
        </View>
      ) : (
        <AppText style={styles.nota}>
          Só a nutricionista aprova conteúdo. {aprovada ? 'Esta trilha já está publicada.' : 'Acompanhe aqui o resultado da revisão.'}
        </AppText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  conteudo: { padding: 24, paddingBottom: 60 },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  descricao: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight, marginTop: 6 },
  meta: { fontFamily: typography.regular, fontSize: 12, color: '#8A8A8A', marginTop: 4 },
  aviso: { fontFamily: typography.semiBold, fontSize: 13, color: '#2F6B12', backgroundColor: '#E2F3D3', borderRadius: 10, padding: 10, marginTop: 14 },
  erro: { fontFamily: typography.regular, fontSize: 13, color: colors.error, marginTop: 14 },
  secao: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, marginTop: 24, marginBottom: 8 },
  modulo: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 12, padding: 12, marginBottom: 10 },
  moduloTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginBottom: 6 },
  licao: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EFEFEF' },
  licaoTitulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.textOnLight },
  licaoMeta: { fontFamily: typography.regular, fontSize: 11, color: '#8A8A8A', marginTop: 2 },
  revisao: { borderLeftWidth: 3, borderLeftColor: '#D9D9D9', paddingLeft: 10, marginBottom: 10 },
  revisaoTopo: { fontFamily: typography.bold, fontSize: 12 },
  revisaoTexto: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight, marginTop: 3 },
  acoes: { marginTop: 28, gap: 12 },
  painel: { gap: 12 },
  painelTitulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark },
  input: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 12, padding: 12, minHeight: 90, textAlignVertical: 'top', fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight },
  nota: { fontFamily: typography.regular, fontSize: 12, color: '#8A8A8A', marginTop: 28 },
});
