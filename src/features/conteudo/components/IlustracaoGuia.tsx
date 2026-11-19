// src/features/conteudo/components/IlustracaoGuia.tsx
// Desenhos simples (só Views) que acompanham cada passo do guia "Como criar".
// A moldura segue a marca NutriTeens e o tema do painel (claro/escuro). As cores por categoria
// (azul/verde/laranja/roxo) aparecem SÓ onde representam os blocos do editor, para a pessoa
// reconhecer as mesmas peças quando for montar a lição.
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import { COR_CATEGORIA, type CategoriaBloco } from '../utils/blocos';
import type { IlustracaoGuia as Tipo } from '../utils/guiaCriacao';

const cor = (c: CategoriaBloco) => COR_CATEGORIA[c];

function Linha({ w = '100%', c, h = 10 }: { w?: number | `${number}%`; c?: string; h?: number }) {
  const { tema } = useTemaPainel();
  return <View style={{ width: w, height: h, borderRadius: h / 2, backgroundColor: c ?? tema.linhaSuave }} />;
}

function MiniBloco({ c, texto }: { c: CategoriaBloco; texto: string }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={[styles.miniBloco, { backgroundColor: cor(c).fundo, borderColor: cor(c).borda }]}>
      <View style={[styles.miniEncaixe, { backgroundColor: cor(c).fundo, borderColor: cor(c).borda }]} />
      <AppText numberOfLines={1} style={styles.miniBlocoTexto}>{texto}</AppText>
    </View>
  );
}

/** Ficha "ligada" usa a marca por padrão; `c` só para fichas que imitam os blocos do editor. */
function Ficha({ texto, ligada, c }: { texto: string; ligada?: boolean; c?: string }) {
  const styles = useEstilos(criarEstilos);
  const fundo = c ?? colors.primary;
  const textoLigado = c ? colors.white : colors.primaryDark;
  return (
    <View style={[styles.ficha, ligada && { backgroundColor: fundo, borderColor: fundo }]}>
      <AppText style={[styles.fichaTexto, ligada && { color: textoLigado }]}>{texto}</AppText>
    </View>
  );
}

function Seta() {
  const { tema } = useTemaPainel();
  return <Ionicons name="arrow-forward" size={18} color={tema.textoSuave} />;
}

export default function IlustracaoGuia({ tipo }: { tipo: Tipo }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.caixa} accessibilityRole="image" accessibilityLabel={`Ilustração do passo: ${tipo}`}>
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
              <Ionicons name="swap-vertical" size={16} color={tema.textoSuave} />
            </View>
          ))}
          <View style={[styles.moduloLinha, styles.tracejado]}>
            <Ionicons name="add" size={18} color={tema.destaqueTexto} />
            <AppText style={[styles.campoTexto, { color: tema.destaqueTexto }]}>ADICIONAR MÓDULO</AppText>
          </View>
        </View>
      )}

      {tipo === 'licoes' && (
        <View style={styles.coluna}>
          {[['book-outline', 'Ponto de Partida', 'Leitura'], ['help-circle-outline', 'Treino', 'Quiz'], ['water-outline', 'Prática Real', 'Prática real']].map(([ic, nome, tp]) => (
            <View key={nome} style={styles.moduloLinha}>
              <Ionicons name={ic as any} size={20} color={tema.destaqueTexto} />
              <AppText numberOfLines={1} style={[styles.campoTexto, { flex: 1 }]}>{nome}</AppText>
              <AppText style={styles.tipo}>{tp}</AppText>
            </View>
          ))}
          <View style={styles.linha}>
            <Ficha texto="+ LEITURA" ligada />
            <Ficha texto="+ QUIZ" ligada />
            <Ficha texto="+ PRÁTICA" ligada />
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
              <Linha w="70%" c={colors.primary} />
              <Linha w="95%" c={colors.trilhaNoBloqueadoFace} />
              <Linha w="80%" c={colors.trilhaNoBloqueadoFace} />
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
            <Ficha texto="Revisão" ligada c={tema.alertaTexto} />
            <Seta />
            <Ficha texto="Publicada" ligada />
          </View>
          <View style={styles.linha}>
            <View style={[styles.no, { backgroundColor: colors.primary }]}><Ionicons name="checkmark" size={18} color={colors.primaryDark} /></View>
            <Seta />
            <View style={[styles.no, { backgroundColor: tema.chipBorda }]}><Ionicons name="lock-closed" size={16} color={tema.textoSuave} /></View>
            <AppText style={styles.tipo}>a Trilha 2 abre quando a 1 termina</AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  caixa: { backgroundColor: t.superficieSuave, borderRadius: 16, borderWidth: t.borda, borderColor: t.cardBorda, padding: 16, minHeight: 168, justifyContent: 'center' },
  coluna: { gap: 8 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  linhaTopo: { flexDirection: 'row', gap: 12 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 11, color: t.textoSuave },
  campo: { borderWidth: t.borda, borderColor: t.campoBorda, backgroundColor: t.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  campoTexto: { fontFamily: typography.semiBold, fontSize: 13, color: t.texto },
  ficha: { borderWidth: t.borda, borderColor: t.chipBorda, backgroundColor: t.card, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  fichaTexto: { fontFamily: typography.bold, fontSize: 11, color: t.texto },
  moduloLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.card, borderWidth: t.borda, borderColor: t.cardBorda, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  tracejado: { borderStyle: 'dashed', backgroundColor: 'transparent', borderColor: t.destaqueTexto },
  moduloNumero: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  moduloNumeroTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  tipo: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave, flexShrink: 1 },
  miniBloco: { borderWidth: 2, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 4 },
  miniEncaixe: { position: 'absolute', top: -7, left: 14, width: 22, height: 7, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 2, borderBottomWidth: 0 },
  miniBlocoTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  paleta: { gap: 6, alignItems: 'center', backgroundColor: t.card, borderRadius: 12, borderWidth: t.borda, borderColor: t.cardBorda, padding: 8 },
  pecaPaleta: { width: 44, height: 26, borderRadius: 8, borderWidth: 2, borderBottomWidth: 4, alignItems: 'center', justifyContent: 'center' },
  pecaTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.white },
  celular: { width: 96, height: 138, borderRadius: 16, borderWidth: 3, borderColor: t.texto, backgroundColor: colors.white, padding: 8, gap: 8, alignItems: 'center' },
  celularTopo: { width: 28, height: 4, borderRadius: 2, backgroundColor: TEMAS_CELULAR.trilho },
  celularCartao: { width: '100%', gap: 6, backgroundColor: TEMAS_CELULAR.cartao, borderRadius: 10, padding: 8 },
  aoVivo: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  aoVivoTexto: { fontFamily: typography.bold, fontSize: 9, color: colors.primaryDark },
  no: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
}) as const;

// O "celular" do desenho imita o app do adolescente, que é sempre claro: não segue o tema do painel.
const TEMAS_CELULAR = { trilho: colors.trilhaNoBloqueadoBorda, cartao: colors.exercicioAcertoFundo };
