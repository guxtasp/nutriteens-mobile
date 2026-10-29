// src/features/conteudo/components/preview/PreviaReceitaAoVivo.tsx
// Prévia AO VIVO da receita: a ficha do adolescente (foto, título, tempo/porções/dificuldade,
// ingredientes, modo de preparo) e o passo a passo, com o que está na tela AGORA — criação ou
// alteração, sem salvar. A ficha real do app busca ingredientes e passos no banco por id; por isso
// esta é uma versão só de leitura que mantém o mesmo visual (se mudar a ficha do app, ajuste aqui).
// Selecionar um bloco de passo abre o passo a passo naquele passo.
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { ReceitaEmEdicao } from '../../utils/receitaEdicao';
import { paraFichaAoVivo } from '../../utils/blocosReceita';
import { useDebounced } from '../../hooks/useDebounced';
import { QuadroCelular } from './QuadroCelular';

const AVISO = 'AO VIVO · mostra o que você está editando. Nada é salvo e não gera XP.';

type Props = {
  estado: ReceitaEmEdicao;
  /** índice (0-based) do passo selecionado no editor, ou null */
  passoSelecionado: number | null;
  altura?: number;
};

export default function PreviaReceitaAoVivo({ estado, passoSelecionado, altura = 640 }: Props) {
  const atrasado = useDebounced(estado, 250);
  const atualizando = atrasado !== estado;
  const ficha = useMemo(() => paraFichaAoVivo(atrasado), [atrasado]);

  const [guia, setGuia] = useState(false);
  const [indice, setIndice] = useState(0);
  const [avisoSemPassos, setAvisoSemPassos] = useState(false);

  // selecionar um bloco de passo abre o passo a passo nele (como "clicar no bloco para executá-lo")
  useEffect(() => {
    if (passoSelecionado === null) return;
    setGuia(true);
    setIndice(passoSelecionado);
  }, [passoSelecionado]);

  const total = ficha.passos.length;
  const i = Math.max(0, Math.min(indice, Math.max(0, total - 1)));
  const passo = ficha.passos[i];

  function abrirGuia() {
    if (total === 0) return setAvisoSemPassos(true);
    setAvisoSemPassos(false);
    setIndice(passoSelecionado ?? 0);
    setGuia(true);
  }

  return (
    <View style={styles.raiz}>
      <View style={styles.aoVivo}>
        <View style={[styles.ponto, atualizando && styles.pontoAtualizando]} />
        <AppText style={styles.aoVivoTexto}>{atualizando ? 'ATUALIZANDO…' : 'AO VIVO'}</AppText>
      </View>

      <QuadroCelular aviso={AVISO} altura={altura}>
        {guia && total > 0 && passo ? (
          <View style={styles.guia}>
            <AppText numberOfLines={1} style={styles.guiaReceita}>{ficha.titulo}</AppText>
            <AppText style={styles.guiaRotulo}>PASSO {i + 1} DE {total}</AppText>
            {passo.fotoUrl ? (
              <Image source={{ uri: passo.fotoUrl }} style={styles.guiaFoto} resizeMode="cover" />
            ) : (
              <View style={styles.guiaNumero}><AppText style={styles.guiaNumeroTexto}>{i + 1}</AppText></View>
            )}
            <AppText style={[styles.guiaTitulo, passo.incompleto && styles.pendente]}>{passo.titulo}</AppText>
            <AppText style={[styles.guiaDescricao, passo.incompleto && styles.pendente]}>{passo.descricao}</AppText>

            <View style={styles.pontos}>
              {ficha.passos.map((_, k) => (
                <View key={k} style={[styles.pontoGuia, k === i && styles.pontoGuiaAtual]} />
              ))}
            </View>

            <View style={styles.guiaBotoes}>
              <Pressable disabled={i === 0} onPress={() => setIndice(i - 1)} accessibilityRole="button" style={[styles.guiaBotao, i === 0 && { opacity: 0.35 }]}>
                <AppText style={styles.guiaBotaoTexto}>VOLTAR</AppText>
              </Pressable>
              <Pressable onPress={() => (i === total - 1 ? setGuia(false) : setIndice(i + 1))} accessibilityRole="button" style={[styles.guiaBotao, styles.guiaBotaoCheio]}>
                <AppText style={[styles.guiaBotaoTexto, { color: colors.white }]}>{i === total - 1 ? 'PRONTO!' : 'PRÓXIMO'}</AppText>
              </Pressable>
            </View>
            <Pressable onPress={() => setGuia(false)} accessibilityRole="button" style={styles.fechar}>
              <AppText style={styles.fecharTexto}>Voltar para a receita</AppText>
            </Pressable>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.ficha} showsVerticalScrollIndicator={false}>
            {ficha.fotoUrl ? (
              <Image source={{ uri: ficha.fotoUrl }} style={styles.foto} resizeMode="cover" />
            ) : (
              <View style={[styles.foto, styles.fotoVazia]}>
                <Ionicons name="restaurant-outline" size={32} color="#B8C4BE" />
              </View>
            )}

            <AppText style={styles.titulo}>{ficha.titulo}</AppText>

            <View style={styles.infoLinha}>
              {ficha.tempoMin !== null && (
                <View style={styles.infoChip}>
                  <Ionicons name="time-outline" size={14} color={colors.primaryDark} />
                  <AppText style={styles.infoChipTexto}>{ficha.tempoMin} min</AppText>
                </View>
              )}
              <View style={styles.infoChip}>
                <Ionicons name="people-outline" size={14} color={colors.primaryDark} />
                <AppText style={styles.infoChipTexto}>{ficha.porcoes} porção(ões)</AppText>
              </View>
              <View style={styles.infoChip}>
                <Ionicons name="speedometer-outline" size={14} color={colors.primaryDark} />
                <AppText style={styles.infoChipTexto}>{ficha.dificuldade}</AppText>
              </View>
            </View>

            <Pressable style={styles.botaoGuia} onPress={abrirGuia} accessibilityRole="button">
              <Ionicons name="list-outline" size={16} color={colors.primaryDark} />
              <AppText style={styles.botaoGuiaTexto}>Ver passo a passo</AppText>
            </Pressable>
            {avisoSemPassos && <AppText style={styles.info}>Essa receita ainda não tem passo a passo cadastrado.</AppText>}

            {ficha.ingredientes.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <AppText style={styles.secao}>Ingredientes</AppText>
                {ficha.ingredientes.map((ing, k) => (
                  <AppText key={k} style={[styles.texto, ing.incompleto && styles.pendente]}>• {ing.texto}</AppText>
                ))}
              </View>
            )}

            <AppText style={styles.secao}>Modo de preparo</AppText>
            <AppText style={[styles.texto, !ficha.modo && styles.pendente]}>{ficha.modo || '(escreva o modo de preparo)'}</AppText>
          </ScrollView>
        )}
      </QuadroCelular>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 8, width: '100%', maxWidth: 400, alignSelf: 'center' },
  aoVivo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pontoAtualizando: { backgroundColor: '#FFAB19' },
  aoVivoTexto: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.6, color: colors.primaryDark },
  // ficha (mesmo visual da ReceitaDetalheSheet do app)
  ficha: { padding: 20, paddingBottom: 32 },
  foto: { width: '100%', height: 160, borderRadius: 16, marginBottom: 16, backgroundColor: '#F0F5F1' },
  fotoVazia: { alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, marginBottom: 12 },
  infoLinha: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F5F1', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  infoChipTexto: { fontFamily: typography.medium, fontSize: 12, color: colors.primaryDark },
  botaoGuia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.primaryDark, borderRadius: 24, paddingVertical: 10, marginBottom: 20 },
  botaoGuiaTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  info: { fontFamily: typography.regular, fontSize: 12, color: '#6B7280', marginTop: -12, marginBottom: 16 },
  secao: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, marginBottom: 8 },
  texto: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', lineHeight: 22 },
  pendente: { color: '#B07A00', fontStyle: 'italic' },
  // passo a passo
  guia: { flex: 1, alignItems: 'center', padding: 20, gap: 10 },
  guiaReceita: { fontFamily: typography.medium, fontSize: 12, color: '#6B7A72' },
  guiaRotulo: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.6, color: colors.primaryShadow },
  guiaFoto: { width: '100%', height: 150, borderRadius: 16, backgroundColor: '#F0F5F1' },
  guiaNumero: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  guiaNumeroTexto: { fontFamily: typography.bold, fontSize: 30, color: colors.primaryDark },
  guiaTitulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  guiaDescricao: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: '#5A6B63', textAlign: 'center' },
  pontos: { flexDirection: 'row', gap: 6, marginTop: 4 },
  pontoGuia: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D9E2E8' },
  pontoGuiaAtual: { width: 22, backgroundColor: colors.primary },
  guiaBotoes: { flexDirection: 'row', gap: 10, marginTop: 'auto' },
  guiaBotao: { flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  guiaBotaoCheio: { backgroundColor: colors.primaryDark },
  guiaBotaoTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  fechar: { minHeight: 36, justifyContent: 'center' },
  fecharTexto: { fontFamily: typography.semiBold, fontSize: 12, color: '#6B7A72', textDecorationLine: 'underline' },
});
