// src/features/legal/components/ReaceiteModal.tsx
//
// "Atualizamos o nosso combinado": pede o novo aceite a quem aceitou uma versão anterior dos
// termos. Um Modal só, com dois modos (cartão / resumo), para não trocar dois Modals de lugar
// ao mesmo tempo (falha no iOS). O resumo é a mesma folha do cadastro.
import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { MUDANCAS_DA_VERSAO, VERSAO_TERMOS, type TipoDocumentoLegal } from '../data/textosLegais';
import { ResumoTermosFolha } from './ResumoTermosSheet';

export type ModoReaceite = 'cartao' | 'resumo';

interface Props {
  visivel: boolean;
  modo: ModoReaceite;
  salvando: boolean;
  erro: string | null;
  onConcordar: () => void;
  onVerResumo: () => void;
  onFecharResumo: () => void;
  onAbrirDocumento: (tipo: TipoDocumentoLegal) => void;
  /** Botão voltar do Android: fecha até a próxima abertura do app, sem aceitar. */
  onDispensar: () => void;
}

export function ReaceiteModal({
  visivel,
  modo,
  salvando,
  erro,
  onConcordar,
  onVerResumo,
  onFecharResumo,
  onAbrirDocumento,
  onDispensar,
}: Props) {
  const rotuloConcordar = salvando ? 'SALVANDO...' : 'CONCORDO';

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={modo === 'resumo' ? onFecharResumo : onDispensar}
    >
      {modo === 'resumo' ? (
        <ResumoTermosFolha
          onConcordar={onConcordar}
          onFechar={onFecharResumo}
          onAbrirDocumento={onAbrirDocumento}
          rotuloConcordar={rotuloConcordar}
          concordarDesabilitado={salvando}
        />
      ) : (
        <View style={styles.overlay}>
          <View style={styles.cartao} accessibilityViewIsModal>
            <Image
              source={require('../../../../assets/img/mascot/broxis-aceno.png')}
              style={styles.broxis}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <View style={styles.selo}>
              <AppText style={styles.seloTexto}>VERSÃO {VERSAO_TERMOS}</AppText>
            </View>
            <AppText style={styles.titulo} accessibilityRole="header">
              Atualizamos o nosso combinado
            </AppText>
            <AppText style={styles.texto}>Nada muda no jeito de usar o app. Só deixamos mais claro:</AppText>

            <View style={styles.mudancas}>
              {MUDANCAS_DA_VERSAO.map((m) => (
                <View key={m} style={styles.mudanca}>
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={14} color={colors.destaqueTexto} />
                  </View>
                  <AppText style={styles.mudancaTexto}>{m}</AppText>
                </View>
              ))}
            </View>

            <Pressable
              onPress={onVerResumo}
              style={({ pressed }) => [styles.linhaResumo, pressed && styles.linhaResumoPressionada]}
              accessibilityRole="button"
              accessibilityLabel="Ver o resumo em 1 minuto"
            >
              <AppText style={styles.linhaResumoTexto}>Ver o resumo em 1 minuto</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
            </Pressable>

            {erro && (
              <AppText style={styles.erro} accessibilityRole="alert">
                {erro}
              </AppText>
            )}

            <AppButton
              label={rotuloConcordar}
              accessibilityLabel="Concordo com a nova versão dos Termos de Uso e da Política de Privacidade"
              onPress={onConcordar}
              disabled={salvando}
            />
            <Pressable
              onPress={() => onAbrirDocumento('privacidade')}
              style={styles.duvidas}
              accessibilityRole="link"
              accessibilityLabel="Tenho dúvidas. Abrir a Política de Privacidade com o contato da equipe"
            >
              <AppText style={styles.duvidasTexto}>Tenho dúvidas · falar com a equipe</AppText>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.sobreposicaoModal,
  },
  cartao: {
    marginTop: 64, // espaço para o Bróxis espiando por cima
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 14,
  },
  broxis: { position: 'absolute', right: 16, top: -72, width: 78, height: 104 },
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seloTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1.1, color: colors.destaqueTexto },
  titulo: { fontFamily: typography.bold, fontSize: 22, lineHeight: 26, color: colors.primaryDark },
  texto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 21, color: colors.textoCorrido },
  mudancas: { gap: 10 },
  mudanca: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.exercicioAcertoFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mudancaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13.5, lineHeight: 19, color: colors.primaryDark },
  linhaResumo: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.superficieSuave2,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  linhaResumoPressionada: { backgroundColor: colors.exercicioAcertoFundo },
  linhaResumoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  erro: { fontFamily: typography.semiBold, fontSize: 13, lineHeight: 18, color: colors.error, textAlign: 'center' },
  duvidas: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  duvidasTexto: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
