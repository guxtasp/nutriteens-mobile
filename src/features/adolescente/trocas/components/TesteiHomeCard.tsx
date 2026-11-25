// src/features/adolescente/trocas/components/TesteiHomeCard.tsx
//
// Widget do "Testei?" na Home: aparece quando há uma troca guardada há 2+ dias, sem resposta e
// não adiada. Some sozinho quando não há nada (não ocupa espaço). Não usa notificação: o
// "me lembra amanhã" só adia este cartão (ver DECISOES_REBRAND.md).
//
// Fica logo abaixo da água, no alto da Home: é uma pergunta rápida e com prazo (a lembrança da
// troca esfria), então precisa ser vista sem rolar. Duas ações diretas: contar como foi ou adiar.
// Sem animação de entrada nem mascote balançando: na Home ela atrapalhava (e dava salto de largura).
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { layout } from '../../../../shared/theme/layout';
import { typography } from '../../../../shared/theme/typography';
import { feedbackSelecao, feedbackToque } from '../../../../shared/audio/feedback';
import { useTrocasGuardadas } from '../hooks/useTrocasGuardadas';
import { iconeDoDestino } from '../utils/iconesTrocas';
import { noLugarDe } from '../utils/trocas';
import { APOIO_TESTEI, PERGUNTA_TESTEI } from '../data/textosTestei';

const BROXIS = require('../../../../../assets/img/feedback/supercontente.png');

export default function TesteiHomeCard() {
  const navigation = useNavigation<any>();
  const { paraPerguntar, adiar } = useTrocasGuardadas();
  const primeira = paraPerguntar[0];
  const outras = paraPerguntar.length - 1;

  if (!primeira) return null;

  return (
        <View style={styles.raiz}>
          {/* o Bróxis espia por cima do cartão */}
          <View style={styles.mascote} accessibilityElementsHidden importantForAccessibility="no">
            <Image source={BROXIS} style={styles.mascoteImg} resizeMode="contain" />
          </View>

          <View style={styles.cartao}>
            <View style={styles.selos}>
              <View style={styles.selo}>
                <AppText style={styles.seloTexto}>TESTEI?</AppText>
              </View>
              <AppText style={styles.dias}>
                guardada há {primeira.dias} {primeira.dias === 1 ? 'dia' : 'dias'}
              </AppText>
            </View>

            <AppText style={styles.titulo} accessibilityRole="header">
              {PERGUNTA_TESTEI}
            </AppText>

            <View style={styles.troca}>
              <View style={styles.trocaIcone}>
                <MaterialCommunityIcons name={iconeDoDestino(primeira.troca.destinoNome) as any} size={22} color={colors.primaryDark} />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.trocaNome} numberOfLines={1}>
                  {primeira.troca.destinoNome}
                </AppText>
                <AppText style={styles.trocaLugar} numberOfLines={1}>
                  {noLugarDe(primeira.troca.categoria)}
                </AppText>
              </View>
            </View>

            <View style={styles.acoes}>
              <Pressable
                onPress={() => {
                  feedbackToque();
                  navigation.navigate('TrocaTestei', { trocaId: primeira.troca.id });
                }}
                style={({ pressed }) => [styles.botao, pressed && styles.botaoPressionado]}
                accessibilityRole="button"
                accessibilityLabel={`Contar como foi testar ${primeira.troca.destinoNome}`}
              >
                <AppText style={styles.botaoTexto}>CONTAR COMO FOI</AppText>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primaryDark} />
              </Pressable>
              <Pressable
                onPress={() => {
                  feedbackSelecao();
                  void adiar(primeira.troca.id);
                }}
                style={styles.depois}
                accessibilityRole="button"
                accessibilityLabel="Ainda não testei. Me lembra amanhã"
              >
                <AppText style={styles.depoisTexto}>Amanhã</AppText>
              </Pressable>
            </View>

            <AppText style={styles.apoio}>
              {APOIO_TESTEI}
              {outras > 0 ? ` · +${outras} ${outras === 1 ? 'ideia esperando' : 'ideias esperando'}` : ''}
            </AppText>
          </View>
        </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  raiz: { marginHorizontal: layout.margemH, marginTop: layout.gapEntreBlocos + 14, marginBottom: layout.gapEntreBlocos },
  mascote: { position: 'absolute', right: 10, top: -30, zIndex: 2 },
  mascoteImg: { width: 76, height: 76 },
  cartao: {
    backgroundColor: colors.primaryDark,
    borderRadius: 22,
    padding: 16,
    gap: 12,
  },
  selos: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 72 },
  selo: { backgroundColor: colors.amareloDestaque, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  seloTexto: { fontFamily: typography.bold, fontSize: 10, letterSpacing: 1, color: colors.primaryDark },
  dias: { fontFamily: typography.semiBold, fontSize: 12, color: colors.textOnDarkMuted },
  titulo: { fontFamily: typography.bold, fontSize: 20, lineHeight: 25, color: colors.white, paddingRight: 60 },
  troca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 12,
  },
  trocaIcone: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.pilhaCartaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trocaNome: { fontFamily: typography.bold, fontSize: 15, color: colors.white },
  trocaLugar: { fontFamily: typography.regular, fontSize: 12, color: colors.textOnDarkMuted, marginTop: 1 },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botao: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoPressionado: { borderBottomWidth: 1, transform: [{ translateY: 3 }] },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  depois: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.textOnDarkMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depoisTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.white },
  apoio: { fontFamily: typography.regular, fontSize: 12, color: colors.textOnDarkMuted, textAlign: 'center' },
});
