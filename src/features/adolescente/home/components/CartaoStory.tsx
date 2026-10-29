// src/features/adolescente/home/components/CartaoStory.tsx
//
// Cartão final da retrospectiva em formato "story": ocupa a tela inteira (largura × altura do
// aparelho), com fundo de raios, confete e brilhos ESTÁTICOS (para aparecerem na imagem
// exportada), o Bróxis, o parabéns pelo aniversário e pela jornada, o resumo do que a pessoa
// conquistou e a logo do NutriTeens. É este View que vira imagem no "Compartilhar".
//
// Sem dado pessoal: nada de nome, idade ou data de nascimento. A faixa de baixo é só
// decoração: os botões da tela ficam por cima dela (e fora da imagem).
import React, { forwardRef, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { escalaDoCartao } from '../utils/escalaCartao';

type Props = {
  largura: number;
  altura: number;
  titulo: string;
  mensagem: string;
  resumo: { valor: string; rotulo: string }[];
};

const CORES_CONFETE = [colors.primary, '#FFD54A', '#FFFFFF', '#E9578F', '#FFF3C4', '#6BC6FF'];
const QTD_CONFETE = 46;
/** altura da faixa decorativa de baixo, onde ficam os botões (fora da imagem) */
export const FAIXA_BOTOES = 150;

// pseudo-aleatório determinístico: o confete é sempre o mesmo (mesma tela, mesma imagem)
function ruido(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CartaoStory = forwardRef<View, Props>(function CartaoStory({ largura, altura, titulo, mensagem, resumo }, ref) {
  const esc = escalaDoCartao(altura);
  const p = (n: number) => Math.round(n * esc);
  const confete = useMemo(
    () =>
      Array.from({ length: QTD_CONFETE }, (_, i) => {
        const redondo = i % 3 === 0;
        const w = 6 + ruido(i, 3) * 9;
        return {
          key: i,
          left: ruido(i, 1) * largura,
          top: ruido(i, 2) * altura,
          w,
          h: redondo ? w : w * 0.45,
          rot: `${Math.round(ruido(i, 4) * 360)}deg`,
          cor: CORES_CONFETE[i % CORES_CONFETE.length],
          redondo,
          opacidade: 0.55 + ruido(i, 5) * 0.4,
        };
      }),
    [largura, altura],
  );

  const brilhos = [
    { top: altura * 0.07, left: largura * 0.08, size: 30 },
    { top: altura * 0.12, left: largura * 0.8, size: 22 },
    { top: altura * 0.36, left: largura * 0.04, size: 18 },
    { top: altura * 0.41, left: largura * 0.88, size: 28 },
    { top: altura * 0.62, left: largura * 0.1, size: 24 },
  ];

  return (
    <View ref={ref} collapsable={false} style={[styles.raiz, { width: largura, height: altura }]}>
      {/* fundo: verde do app + raios + "chão" curvo na base */}
      <Image
        source={require('../../../../../assets/img/celebracao/fundo-raios.png')}
        style={[StyleSheet.absoluteFill, { width: largura, height: altura }]}
        resizeMode="cover"
      />
      <View style={[styles.chao, { width: largura * 1.7, height: largura * 1.7, left: -largura * 0.35, top: altura - FAIXA_BOTOES - 24 }]} />

      {/* confete e brilhos estáticos */}
      {confete.map((c) => (
        <View
          key={c.key}
          pointerEvents="none"
          style={{
            position: 'absolute', left: c.left, top: c.top, width: c.w, height: c.h,
            borderRadius: c.redondo ? c.w / 2 : 2, backgroundColor: c.cor, opacity: c.opacidade,
            transform: [{ rotate: c.rot }],
          }}
        />
      ))}
      {brilhos.map((b, i) => (
        <Ionicons key={i} name="sparkles" size={b.size} color="#FFF3C4" style={{ position: 'absolute', top: b.top, left: b.left }} />
      ))}

      {/* conteúdo */}
      <View style={[styles.conteudo, { gap: p(10) }]}>
        <BroxisMascot size={Math.round(Math.min(190, altura * 0.21) * esc)} pose="supercontente" entrance="nenhuma" showParticles={false} />
        <AppText style={[styles.titulo, { fontSize: p(46), lineHeight: p(52) }]} accessibilityRole="header">{titulo}</AppText>
        <AppText style={[styles.mensagem, { fontSize: p(16), lineHeight: p(22) }]}>{mensagem}</AppText>

        <View style={[styles.painel, { gap: p(8), padding: p(12) }]}>
          {resumo.map((r) => (
            <View key={r.rotulo} style={[styles.linha, { paddingVertical: p(8) }]}>
              <AppText style={[styles.valor, { fontSize: p(28), lineHeight: p(34), minWidth: p(60) }]}>{r.valor}</AppText>
              <AppText style={[styles.rotulo, { fontSize: p(15) }]}>{r.rotulo}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.marca}>
          <Image source={require('../../../../../assets/img/logo.png')} style={[styles.logo, { width: p(190), height: p(56) }]} resizeMode="contain" accessibilityLabel="NutriTeens" />
          <AppText style={styles.marcaSub}>alimentação leve para adolescentes</AppText>
        </View>
      </View>
    </View>
  );
});

export default CartaoStory;

const styles = StyleSheet.create({
  raiz: { backgroundColor: colors.background, overflow: 'hidden' },
  chao: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' },
  conteudo: {
    flex: 1, alignItems: 'center', paddingTop: 96, paddingHorizontal: 28, paddingBottom: FAIXA_BOTOES + 12, gap: 10,
  },
  titulo: {
    fontFamily: typography.bold, fontSize: 46, lineHeight: 52, color: colors.white, textAlign: 'center', marginTop: 4,
  },
  mensagem: {
    fontFamily: typography.semiBold, fontSize: 16, lineHeight: 22, color: '#FFF3C4', textAlign: 'center', paddingHorizontal: 10,
  },
  painel: {
    width: '100%', gap: 8, marginTop: 8, padding: 12, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  linha: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.14)',
    borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14,
  },
  valor: { fontFamily: typography.bold, fontSize: 28, color: colors.primary, minWidth: 60 },
  rotulo: { flex: 1, fontFamily: typography.semiBold, fontSize: 15, color: colors.white },
  marca: { marginTop: 'auto', alignItems: 'center', gap: 2 },
  logo: { width: 190, height: 56 },
  marcaSub: { fontFamily: typography.medium, fontSize: 12, color: colors.textOnDarkMuted },
});
