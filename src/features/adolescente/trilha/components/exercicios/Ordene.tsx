// src/features/adolescente/trilha/components/exercicios/Ordene.tsx
import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { OpcaoQuiz } from '../../services/trilhaService';
import { BALANCO, PULINHO, atrasoCascata } from './animacoes';

type Props = {
  opcoes: OpcaoQuiz[]; // já vêm ordenadas por `ordem` — essa ORDEM é o gabarito
  resposta: string[]; // ids na ordem que o usuário já escolheu, mais recente por último
  respondido: boolean;
  onMudar: (novaResposta: string[]) => void;
};

// mesmo gerador determinístico do TrilhaPath — embaralha sempre igual pra
// mesma questão (sem Math.random, senão reordenaria a cada re-render)
function pseudoAleatorio(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

function embaralhar<T extends { id: string }>(itens: T[]): T[] {
  return itens
    .map((item, i) => ({ item, chave: pseudoAleatorio(i + item.id.length + 1) }))
    .sort((a, b) => a.chave - b.chave)
    .map((x) => x.item);
}

/**
 * "Ordene": lista embaralhada, sem drag-and-drop — o usuário toca os itens
 * na sequência que acha certa. Cada toque adiciona o item ao fim de
 * `resposta` e mostra um número de posição nele; tocar de novo num item já
 * numerado remove ele da resposta (permite corrigir sem precisar de botão
 * de reset). Feedback de certo/errado (ver ExercicioQuizContainer) compara
 * a ordem inteira contra `opcoes` na ordem original.
 *
 * Animações: os itens entram em cascata, o número da posição "estoura"
 * (mola) ao ser escolhido e, ao responder, o item certo pulsa e o errado
 * balança.
 */
export default function Ordene({ opcoes, resposta, respondido, onMudar }: Props) {
  const itensEmbaralhados = useMemo(() => embaralhar(opcoes), [opcoes]);

  function handleTocar(id: string) {
    if (respondido) return;
    Haptics.selectionAsync();
    if (resposta.includes(id)) {
      onMudar(resposta.filter((r) => r !== id));
    } else {
      onMudar([...resposta, id]);
    }
  }

  return (
    <View style={styles.lista}>
      <AppText style={styles.instrucao}>Toque na ordem certa</AppText>
      {itensEmbaralhados.map((opcao, indice) => {
        const posicao = resposta.indexOf(opcao.id);
        const selecionado = posicao !== -1;
        // depois de respondido, avalia esse item específico contra o
        // gabarito (posição que o usuário deu bate com `opcao.ordem`?)
        const posicaoCorreta = opcoes.findIndex((o) => o.id === opcao.id);
        const acertouEsseItem = respondido && selecionado && posicao === posicaoCorreta;
        const errouEsseItem = respondido && (!selecionado || posicao !== posicaoCorreta);

        return (
          // externo: entrada em cascata; interno: pulso (certo) / balanço (errado)
          <MotiView
            key={opcao.id}
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 280, delay: atrasoCascata(indice) }}
            style={styles.itemExterno}
          >
            <MotiView
              animate={{
                scale: acertouEsseItem ? PULINHO : 1,
                translateX: errouEsseItem ? BALANCO : 0,
              }}
              transition={{ type: 'timing', duration: errouEsseItem ? 380 : 320 }}
            >
              <Pressable
                disabled={respondido}
                onPress={() => handleTocar(opcao.id)}
                style={[
                  styles.item,
                  selecionado && !respondido && styles.itemSelecionado,
                  acertouEsseItem && styles.itemCerto,
                  errouEsseItem && styles.itemErrado,
                ]}
              >
                {/* a `key` muda quando entra/sai/troca de posição: o número estoura de novo */}
                <MotiView
                  key={`${selecionado}-${posicao}`}
                  from={{ scale: selecionado ? 0.4 : 1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 240 }}
                  style={[
                    styles.badge,
                    selecionado ? styles.badgePreenchido : styles.badgeVazio,
                    acertouEsseItem && styles.badgeCerto,
                    errouEsseItem && selecionado && styles.badgeErrado,
                  ]}
                >
                  {selecionado ? (
                    <AppText style={styles.badgeTexto}>{posicao + 1}</AppText>
                  ) : (
                    <Ionicons name="ellipse-outline" size={14} color={colors.placeholder} />
                  )}
                </MotiView>
                <AppText style={styles.itemTexto}>{opcao.texto}</AppText>
              </Pressable>
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: colors.exercicioBorda,
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemSelecionado: { borderColor: colors.primary },
  itemCerto: { borderColor: colors.primary, backgroundColor: 'rgba(139, 207, 74, 0.16)' },
  itemErrado: { borderColor: colors.exercicioErro, backgroundColor: 'rgba(255, 69, 64, 0.10)', borderBottomColor: colors.exercicioErro },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeVazio: { borderColor: colors.exercicioBorda },
  badgePreenchido: { borderColor: colors.primary, backgroundColor: colors.primary },
  badgeCerto: { borderColor: colors.primary, backgroundColor: colors.primary },
  badgeErrado: { borderColor: colors.exercicioErro, backgroundColor: colors.exercicioErro },
  badgeTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
  itemTexto: {
    flex: 1,
    fontFamily: typography.semiBold,
    fontSize: 14,
    color: colors.exercicioTexto,
  },
});