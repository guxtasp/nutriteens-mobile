// src/features/legal/screens/LegalDocumentoScreen.tsx
//
// Mostra os Termos de Uso ou a Política de Privacidade (rota recebe `documento: 'termos' | 'privacidade'`).
// v2.0: índice "PULAR PARA" (o texto é longo para quem tem 10-15 anos), número da seção em destaque
// e, enquanto TEXTO_EM_REVISAO, os trechos [ENTRE COLCHETES] em amarelo para a revisão enxergar
// o que falta confirmar.
import React, { useRef } from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
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
import { partirPendencias, separarNumeroSecao } from '../utils/textoLegal';

/** Folga acima da seção ao pular, para o título não colar no topo. */
const FOLGA_AO_PULAR = 8;

function Paragrafo({ texto }: { texto: string }) {
  if (!TEXTO_EM_REVISAO) return <AppText style={styles.body}>{texto}</AppText>;
  return (
    <AppText style={styles.body}>
      {partirPendencias(texto).map((t, i) =>
        t.pendente ? (
          <AppText key={i} style={styles.pendente}>
            {t.texto}
          </AppText>
        ) : (
          t.texto
        ),
      )}
    </AppText>
  );
}

export default function LegalDocumentoScreen({ navigation, route }: any) {
  const tipo: TipoDocumentoLegal = route?.params?.documento === 'privacidade' ? 'privacidade' : 'termos';
  const doc = DOCUMENTOS_LEGAIS[tipo];

  const scrollRef = useRef<ScrollView>(null);
  // y de cada seção dentro do conteúdo rolável (medido no onLayout)
  const posicoes = useRef<Record<number, number>>({});

  function pularPara(indice: number) {
    const y = posicoes.current[indice];
    if (y === undefined) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - FOLGA_AO_PULAR), animated: true });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
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
              Este texto está em revisão e pode mudar antes da versão final. Em amarelo: o que falta confirmar.
            </AppText>
          </View>
        )}

        <AppText style={styles.intro}>{doc.intro}</AppText>

        <AppText style={styles.pularRotulo}>PULAR PARA</AppText>
        <View style={styles.chips}>
          {doc.secoes.map((secao, i) => (
            <Pressable
              key={secao.titulo}
              onPress={() => pularPara(i)}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressionado]}
              accessibilityRole="button"
              accessibilityLabel={`Pular para a seção ${secao.titulo}`}
              hitSlop={{ top: 4, bottom: 4 }}
            >
              <AppText style={styles.chipTexto}>{secao.titulo}</AppText>
            </Pressable>
          ))}
        </View>

        {doc.secoes.map((secao, i) => {
          const { numero, titulo } = separarNumeroSecao(secao.titulo);
          return (
            <View
              key={secao.titulo}
              style={styles.secao}
              onLayout={(e) => {
                posicoes.current[i] = e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.secaoCabecalho} accessible accessibilityRole="header" accessibilityLabel={secao.titulo}>
                {numero && (
                  <View style={styles.numero}>
                    <AppText style={styles.numeroTexto}>{numero}</AppText>
                  </View>
                )}
                <AppText style={styles.secaoTitulo}>{titulo}</AppText>
              </View>
              {secao.paragrafos.map((p, j) => (
                <Paragrafo key={j} texto={p} />
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  conteudo: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 60 },
  backButton: { marginBottom: 24 },
  title: { fontFamily: typography.bold, fontSize: 24, color: colors.primaryDark, marginBottom: 4 },
  versao: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave, marginBottom: 16 },
  aviso: { backgroundColor: colors.avisoRevisaoFundo, borderRadius: 12, padding: 12, marginBottom: 16 },
  avisoTexto: { fontFamily: typography.semiBold, fontSize: 13, lineHeight: 19, color: colors.avisoRevisaoTexto },
  intro: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.primaryDark },
  pularRotulo: {
    fontFamily: typography.bold,
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textoSuave,
    marginTop: 16,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: colors.superficieSuave2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipPressionado: { backgroundColor: colors.exercicioAcertoFundo },
  chipTexto: { fontFamily: typography.semiBold, fontSize: 12, color: colors.primaryDark },
  secao: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: colors.divisoriaSuave,
    gap: 6,
  },
  secaoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numero: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.exercicioAcertoFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.destaqueTexto },
  secaoTitulo: { flex: 1, fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  body: { fontFamily: typography.regular, fontSize: 13.5, lineHeight: 21, color: colors.primaryDark },
  pendente: {
    fontFamily: typography.semiBold,
    backgroundColor: colors.amareloSuave,
    color: colors.amareloTexto,
  },
});
