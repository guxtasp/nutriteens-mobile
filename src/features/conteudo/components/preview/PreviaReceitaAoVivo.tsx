// src/features/conteudo/components/preview/PreviaReceitaAoVivo.tsx
// Prévia AO VIVO da receita: a ficha como o adolescente vê (foto, tempo, porções, dificuldade,
// ingredientes, modo de preparo) e o passo a passo, com o que está na tela AGORA, sem salvar.
// Segue o visual de ReceitaDetalheSheet / GuiaPreparoReceitaSheet.
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useDebounced } from '../../hooks/useDebounced';
import { QuadroCelular } from './QuadroCelular';
import { ordenarIngredientes, urlValida, type ReceitaEmEdicao } from '../../utils/receitaEdicao';

const AVISO = 'AO VIVO · mostra o que você está editando. Nada é salvo.';
const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };

export default function PreviaReceitaAoVivo({ receita, altura = 640 }: { receita: ReceitaEmEdicao; altura?: number }) {
  const atual = useDebounced(receita, 250);
  const atualizando = atual !== receita;
  const [guia, setGuia] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);

  const passos = useMemo(() => atual.passos.filter((p) => p.titulo.trim() || p.descricao.trim()), [atual.passos]);
  const ingredientes = useMemo(() => ordenarIngredientes(atual.ingredientes.filter((i) => i.nome)), [atual.ingredientes]);
  // se os passos mudam enquanto o guia está aberto, não sai do intervalo
  useEffect(() => { if (passoAtual > Math.max(0, passos.length - 1)) setPassoAtual(Math.max(0, passos.length - 1)); }, [passos.length, passoAtual]);

  const tempo = Number(atual.tempo) || 0;
  const porcoes = Number(atual.porcoes) || 1;
  const fotoOk = urlValida(atual.fotoUrl);
  const passo = passos[passoAtual];

  return (
    <View style={styles.raiz}>
      <View style={styles.aoVivo}>
        <View style={[styles.ponto, atualizando && styles.pontoAtualizando]} />
        <AppText style={styles.aoVivoTexto}>{atualizando ? 'ATUALIZANDO…' : 'AO VIVO'}</AppText>
      </View>

      <QuadroCelular aviso={AVISO} altura={altura}>
        {guia ? (
          <View style={styles.tela}>
            <View style={styles.guiaTopo}>
              <Pressable onPress={() => setGuia(false)} accessibilityRole="button" accessibilityLabel="Voltar para a receita" hitSlop={8}>
                <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
              </Pressable>
              <AppText numberOfLines={1} style={styles.guiaTitulo}>{atual.titulo.trim() || 'Receita'}</AppText>
            </View>
            {passos.length === 0 ? (
              <View style={styles.vazio}>
                <AppText style={styles.vazioTitulo}>Nenhum passo ainda</AppText>
                <AppText style={styles.vazioTexto}>Adicione passos no editor: o guia aparece aqui, um passo por vez.</AppText>
              </View>
            ) : (
              <>
                <View style={styles.barra}>
                  <View style={[styles.barraCheia, { width: `${((passoAtual + 1) / passos.length) * 100}%` }]} />
                </View>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.guiaCorpo}>
                  <AppText style={styles.passoContagem}>Passo {passoAtual + 1} de {passos.length}</AppText>
                  {urlValida(passo.fotoUrl) && <Image source={{ uri: passo.fotoUrl.trim() }} style={styles.passoFoto} resizeMode="cover" />}
                  <AppText style={styles.passoTitulo}>{passo.titulo.trim() || 'Sem título'}</AppText>
                  <AppText style={styles.texto}>{passo.descricao.trim() || 'Sem descrição.'}</AppText>
                </ScrollView>
                <View style={styles.guiaBotoes}>
                  <Pressable disabled={passoAtual === 0} onPress={() => setPassoAtual((n) => n - 1)} style={[styles.botaoSec, passoAtual === 0 && { opacity: 0.4 }]} accessibilityRole="button">
                    <AppText style={styles.botaoSecTexto}>ANTERIOR</AppText>
                  </Pressable>
                  <Pressable onPress={() => (passoAtual >= passos.length - 1 ? setGuia(false) : setPassoAtual((n) => n + 1))} style={styles.botaoPri} accessibilityRole="button">
                    <AppText style={styles.botaoPriTexto}>{passoAtual >= passos.length - 1 ? 'CONCLUIR' : 'PRÓXIMO'}</AppText>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.tela}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.ficha} showsVerticalScrollIndicator={false}>
              {fotoOk ? (
                <Image source={{ uri: atual.fotoUrl.trim() }} style={styles.foto} resizeMode="cover" />
              ) : (
                <View style={[styles.foto, styles.fotoVazia]}><Ionicons name="restaurant-outline" size={32} color="#B8C4BE" /></View>
              )}
              <AppText style={styles.titulo}>{atual.titulo.trim() || 'Título da receita'}</AppText>
              <View style={styles.infoLinha}>
                {tempo > 0 && (
                  <View style={styles.infoChip}><Ionicons name="time-outline" size={14} color={colors.primaryDark} /><AppText style={styles.infoChipTexto}>{tempo} min</AppText></View>
                )}
                <View style={styles.infoChip}><Ionicons name="people-outline" size={14} color={colors.primaryDark} /><AppText style={styles.infoChipTexto}>{porcoes} porção(ões)</AppText></View>
                <View style={styles.infoChip}><Ionicons name="speedometer-outline" size={14} color={colors.primaryDark} /><AppText style={styles.infoChipTexto}>{ROTULO_DIFICULDADE[atual.dificuldade] ?? 'Fácil'}</AppText></View>
              </View>

              <Pressable style={styles.botaoGuia} onPress={() => { setPassoAtual(0); setGuia(true); }} accessibilityRole="button">
                <Ionicons name="list-outline" size={16} color={colors.primaryDark} />
                <AppText style={styles.botaoGuiaTexto}>Ver passo a passo{passos.length ? ` (${passos.length})` : ''}</AppText>
              </Pressable>

              {ingredientes.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <AppText style={styles.secao}>Ingredientes</AppText>
                  {ingredientes.map((i, k) => (
                    <AppText key={k} style={styles.texto}>• {i.quantidade.trim() ? `${i.quantidade.trim()} de ${i.nome.toLowerCase()}` : i.nome}</AppText>
                  ))}
                </View>
              )}
              <AppText style={styles.secao}>Modo de preparo</AppText>
              <AppText style={styles.texto}>{atual.modo.trim() || 'O resumo do modo de preparo aparece aqui.'}</AppText>
            </ScrollView>
          </View>
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
  tela: { flex: 1, backgroundColor: colors.white },
  ficha: { padding: 20, paddingBottom: 32 },
  foto: { width: '100%', height: 170, borderRadius: 16, marginBottom: 16, backgroundColor: '#F0F5F1' },
  fotoVazia: { alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, marginBottom: 12 },
  infoLinha: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F5F1', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  infoChipTexto: { fontFamily: typography.medium, fontSize: 12, color: colors.primaryDark },
  botaoGuia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: colors.primaryDark, borderRadius: 24, paddingVertical: 10, marginBottom: 20 },
  botaoGuiaTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  secao: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, marginBottom: 8 },
  texto: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', lineHeight: 22 },
  guiaTopo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  guiaTitulo: { flex: 1, fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  barra: { height: 6, marginHorizontal: 16, borderRadius: 3, backgroundColor: 'rgba(27, 67, 50, 0.12)', overflow: 'hidden' },
  barraCheia: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  guiaCorpo: { padding: 20, gap: 12 },
  passoContagem: { fontFamily: typography.semiBold, fontSize: 12, color: colors.primaryShadow },
  passoFoto: { width: '100%', height: 170, borderRadius: 16, backgroundColor: '#F0F5F1' },
  passoTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  guiaBotoes: { flexDirection: 'row', gap: 10, padding: 16 },
  botaoSec: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: colors.primaryDark, borderRadius: 24, paddingVertical: 12 },
  botaoSecTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  botaoPri: { flex: 1, alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 24, paddingVertical: 12 },
  botaoPriTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white, letterSpacing: 0.5 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 28 },
  vazioTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  vazioTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#6B7280', textAlign: 'center' },
});
