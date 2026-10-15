import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackButton } from '../../../shared/ui/BackButton';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import {
  ATUALIZADO_EM,
  DOCUMENTOS_LEGAIS,
  TEXTO_EM_REVISAO,
  VERSAO_TERMOS,
  type TipoDocumentoLegal,
} from '../data/textosLegais';

/**
 * Mostra os Termos de Uso ou a Política de Privacidade.
 * Recebe `documento: 'termos' | 'privacidade'` pela rota.
 */
export default function LegalDocumentoScreen({ navigation, route }: any) {
  const tipo: TipoDocumentoLegal = route?.params?.documento === 'privacidade' ? 'privacidade' : 'termos';
  const doc = DOCUMENTOS_LEGAIS[tipo];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />

        <AppText style={styles.title} accessibilityRole="header">
          {doc.titulo}
        </AppText>
        <AppText style={styles.versao}>
          Versão {VERSAO_TERMOS} · atualizado em {ATUALIZADO_EM}
        </AppText>

        {TEXTO_EM_REVISAO && (
          <View style={styles.aviso} accessibilityRole="alert">
            <AppText style={styles.avisoTexto}>
              Este texto está em revisão e pode mudar antes da versão final.
            </AppText>
          </View>
        )}

        <AppText style={styles.intro}>{doc.intro}</AppText>

        {doc.secoes.map((secao) => (
          <View key={secao.titulo} style={styles.secao}>
            <AppText style={styles.secaoTitulo} accessibilityRole="header">
              {secao.titulo}
            </AppText>
            {secao.paragrafos.map((p, i) => (
              <AppText key={i} style={styles.body}>
                {p}
              </AppText>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  conteudo: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60 },
  backButton: { marginBottom: 24 },
  title: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark, marginBottom: 4 },
  versao: { fontFamily: typography.regular, fontSize: 12, color: colors.placeholder, marginBottom: 16 },
  aviso: { backgroundColor: '#FFF4D6', borderRadius: 12, padding: 12, marginBottom: 16 },
  avisoTexto: { fontFamily: typography.semiBold, fontSize: 13, color: '#6B4E00' },
  intro: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.primaryDark, marginBottom: 8 },
  secao: { marginTop: 20, gap: 8 },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  body: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.primaryDark },
});
