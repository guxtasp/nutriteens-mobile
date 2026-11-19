// src/features/conteudo/components/GuiaCriacao.tsx
// Guia visual "Como criar", passo a passo, com a identidade NutriTeens: faixa verde da marca
// com o Broxis, barra de progresso, passos clicáveis, desenho do passo, o que fazer em ordem
// e a dica do passo. Dá para rever quando quiser (menu "Como criar" ou o botão nos editores).
// O texto dos passos vem de utils/guiaCriacao (não mudou).
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { BroxisMascot } from '../../../shared/ui/BroxisMascot';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { ALVO_TOQUE, fonte } from '../../../shared/painel/painelTheme';
import { useModoPainel } from '../../../shared/painel/hooks/useModoPainel';
import { PASSOS_GUIA, passoValido } from '../utils/guiaCriacao';
import IlustracaoGuia from './IlustracaoGuia';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

type Props = {
  passoInicial?: number;
  /** ações extras de cada passo (ex.: "Criar uma trilha agora") */
  acoes?: Partial<Record<string, { rotulo: string; onPress: () => void }>>;
};

export default function GuiaCriacao({ passoInicial = 0, acoes }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { modo } = useModoPainel();
  const celular = modo === 'celular';
  const [i, setI] = useState(passoValido(passoInicial));
  const passo = PASSOS_GUIA[i];
  const total = PASSOS_GUIA.length;
  const ultimo = i === total - 1;
  const acao = acoes?.[passo.id];
  const gradiente: [string, string] = tema.nome === 'escuro' ? [tema.superficieSuave, tema.card] : [tema.menuFundo, colors.primaryDark];

  return (
    <View style={styles.raiz}>
      {/* faixa da marca: Broxis + progresso */}
      <LinearGradient colors={gradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroTexto}>
          <AppText style={styles.heroRotulo}>GUIA DE CRIAÇÃO</AppText>
          <AppText style={styles.heroTitulo}>Da ideia à trilha publicada</AppText>
          <AppText style={styles.heroSub}>
            {total} passos para montar uma trilha que os adolescentes vão percorrer no app.
          </AppText>
          <View style={styles.progresso} accessibilityLabel={`Passo ${i + 1} de ${total}`}>
            <View style={[styles.progressoCheio, { width: `${((i + 1) / total) * 100}%` }]} />
          </View>
          <AppText style={styles.heroPasso}>Passo {i + 1} de {total}</AppText>
        </View>
        {!celular && (
          <View style={styles.mascote} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <BroxisMascot size={112} pose={ultimo ? 'supercontente' : 'apresentando'} entrance="fade" showParticles={false} />
          </View>
        )}
      </LinearGradient>

      {/* passos: toque para pular */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.passos} accessibilityRole="tablist">
        {PASSOS_GUIA.map((p, k) => {
          const atual = k === i;
          const feito = k < i;
          return (
            <Pressable
              key={p.id}
              onPress={() => setI(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: atual }}
              accessibilityLabel={`Passo ${k + 1}: ${p.titulo}${feito ? ', visto' : ''}`}
              style={[styles.passo, atual && styles.passoAtual]}
            >
              <View style={[styles.bolinha, feito && styles.bolinhaFeita, atual && styles.bolinhaAtual]}>
                {feito ? (
                  <Ionicons name="checkmark" size={14} color={colors.primaryDark} />
                ) : (
                  <AppText style={[styles.bolinhaTexto, atual && { color: colors.primaryDark }]}>{k + 1}</AppText>
                )}
              </View>
              {(!celular || atual) && (
                <AppText style={[styles.passoTexto, atual && styles.passoTextoAtual]} numberOfLines={1}>
                  {p.titulo}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.cartao}>
        <View style={styles.cabecalho}>
          <View style={styles.numeroGrande}>
            <AppText style={styles.numeroGrandeTexto}>{i + 1}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={styles.titulo} accessibilityRole="header">{passo.titulo}</AppText>
            <AppText style={styles.resumo}>{passo.resumo}</AppText>
          </View>
        </View>

        <View style={[styles.corpo, !celular && styles.corpoLado]}>
          <View style={!celular ? { flex: 1, minWidth: 0 } : undefined}>
            <IlustracaoGuia tipo={passo.ilustracao} />
          </View>

          <View style={[styles.lista, !celular && { flex: 1, minWidth: 0 }]}>
            <AppText style={styles.listaTitulo}>O que fazer</AppText>
            {passo.faca.map((f, k) => (
              <View key={k} style={styles.item}>
                <View style={styles.itemNumero}>
                  <AppText style={styles.itemNumeroTexto}>{k + 1}</AppText>
                </View>
                <AppText style={styles.itemTexto}>{f}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.dica}>
          <View style={styles.dicaIcone}>
            <Ionicons name="bulb" size={16} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.dicaTitulo}>Dica</AppText>
            <AppText style={styles.dicaTexto}>{passo.dica}</AppText>
          </View>
        </View>

        {!!acao && (
          <View style={{ flexDirection: 'row' }}>
            <AppButton label={acao.rotulo} fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botao} onPress={acao.onPress} />
          </View>
        )}
      </View>

      <View style={styles.navegacao}>
        <AppButton label="← ANTERIOR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={i === 0} style={styles.botao} onPress={() => setI((v) => passoValido(v - 1))} />
        {ultimo ? (
          <AppButton label="REVER DO INÍCIO" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botao} onPress={() => setI(0)} />
        ) : (
          <AppButton label="PRÓXIMO →" fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botao} onPress={() => setI((v) => passoValido(v + 1))} />
        )}
      </View>
    </View>
  );
}

/** Botão de atalho para o guia, em um dos passos (usado dentro dos editores). */
export function BotaoComoCriar({ passo = 0 }: { passo?: number }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('GuiaCriacao', { passo })}
      accessibilityRole="button"
      accessibilityLabel="Abrir o passo a passo de como criar"
      style={({ pressed }) => [styles.atalho, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name="school-outline" size={18} color={tema.destaqueTexto} />
      <AppText style={styles.atalhoTexto}>Como criar? Ver o passo a passo</AppText>
    </Pressable>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  raiz: { gap: 16, width: '100%', maxWidth: 960, alignSelf: 'center' },

  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: t.cardRaio, padding: 20, overflow: 'hidden' },
  heroTexto: { flex: 1, gap: 6 },
  heroRotulo: { fontFamily: typography.bold, fontSize: fonte.selo, letterSpacing: 1, color: colors.primary },
  heroTitulo: { fontFamily: typography.bold, fontSize: 22, color: colors.white },
  heroSub: { fontFamily: typography.regular, fontSize: fonte.apoio, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
  progresso: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden', marginTop: 8, maxWidth: 420 },
  progressoCheio: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  heroPasso: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: 'rgba(255,255,255,0.85)' },
  mascote: { width: 112, height: 112 },

  passos: { gap: 6, paddingVertical: 2 },
  passo: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: ALVO_TOQUE, paddingHorizontal: 10, borderRadius: 22, borderWidth: t.borda, borderColor: t.cardBorda, backgroundColor: t.card },
  passoAtual: { borderColor: t.destaqueTexto, backgroundColor: t.destaqueSuave },
  bolinha: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: t.chipBorda, alignItems: 'center', justifyContent: 'center' },
  bolinhaAtual: { backgroundColor: colors.primary, borderColor: colors.primary },
  bolinhaFeita: { backgroundColor: colors.primary, borderColor: colors.primary },
  bolinhaTexto: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.textoSuave },
  passoTexto: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoSuave, maxWidth: 170 },
  passoTextoAtual: { fontFamily: typography.bold, color: t.texto },

  cartao: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 20, gap: 18 },
  cabecalho: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  numeroGrande: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numeroGrandeTexto: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: t.texto },
  resumo: { fontFamily: typography.regular, fontSize: fonte.corpo + 1, lineHeight: 22, color: t.textoCorpo, marginTop: 4 },
  corpo: { gap: 18 },
  corpoLado: { flexDirection: 'row', alignItems: 'flex-start' },
  lista: { gap: 10 },
  listaTitulo: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.textoSuave, textTransform: 'uppercase', letterSpacing: 0.6 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemNumero: { width: 24, height: 24, borderRadius: 12, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  itemNumeroTexto: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.destaqueTexto },
  itemTexto: { flex: 1, fontFamily: typography.regular, fontSize: fonte.corpo, lineHeight: 21, color: t.textoCorpo },
  dica: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 12, padding: 14, backgroundColor: t.dicaFundo, borderWidth: t.borda, borderColor: t.dicaBorda },
  dicaIcone: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  dicaTitulo: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.texto },
  dicaTexto: { fontFamily: typography.regular, fontSize: fonte.apoio, lineHeight: 19, color: t.textoCorpo },
  navegacao: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE },
  atalho: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: ALVO_TOQUE, paddingHorizontal: 14, borderRadius: 22, borderWidth: t.borda, borderColor: t.dicaBorda, backgroundColor: t.dicaFundo },
  atalhoTexto: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.texto },
}) as const;
