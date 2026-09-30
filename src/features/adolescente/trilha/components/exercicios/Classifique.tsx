// src/features/adolescente/trilha/components/exercicios/Classifique.tsx
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { OpcaoQuiz } from '../../services/trilhaService';

type Props = {
  opcoes: OpcaoQuiz[]; // cada uma com `categoria` = gabarito
  categorias: string[]; // rótulos das categorias possíveis (dadosExtra.categorias)
  resposta: Record<string, string>; // opcaoId -> categoria escolhida
  respondido: boolean;
  onMudar: (novaResposta: Record<string, string>) => void;
};

/**
 * "Classifique": cada item vem com um chip por categoria disponível — toca
 * a categoria que acha certa pra aquele item. Mais direto que
 * arrastar-e-soltar num celular, e segue o mesmo padrão de chip usado no
 * banco de palavras do "Complete a frase".
 */
export default function Classifique({ opcoes, categorias, resposta, respondido, onMudar }: Props) {
  function handleEscolher(opcaoId: string, categoria: string) {
    if (respondido) return;
    onMudar({ ...resposta, [opcaoId]: categoria });
  }

  return (
    <View style={styles.lista}>
      <AppText style={styles.instrucao}>Toque a categoria certa pra cada item</AppText>
      {opcoes.map((opcao) => {
        const escolhida = resposta[opcao.id];
        const acertou = respondido && escolhida === opcao.categoria;
        const errou = respondido && !!escolhida && escolhida !== opcao.categoria;

        return (
          <View key={opcao.id} style={[styles.cartao, acertou && styles.cartaoCerto, errou && styles.cartaoErrado]}>
            <AppText style={styles.itemTexto}>{opcao.texto}</AppText>
            <View style={styles.chips}>
              {categorias.map((categoria) => {
                const selecionada = escolhida === categoria;
                const ehCerta = respondido && categoria === opcao.categoria;
                const ehEscolhaErrada = respondido && selecionada && categoria !== opcao.categoria;

                return (
                  <Pressable
                    key={categoria}
                    disabled={respondido}
                    onPress={() => handleEscolher(opcao.id, categoria)}
                    style={[
                      styles.chip,
                      selecionada && !respondido && styles.chipSelecionado,
                      ehCerta && styles.chipCerto,
                      ehEscolhaErrada && styles.chipErrado,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.chipTexto,
                        (selecionada || ehCerta) && styles.chipTextoDestacado,
                      ]}
                    >
                      {categoria}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { marginTop: 24 },
  instrucao: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.placeholder,
    textAlign: 'center',
    marginBottom: 14,
  },
  cartao: {
    borderWidth: 1.5,
    borderColor: '#E2E8DD',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  cartaoCerto: { borderColor: colors.success, backgroundColor: 'rgba(16, 185, 129, 0.08)' },
  cartaoErrado: { borderColor: colors.error, backgroundColor: 'rgba(192, 57, 43, 0.08)' },
  itemTexto: {
    fontFamily: typography.semiBold,
    fontSize: 14,
    color: colors.textOnLight,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#B9C2B6',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelecionado: { borderColor: colors.primary, backgroundColor: 'rgba(139, 207, 74, 0.14)' },
  chipCerto: { borderColor: colors.success, backgroundColor: 'rgba(16, 185, 129, 0.16)' },
  chipErrado: { borderColor: colors.error, backgroundColor: 'rgba(192, 57, 43, 0.16)' },
  chipTexto: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    color: colors.placeholder,
  },
  chipTextoDestacado: { color: colors.textOnLight },
});
