// src/features/adolescente/trilha/components/exercicios/Classifique.tsx
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { OpcaoQuiz } from '../../services/trilhaService';
import { BALANCO, PULINHO, atrasoCascata } from './animacoes';

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
 *
 * Animações: os cartões entram em cascata, o chip tocado dá um pulinho e, ao
 * responder, o cartão certo pulsa e o errado balança.
 */
export default function Classifique({ opcoes, categorias, resposta, respondido, onMudar }: Props) {
  function handleEscolher(opcaoId: string, categoria: string) {
    if (respondido) return;
    Haptics.selectionAsync();
    onMudar({ ...resposta, [opcaoId]: categoria });
  }

  return (
    <View style={styles.lista}>
      <AppText style={styles.instrucao}>Toque a categoria certa pra cada item</AppText>
      {opcoes.map((opcao, indice) => {
        const escolhida = resposta[opcao.id];
        const acertou = respondido && escolhida === opcao.categoria;
        const errou = respondido && !!escolhida && escolhida !== opcao.categoria;

        return (
          // externo: entrada em cascata; interno: pulso (certo) / balanço (errado)
          <MotiView
            key={opcao.id}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: atrasoCascata(indice) }}
            style={styles.itemExterno}
          >
            <MotiView
              animate={{
                scale: acertou ? PULINHO : 1,
                translateX: errou ? BALANCO : 0,
              }}
              transition={{ type: 'timing', duration: errou ? 380 : 320 }}
              style={[styles.cartao, acertou && styles.cartaoCerto, errou && styles.cartaoErrado]}
            >
              <AppText style={styles.itemTexto}>{opcao.texto}</AppText>
              <View style={styles.chips}>
                {categorias.map((categoria) => {
                  const selecionada = escolhida === categoria;
                  const ehCerta = respondido && categoria === opcao.categoria;
                  const ehEscolhaErrada = respondido && selecionada && categoria !== opcao.categoria;

                  return (
                    <MotiView
                      key={categoria}
                      animate={{ scale: selecionada && !respondido ? [1, 1.12, 1] : 1 }}
                      transition={{ type: 'timing', duration: 220 }}
                    >
                      <Pressable
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
                    </MotiView>
                  );
                })}
              </View>
            </MotiView>
          </MotiView>
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
  itemExterno: { marginBottom: 12 },
  cartao: {
    borderWidth: 1.5,
    borderColor: colors.exercicioBorda,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cartaoCerto: { borderColor: colors.primary, backgroundColor: 'rgba(139, 207, 74, 0.16)' },
  cartaoErrado: { borderColor: colors.exercicioErro, backgroundColor: 'rgba(255, 69, 64, 0.10)' },
  itemTexto: {
    fontFamily: typography.semiBold,
    fontSize: 14,
    color: colors.exercicioTexto,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.exercicioBorda,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipSelecionado: { borderColor: colors.primary, backgroundColor: 'rgba(139, 207, 74, 0.14)' },
  chipCerto: { borderColor: colors.primary, backgroundColor: 'rgba(139, 207, 74, 0.16)' },
  chipErrado: { borderColor: colors.exercicioErro, backgroundColor: 'rgba(255, 69, 64, 0.10)' },
  chipTexto: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    color: colors.placeholder,
  },
  chipTextoDestacado: { color: colors.exercicioTexto },
});