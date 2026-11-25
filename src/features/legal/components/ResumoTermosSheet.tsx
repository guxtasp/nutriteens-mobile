// src/features/legal/components/ResumoTermosSheet.tsx
//
// "O nosso combinado em 1 minuto": folha de baixo com o resumo dos Termos e da Política (v2.0).
// Abre no cadastro (no lugar de ir direto ao texto completo) e a partir do reaceite.
//
// Separada em duas peças: `ResumoTermosFolha` (só o conteúdo) e `ResumoTermosSheet` (o Modal).
// O reaceite reaproveita a folha dentro do PRÓPRIO Modal dele, porque dois Modals do React Native
// trocando de lugar ao mesmo tempo falham no iOS ("present while dismissing").
//
// O aceite continua sendo uma ação ativa: abrir a folha nunca marca nada sozinho; só "CONCORDO".
import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { useReduzirMovimento } from '../../../shared/hooks/useReduzirMovimento';
import { RESUMO_COMBINADO, VERSAO_TERMOS, type TipoDocumentoLegal } from '../data/textosLegais';

type NomeIcone = keyof typeof Ionicons.glyphMap;

export interface ResumoTermosFolhaProps {
  onConcordar: () => void;
  onFechar: () => void;
  onAbrirDocumento: (tipo: TipoDocumentoLegal) => void;
  /** Texto do botão principal (o reaceite pode mostrar "Salvando..."). */
  rotuloConcordar?: string;
  concordarDesabilitado?: boolean;
}

export function ResumoTermosFolha({
  onConcordar,
  onFechar,
  onAbrirDocumento,
  rotuloConcordar = 'CONCORDO',
  concordarDesabilitado,
}: ResumoTermosFolhaProps) {
  const insets = useSafeAreaInsets();
  const reduzirMovimento = useReduzirMovimento();

  return (
    <View style={styles.overlay}>
      {/* tocar fora fecha, como o "Fechar" (não aceita nada) */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onFechar}
        accessibilityRole="button"
        accessibilityLabel="Fechar o resumo"
      />
      <MotiView
        from={reduzirMovimento ? { opacity: 1, translateY: 0 } : { opacity: 0, translateY: 60 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: reduzirMovimento ? 0 : 280 }}
        style={[styles.folha, { paddingBottom: 16 + insets.bottom }]}
        accessibilityViewIsModal
      >
        <View style={styles.alca} accessibilityElementsHidden importantForAccessibility="no" />

        <View style={styles.cabecalho}>
          <View style={styles.cabecalhoTexto}>
            <View style={styles.selo}>
              <AppText style={styles.seloTexto}>RESUMO · VERSÃO {VERSAO_TERMOS}</AppText>
            </View>
            <AppText style={styles.titulo} accessibilityRole="header">
              O nosso combinado em 1 minuto
            </AppText>
          </View>
          <Image
            source={require('../../../../assets/img/mascot/broxis-aceno.png')}
            style={styles.broxis}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        {/* rola sozinha em tela baixa; os botões ficam sempre à vista */}
        <ScrollView style={styles.lista} showsVerticalScrollIndicator={false}>
          {RESUMO_COMBINADO.map((item, i) => (
            <View
              key={item.titulo}
              style={[styles.item, i < RESUMO_COMBINADO.length - 1 && styles.itemDivisoria]}
              accessible
              accessibilityLabel={`${item.titulo}. ${item.texto}`}
            >
              <View style={styles.itemIcone}>
                <Ionicons name={item.icone as NomeIcone} size={18} color={colors.destaqueTexto} />
              </View>
              <View style={styles.itemTextos}>
                <AppText style={styles.itemTitulo}>{item.titulo}</AppText>
                <AppText style={styles.itemTexto}>{item.texto}</AppText>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.linhaDocs}>
          <Pressable
            style={({ pressed }) => [styles.botaoDoc, pressed && styles.pressionado]}
            onPress={() => onAbrirDocumento('termos')}
            accessibilityRole="button"
            accessibilityLabel="Ler os Termos de Uso completos"
          >
            <AppText style={styles.botaoDocTexto}>Termos completos</AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.botaoDoc, pressed && styles.pressionado]}
            onPress={() => onAbrirDocumento('privacidade')}
            accessibilityRole="button"
            accessibilityLabel="Ler a Política de Privacidade completa"
          >
            <AppText style={styles.botaoDocTexto}>Privacidade completa</AppText>
          </Pressable>
        </View>

        <View style={styles.acoes}>
          <AppButton
            label={rotuloConcordar}
            accessibilityLabel="Concordo com os Termos de Uso e a Política de Privacidade"
            onPress={onConcordar}
            disabled={concordarDesabilitado}
          />
          <Pressable onPress={onFechar} style={styles.fechar} accessibilityRole="button" accessibilityLabel="Fechar">
            <AppText style={styles.fecharTexto}>Fechar</AppText>
          </Pressable>
        </View>
      </MotiView>
    </View>
  );
}

interface ResumoTermosSheetProps extends ResumoTermosFolhaProps {
  visivel: boolean;
}

export function ResumoTermosSheet({ visivel, ...props }: ResumoTermosSheetProps) {
  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={props.onFechar}
    >
      <ResumoTermosFolha {...props} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.sobreposicaoModal },
  folha: {
    maxHeight: '92%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 22,
  },
  alca: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.bordaSuave },
  cabecalho: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 10 },
  cabecalhoTexto: { flex: 1 },
  selo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seloTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1.1, color: colors.destaqueTexto },
  titulo: { fontFamily: typography.bold, fontSize: 24, lineHeight: 28, color: colors.primaryDark, marginTop: 10 },
  broxis: { width: 62, height: 84, marginBottom: -4 },
  lista: { marginTop: 8, flexGrow: 0, flexShrink: 1 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  itemDivisoria: { borderBottomWidth: 1, borderBottomColor: colors.divisoriaLista },
  itemIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.exercicioAcertoFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextos: { flex: 1 },
  itemTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  itemTexto: { fontFamily: typography.regular, fontSize: 12.5, lineHeight: 18, color: colors.textoCorrido, marginTop: 2 },
  linhaDocs: { flexDirection: 'row', gap: 10, marginTop: 12 },
  botaoDoc: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.bordaSuave,
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  pressionado: { backgroundColor: colors.superficieSuave },
  botaoDocTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, textAlign: 'center' },
  acoes: { marginTop: 14, gap: 2 },
  fechar: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  fecharTexto: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    textDecorationLine: 'underline',
  },
});
