// src/features/adolescente/triagem/components/ChatBroxis.tsx
//
// Peças visuais da conversa com o Bróxis (BroxisConversaScreen): bolhas, "digitando…" e os
// cartões do roteiro. Sem estado próprio: quem decide o que aparece é a tela.
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { CARTAO_COMO_VAI_SER, CARTAO_PRIVACIDADE, type IdCartao } from '../data/roteiroBroxis';

type NomeIcone = keyof typeof Ionicons.glyphMap;

export const AVATAR_BROXIS = require('../../../../../assets/img/feedback/supercontente.png');
const LARGURA_AVATAR = 28;

/** Entrada de mensagem nova; com `semAnimacao` (reduzir movimento ou fala que veio do herói) aparece pronta. */
export function EntradaMensagem({ semAnimacao, children }: { semAnimacao: boolean; children: React.ReactNode }) {
  if (semAnimacao) return <View>{children}</View>;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'timing', duration: 320 }}
    >
      {children}
    </MotiView>
  );
}

function Avatar({ visivel }: { visivel: boolean }) {
  if (!visivel) return <View style={styles.espacoAvatar} />;
  return (
    <Image
      source={AVATAR_BROXIS}
      style={styles.avatar}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

export function BolhaBroxis({ texto, comAvatar }: { texto: string; comAvatar: boolean }) {
  return (
    <View style={styles.linhaBroxis}>
      <Avatar visivel={comAvatar} />
      <View style={[styles.bolhaBroxis, comAvatar && styles.bolhaBroxisComAvatar]}>
        <AppText style={styles.textoBroxis} accessibilityLabel={`Bróxis: ${texto}`}>
          {texto}
        </AppText>
      </View>
    </View>
  );
}

export function BolhaUsuario({ texto }: { texto: string }) {
  return (
    <View style={styles.bolhaUsuario}>
      <AppText style={styles.textoUsuario} accessibilityLabel={`Você: ${texto}`}>
        {texto}
      </AppText>
    </View>
  );
}

/** Três pontinhos pulando, escalonados em 150 ms. Parados com reduzir movimento. */
export function PontosDigitando({ reduzirMovimento }: { reduzirMovimento: boolean }) {
  return (
    <View style={styles.pontos} accessible accessibilityLabel="Bróxis está digitando">
      {[0, 1, 2].map((i) =>
        reduzirMovimento ? (
          <View key={i} style={styles.ponto} />
        ) : (
          <MotiView
            key={i}
            from={{ translateY: 0, opacity: 0.45 }}
            animate={{ translateY: -4, opacity: 1 }}
            transition={{ type: 'timing', duration: 300, loop: true, delay: i * 150 }}
            style={styles.ponto}
          />
        ),
      )}
    </View>
  );
}

export function BolhaDigitando({ reduzirMovimento }: { reduzirMovimento: boolean }) {
  return (
    <View style={styles.linhaBroxis}>
      <View style={styles.espacoAvatar} />
      <View style={[styles.bolhaBroxis, styles.bolhaDigitando]}>
        <PontosDigitando reduzirMovimento={reduzirMovimento} />
      </View>
    </View>
  );
}

function CartaoComoVaiSer() {
  return (
    <>
      <AppText style={styles.cartaoRotulo}>{CARTAO_COMO_VAI_SER.titulo}</AppText>
      {CARTAO_COMO_VAI_SER.passos.map((p, i) => (
        <View key={p.titulo} style={styles.cartaoLinha}>
          <View style={styles.cartaoCirculo}>
            <AppText style={styles.cartaoNumero}>{i + 1}</AppText>
          </View>
          <View style={styles.flex}>
            <AppText style={styles.cartaoTitulo}>{p.titulo}</AppText>
            <AppText style={styles.cartaoTexto}>{p.texto}</AppText>
          </View>
        </View>
      ))}
    </>
  );
}

function CartaoPrivacidade({ onAbrirPolitica }: { onAbrirPolitica: () => void }) {
  return (
    <>
      {CARTAO_PRIVACIDADE.itens.map((item) => (
        <View key={item.destaque} style={styles.cartaoLinha}>
          <View style={styles.cartaoCirculo}>
            <Ionicons name={item.icone as NomeIcone} size={14} color={colors.destaqueTexto} />
          </View>
          <AppText style={[styles.cartaoTextoCorrido, styles.flex]}>
            <AppText style={styles.negrito}>{item.destaque}</AppText> {item.texto}
          </AppText>
        </View>
      ))}
      <Pressable onPress={onAbrirPolitica} accessibilityRole="link" style={styles.cartaoLink} hitSlop={8}>
        <AppText style={styles.cartaoLinkTexto}>{CARTAO_PRIVACIDADE.link}</AppText>
      </Pressable>
    </>
  );
}

export function CartaoRoteiro({ cartao, onAbrirPolitica }: { cartao: IdCartao; onAbrirPolitica: () => void }) {
  return (
    <View style={styles.linhaBroxis}>
      <View style={styles.espacoAvatar} />
      <View style={styles.cartao}>
        {cartao === 'como_vai_ser' ? <CartaoComoVaiSer /> : <CartaoPrivacidade onAbrirPolitica={onAbrirPolitica} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  linhaBroxis: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  espacoAvatar: { width: LARGURA_AVATAR },
  avatar: { width: LARGURA_AVATAR, height: LARGURA_AVATAR, borderRadius: LARGURA_AVATAR / 2 },
  bolhaBroxis: {
    maxWidth: 262,
    flexShrink: 1,
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  bolhaBroxisComAvatar: { borderBottomLeftRadius: 4 },
  bolhaDigitando: { paddingVertical: 14, paddingHorizontal: 16 },
  textoBroxis: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: colors.primaryDark },
  bolhaUsuario: {
    alignSelf: 'flex-end',
    maxWidth: 240,
    backgroundColor: colors.primaryDark,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  textoUsuario: { fontFamily: typography.semiBold, fontSize: 14, lineHeight: 20, color: colors.white },
  pontos: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  ponto: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.destaqueTexto },
  cartao: {
    width: 262,
    flexShrink: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.bordaSuave,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  cartaoRotulo: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1.1, color: colors.destaqueTexto },
  cartaoLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cartaoCirculo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.exercicioAcertoFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaoNumero: { fontFamily: typography.bold, fontSize: 12, color: colors.destaqueTexto },
  cartaoTitulo: { fontFamily: typography.bold, fontSize: 13.5, color: colors.primaryDark },
  cartaoTexto: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave, marginTop: 1 },
  cartaoTextoCorrido: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: colors.primaryDark },
  negrito: { fontFamily: typography.bold },
  cartaoLink: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  cartaoLinkTexto: {
    fontFamily: typography.bold,
    fontSize: 12.5,
    color: colors.destaqueTexto,
    textDecorationLine: 'underline',
  },
});
