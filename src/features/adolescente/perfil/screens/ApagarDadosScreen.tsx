// src/features/adolescente/perfil/screens/ApagarDadosScreen.tsx
//
// "Apagar meus dados", passo 1 (HANDOFF_REBRAND, fase 5): mostra o que acontece antes de pedir a
// confirmação. Tom de apoio, sem tentar convencer a ficar; oferece "dar um tempo" (sair) como opção.
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useSairDaConta } from '../../../../shared/hooks/useSairDaConta';
import { AVISO_IRREVERSIVEL, AVISO_IRREVERSIVEL_TITULO, FALA_APAGAR, ITENS_APAGADOS } from '../data/textosExclusao';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'ApagarDados'>;

const BROXIS = require('../../../../../assets/img/mascot/broxis-aceno.png');

export default function ApagarDadosScreen({ navigation }: Props) {
  const { sair, saindo } = useSairDaConta();

  return (
    <SafeAreaView style={styles.tela}>
      <ScreenHeader titulo="Apagar meus dados" onVoltar={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.broxisLinha}>
          <Image source={BROXIS} style={styles.broxis} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />
          <SpeechBubble text={FALA_APAGAR} typewriter={false} tailPosition="left" style={styles.balao} />
        </View>

        <View style={styles.cartao}>
          <AppText style={styles.cartaoTitulo} accessibilityRole="header">
            O QUE SERÁ APAGADO
          </AppText>
          {ITENS_APAGADOS.map((item) => (
            <View key={item.titulo} style={styles.item} accessible accessibilityLabel={`${item.titulo}: ${item.detalhe}`}>
              <View style={styles.itemIcone}>
                <Ionicons name="close" size={14} color={colors.error} />
              </View>
              <View style={styles.flex}>
                <AppText style={styles.itemTitulo}>{item.titulo}</AppText>
                <AppText style={styles.itemDetalhe}>{item.detalhe}</AppText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.aviso}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primaryDark} />
          <AppText style={styles.avisoTexto}>
            <AppText style={styles.negrito}>{AVISO_IRREVERSIVEL_TITULO}</AppText> {AVISO_IRREVERSIVEL}
          </AppText>
        </View>

        <Pressable
          onPress={sair}
          disabled={saindo}
          style={styles.darTempo}
          accessibilityRole="button"
          accessibilityLabel="Só quer dar um tempo? Sair da conta. Seus dados ficam guardados."
        >
          <AppText style={[styles.darTempoTexto, styles.flex]}>
            <AppText style={styles.negrito}>Só quer dar um tempo?</AppText> Saia da conta; seus dados ficam guardados.
          </AppText>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </Pressable>
      </ScrollView>

      <View style={styles.rodape}>
        <AppButton
          label="CONTINUAR"
          backgroundColor={colors.error}
          textColor={colors.white}
          shadowColor={colors.errorShadow}
          onPress={() => navigation.navigate('ApagarConfirmar')}
          accessibilityHint="Abre a confirmação para apagar a conta"
        />
        <Pressable onPress={() => navigation.goBack()} style={styles.link} accessibilityRole="button">
          <AppText style={styles.linkTexto}>Mudei de ideia</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  conteudo: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16, gap: 14 },
  broxisLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  broxis: { width: 74, height: 90 },
  balao: { flex: 1, marginTop: 22 },
  cartao: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.bordaSuave,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  cartaoTitulo: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1.1, color: colors.error },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemIcone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.erroSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  itemDetalhe: { fontFamily: typography.regular, fontSize: 12.5, color: colors.textoSuave, marginTop: 1 },
  aviso: { flexDirection: 'row', gap: 10, backgroundColor: colors.superficieSuave, borderRadius: 16, padding: 14 },
  avisoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: colors.primaryDark },
  negrito: { fontFamily: typography.bold },
  darTempo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    backgroundColor: colors.superficieSuave2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  darTempoTexto: { fontFamily: typography.regular, fontSize: 13.5, lineHeight: 19, color: colors.primaryDark },
  rodape: { paddingHorizontal: 20, paddingBottom: 16, gap: 4 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkTexto: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark, textDecorationLine: 'underline' },
});
