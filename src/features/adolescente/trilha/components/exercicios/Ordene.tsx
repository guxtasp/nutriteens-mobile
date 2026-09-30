// src/features/adolescente/trilha/components/exercicios/Ordene.tsx
import React, { useMemo } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { OpcaoQuiz } from '../../services/trilhaService';

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
 */
export default function Ordene({ opcoes, resposta, respondido, onMudar }: Props) {
  const itensEmbaralhados = useMemo(() => embaralhar(opcoes), [opcoes]);

  function handleTocar(id: string) {
    if (respondido) return;
    if (resposta.includes(id)) {
      onMudar(resposta.filter((r) => r !== id));
    } else {
      onMudar([...resposta, id]);
    }
  }

  return (
    <View style={styles.lista}>
      <AppText style={styles.instrucao}>Toque na ordem certa</AppText>
      {itensEmbaralhados.map((opcao) => {
        const posicao = resposta.indexOf(opcao.id);
        const selecionado = posicao !== -1;
        // depois de respondido, avalia esse item específico contra o
        // gabarito (posição que o usuário deu bate com `opcao.ordem`?)
        const posicaoCorreta = opcoes.findIndex((o) => o.id === opcao.id);
        const acertouEsseItem = respondido && selecionado && posicao === posicaoCorreta;
        const errouEsseItem = respondido && (!selecionado || posicao !== posicaoCorreta);

        return (
          <Pressable
            key={opcao.id}
            disabled={respondido}
            onPress={() => handleTocar(opcao.id)}
            style={[
              styles.item,
              selecionado && !respondido && styles.itemSelecionado,
              acertouEsseItem && styles.itemCerto,
              errouEsseItem && styles.itemErrado,
            ]}
          >
            <View
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
            </View>
            <AppText style={styles.itemTexto}>{opcao.texto}</AppText>
          </Pressable>
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
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#B9C2B6',
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  itemSelecionado: { borderColor: colors.primary },
  itemCerto: { borderColor: colors.success, backgroundColor: 'rgba(16, 185, 129, 0.08)' },
  itemErrado: { borderColor: colors.error, backgroundColor: 'rgba(192, 57, 43, 0.08)', borderBottomColor: colors.error },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeVazio: { borderColor: '#B9C2B6' },
  badgePreenchido: { borderColor: colors.primary, backgroundColor: colors.primary },
  badgeCerto: { borderColor: colors.success, backgroundColor: colors.success },
  badgeErrado: { borderColor: colors.error, backgroundColor: colors.error },
  badgeTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
  itemTexto: {
    flex: 1,
    fontFamily: typography.semiBold,
    fontSize: 14,
    color: colors.textOnLight,
  },
});
