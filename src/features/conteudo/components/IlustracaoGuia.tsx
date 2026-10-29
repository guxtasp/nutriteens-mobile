// src/features/conteudo/components/IlustracaoGuia.tsx
// Desenhos simples (só Views) que acompanham cada passo do guia "Como criar".
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { COR_CATEGORIA, type CategoriaBloco } from '../utils/blocos';
import type { IlustracaoGuia as Tipo } from '../utils/guiaCriacao';

const cor = (c: CategoriaBloco) => COR_CATEGORIA[c];

function Linha({ w = '100%', c = '#E3E8E5', h = 10 }: { w?: number | `${number}%`; c?: string; h?: number }) {
  return <View style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: c }} />;
}

function MiniBloco({ c, texto, largura }: { c: CategoriaBloco; texto: string; largura?: number }) {
  return (
    <View style={[styles.miniBloco, { backgroundColor: cor(c).fundo, borderColor: cor(c).borda, width: largura }]}>
      <View style={[styles.miniEncaixe, { backgroundColor: cor(c).fundo, borderColor: cor(c).borda }]} />
      <AppText numberOfLines={1} style={styles.miniBlocoTexto}>{texto}</AppText>
    </View>
  );
}

function Ficha({ texto, ligada, c = '#4C97FF' }: { texto: string; ligada?: boolean; c?: string }) {
  return (
    <View style={[styles.ficha, ligada && { backgroundColor: c, borderColor: c }]}>
      <AppText style={[styles.fichaTexto, ligada && { color: colors.white }]}>{texto}</AppText>
    </View>
  );
}

function Seta() {
  return <Ionicons name="arrow-forward" size={18} color="#8A978F" />;
}

