// src/features/adolescente/home/components/CartaoFesta.tsx
//
// Segundo modelo de cartão para compartilhar: o "instagramável". Sem números: o avatar do usuário
// de chapéu de festa, a capivara comemorando (amiga do Bróxis), o parabéns pelo aniversário e pela
// jornada e a logo. Mesmo formato story (tela cheia) do CartaoStory, e é este View que vira imagem.
//
// Sem dado pessoal: nada de nome, idade ou data. O avatar é a pose do Bróxis que a pessoa escolheu.
// Confete e brilhos são ESTÁTICOS para aparecerem na imagem exportada.
import React, { forwardRef, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { escalaDoCartao } from '../utils/escalaCartao';
import AvatarFesta from './AvatarFesta';

type Props = {
  largura: number;
  altura: number;
  titulo: string;
  mensagem: string;
  avatar: string | null | undefined;
};

/** topo reservado: barra de progresso e seletor de modelo ficam por cima (fora da imagem) */
const TOPO_RESERVADO = 150;
/** faixa de baixo, onde ficam os botões (fora da imagem) */
const FAIXA_BOTOES = 150;

const CORES_CONFETE = ['#FF7BA3', '#FFD54A', '#FFFFFF', '#6BC6FF', '#FFF3C4', colors.primary];
const QTD_CONFETE = 64;

function ruido(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CartaoFesta = forwardRef<View, Props>(function CartaoFesta({ largura, altura, titulo, mensagem, avatar }, ref) {
  const esc = escalaDoCartao(altura);
  const p = (n: number) => Math.round(n * esc);
  const diametroAvatar = Math.round(Math.min(130, altura * 0.14));

  const confete = useMemo(
    () =>
      Array.from({ length: QTD_CONFETE }, (_, i) => {
        const redondo = i % 3 === 0;
        const w = 7 + ruido(i, 3) * 11;
        return {
          key: i,
          left: ruido(i, 1) * largura,
          top: ruido(i, 2) * altura,
          w,
          h: redondo ? w : w * 0.45,
          rot: `${Math.round(ruido(i, 4) * 360)}deg`,
          cor: CORES_CONFETE[i % CORES_CONFETE.length],
          redondo,
          opacidade: 0.6 + ruido(i, 5) * 0.4,
        };
      }),
    [largura, altura],
  );

  return (
    <View ref={ref} collapsable={false} style={[styles.raiz, { width: largura, height: altura }]}>
      <Image
        source={require('../../../../../assets/img/celebracao/fundo-raios.png')}
        style={[StyleSheet.absoluteFill, { width: largura, height: altura }]}
        resizeMode="cover"
      />
      {/* "palco" claro atrás da capivara */}
      <View style={[styles.palco, { width: largura * 1.5, height: largura * 1.5, left: -largura * 0.25, top: altura * 0.5 }]} />

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
      <Ionicons name="sparkles" size={30} color="#FFF3C4" style={{ position: 'absolute', top: altura * 0.2, left: largura * 0.1 }} />
      <Ionicons name="sparkles" size={22} color="#FFF3C4" style={{ position: 'absolute', top: altura * 0.27, left: largura * 0.84 }} />
      <Ionicons name="sparkles" size={20} color="#FFF3C4" style={{ position: 'absolute', top: altura * 0.52, left: largura * 0.06 }} />

      <View style={[styles.conteudo, { paddingTop: TOPO_RESERVADO + p(34) }]}>
        <AvatarFesta avatar={avatar} diametro={diametroAvatar} />

        <AppText style={[styles.titulo, { fontSize: p(48), lineHeight: p(54) }]} accessibilityRole="header">
          {titulo}
        </AppText>
        <AppText style={[styles.mensagem, { fontSize: p(16), lineHeight: p(22) }]}>{mensagem}</AppText>

        {/* a capivara ocupa o que sobra de altura entre o texto e a logo */}
        <View style={styles.areaCapivara}>
          <Image
            source={require('../../../../../assets/img/aniversario/capivara-festa.png')}
            style={styles.capivara}
            resizeMode="contain"
            accessibilityLabel="Capivara comemorando com um balão"
          />
        </View>

        <View style={styles.marca}>
          <Image
            source={require('../../../../../assets/img/logo.png')}
            style={{ width: p(170), height: p(50) }}
            resizeMode="contain"
            accessibilityLabel="NutriTeens"
          />
          <AppText style={styles.marcaSub}>alimentação leve para adolescentes</AppText>
        </View>
      </View>
    </View>
  );
});

export default CartaoFesta;

const styles = StyleSheet.create({
  raiz: { backgroundColor: colors.background, overflow: 'hidden' },
  palco: { position: 'absolute', borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.10)' },
  conteudo: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingBottom: FAIXA_BOTOES + 12, gap: 8 },
  titulo: { fontFamily: typography.bold, color: colors.white, textAlign: 'center', marginTop: 10 },
  mensagem: { fontFamily: typography.semiBold, color: '#FFF3C4', textAlign: 'center', paddingHorizontal: 10 },
  areaCapivara: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  capivara: { width: '100%', height: '100%' },
  marca: { alignItems: 'center', gap: 2 },
  marcaSub: { fontFamily: typography.medium, fontSize: 12, color: colors.textOnDarkMuted },
});