export default function IlustracaoGuia({ tipo }: { tipo: Tipo }) {
  return (
    <View style={styles.caixa} accessibilityRole="image" accessibilityLabel={`Ilustração: ${tipo}`}>
      {tipo === 'trilha' && (
        <View style={styles.coluna}>
          <AppText style={styles.rotulo}>Título</AppText>
          <View style={styles.campo}><AppText style={styles.campoTexto}>Hidratação e Bebidas</AppText></View>
          <AppText style={styles.rotulo}>Tema</AppText>
          <View style={styles.linha}>
            <Ficha texto="alimentação" />
            <Ficha texto="hidratação" ligada />
            <Ficha texto="atividade" />
          </View>
          <AppText style={styles.rotulo}>Ordem</AppText>
          <View style={[styles.campo, { width: 56 }]}><AppText style={styles.campoTexto}>2</AppText></View>
        </View>
      )}

      {tipo === 'modulos' && (
        <View style={styles.coluna}>
          {['Por que beber água', 'Escolhendo o que beber'].map((n, i) => (
            <View key={n} style={styles.moduloLinha}>
              <View style={styles.moduloNumero}><AppText style={styles.moduloNumeroTexto}>{i + 1}</AppText></View>
              <AppText numberOfLines={1} style={[styles.campoTexto, { flex: 1 }]}>{n}</AppText>
              <AppText style={styles.setas}>↑ ↓</AppText>
            </View>
          ))}
          <View style={[styles.moduloLinha, styles.tracejado]}>
            <Ionicons name="add" size={18} color={cor('pergunta').borda} />
            <AppText style={[styles.campoTexto, { color: cor('pergunta').borda }]}>ADICIONAR MÓDULO</AppText>
          </View>
        </View>
      )}

      {tipo === 'licoes' && (
        <View style={styles.coluna}>
          {[['book-outline', 'Ponto de Partida', 'Leitura'], ['help-circle-outline', 'Treino', 'Quiz'], ['water-outline', 'Prática Real', 'Prática real']].map(([ic, nome, tp]) => (
            <View key={nome} style={styles.moduloLinha}>
              <Ionicons name={ic as any} size={20} color={colors.primaryDark} />
              <AppText numberOfLines={1} style={[styles.campoTexto, { flex: 1 }]}>{nome}</AppText>
              <AppText style={styles.tipo}>{tp}</AppText>
            </View>
          ))}
          <View style={styles.linha}>
            <Ficha texto="+ LEITURA" ligada c={cor('conteudo').fundo} />
            <Ficha texto="+ QUIZ" ligada c={cor('pergunta').fundo} />
            <Ficha texto="+ PRÁTICA" ligada c={cor('semNota').fundo} />
          </View>
        </View>
      )}

      {tipo === 'blocos' && (
        <View style={styles.linhaTopo}>
          <View style={[styles.coluna, { flex: 1 }]}>
            <MiniBloco c="conteudo" texto="1 · Cartão" />
            <MiniBloco c="pergunta" texto="2 · Múltipla escolha" />
            <MiniBloco c="semNota" texto="3 · Enquete" />
            <MiniBloco c="jogo" texto="4 · Jogo da memória" />
          </View>
          <View style={styles.paleta}>
            <AppText style={styles.rotulo}>Blocos</AppText>
            {(['conteudo', 'pergunta', 'semNota', 'jogo'] as CategoriaBloco[]).map((c) => (
              <View key={c} style={[styles.pecaPaleta, { backgroundColor: cor(c).fundo, borderColor: cor(c).borda }]}>
                <AppText style={styles.pecaTexto}>+</AppText>
              </View>
            ))}
          </View>
        </View>
      )}

      {tipo === 'previa' && (
        <View style={[styles.linhaTopo, { alignItems: 'center' }]}>
          <View style={[styles.coluna, { flex: 1 }]}>
            <MiniBloco c="conteudo" texto="Beba água…" />
            <View style={[styles.campo, { borderColor: cor('conteudo').fundo }]}>
              <AppText style={styles.campoTexto}>digitando|</AppText>
            </View>
          </View>
          <Seta />
          <View style={styles.celular}>
            <View style={styles.celularTopo} />
            <View style={styles.celularCartao}>
              <Linha w="70%" c={cor('conteudo').fundo} />
              <Linha w="95%" />
              <Linha w="80%" />
            </View>
            <View style={styles.aoVivo}><AppText style={styles.aoVivoTexto}>AO VIVO</AppText></View>
          </View>
        </View>
      )}

      {tipo === 'enviar' && (
        <View style={styles.coluna}>
          <View style={styles.linha}>
            <Ficha texto="Rascunho" />
            <Seta />
            <Ficha texto="Revisão" ligada c={cor('semNota').fundo} />
            <Seta />
            <Ficha texto="Publicada" ligada c={cor('pergunta').fundo} />
          </View>
          <View style={styles.linha}>
            <View style={[styles.no, { backgroundColor: cor('pergunta').fundo }]}><Ionicons name="checkmark" size={18} color={colors.white} /></View>
            <Seta />
            <View style={[styles.no, { backgroundColor: '#D7DCD9' }]}><Ionicons name="lock-closed" size={16} color="#8A978F" /></View>
            <AppText style={styles.tipo}>a Trilha 2 abre quando a 1 termina</AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { backgroundColor: '#F7FAF2', borderRadius: 18, borderWidth: 1.5, borderColor: '#CFE8B5', padding: 14, minHeight: 168, justifyContent: 'center' },
  coluna: { gap: 8 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  linhaTopo: { flexDirection: 'row', gap: 12 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 11, color: '#6B7A72' },
  campo: { borderWidth: 2, borderColor: '#D7DCD9', backgroundColor: colors.white, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  campoTexto: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark },
  ficha: { borderWidth: 2, borderColor: '#D7DCD9', backgroundColor: colors.white, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  fichaTexto: { fontFamily: typography.bold, fontSize: 11, color: colors.primaryDark },
  moduloLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 2, borderColor: '#D7DCD9', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  tracejado: { borderStyle: 'dashed', backgroundColor: 'transparent', borderColor: '#389438' },
  moduloNumero: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#59C059', alignItems: 'center', justifyContent: 'center' },
  moduloNumeroTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  setas: { fontFamily: typography.bold, fontSize: 13, color: '#8A978F' },
  tipo: { fontFamily: typography.regular, fontSize: 11, color: '#6B7A72', flexShrink: 1 },
  miniBloco: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 4 },
  miniEncaixe: { position: 'absolute', top: -7, left: 14, width: 22, height: 7, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 2, borderBottomWidth: 0 },
  miniBlocoTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  paleta: { gap: 6, alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, borderWidth: 2, borderColor: '#D7DCD9', padding: 8 },
  pecaPaleta: { width: 44, height: 26, borderRadius: 8, borderWidth: 2, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  pecaTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.white },
  celular: { width: 96, height: 138, borderRadius: 16, borderWidth: 3, borderColor: colors.primaryDark, backgroundColor: colors.white, padding: 8, gap: 8, alignItems: 'center' },
  celularTopo: { width: 28, height: 4, borderRadius: 2, backgroundColor: '#D7DCD9' },
  celularCartao: { width: '100%', gap: 6, backgroundColor: '#EAF2FF', borderRadius: 10, padding: 8 },
  aoVivo: { backgroundColor: '#59C059', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  aoVivoTexto: { fontFamily: typography.bold, fontSize: 9, color: colors.white },
  no: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
