// src/features/adolescente/social/components/ReacoesBar.tsx
//
// Linha de reações prontas (👏 💪 🍎 🔥) de um evento do feed. Conjunto fixo,
// sem texto livre. Em evento de outra pessoa dá para reagir; no meu, só vejo
// as contagens.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../../../../shared/theme/colors';
import { REACAO_INFO, REACOES, type EventoFeed, type Reacao } from '../utils/feed';

type Props = {
  evento: EventoFeed;
  desabilitado?: boolean;
  onReagir: (evento: EventoFeed, reacao: Reacao) => void;
};

export function ReacoesBar({ evento, desabilitado = false, onReagir }: Props) {
  const somenteLeitura = evento.ehMeu;

  // Nos meus eventos só mostro as reações que já recebi.
  const lista = somenteLeitura ? REACOES.filter((r) => (evento.reacoes[r] ?? 0) > 0) : REACOES;
  if (lista.length === 0) return null;

  return (
    <View style={styles.linha}>
      {lista.map((reacao) => {
        const n = evento.reacoes[reacao] ?? 0;
        const selecionada = evento.minhaReacao === reacao;
        const info = REACAO_INFO[reacao];

        return (
          <TouchableOpacity
            key={reacao}
            activeOpacity={0.7}
            disabled={desabilitado || somenteLeitura}
            onPress={() => onReagir(evento, reacao)}
            accessibilityRole="button"
            accessibilityLabel={`${info.rotulo}${n > 0 ? `, ${n}` : ''}`}
            accessibilityState={{ selected: selecionada, disabled: desabilitado || somenteLeitura }}
            style={[styles.pill, selecionada && styles.pillSelecionada]}
          >
            <Text style={styles.emoji}>{info.emoji}</Text>
            {n > 0 && <Text style={[styles.contagem, selecionada && styles.contagemSelecionada]}>{n}</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    minHeight: 36,
    minWidth: 48,
    paddingHorizontal: 12,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F3F8EE',
    borderWidth: 1,
    borderColor: '#E1EBD8',
  },
  pillSelecionada: {
    backgroundColor: '#E2F3D3',
    borderColor: colors.primary,
  },
  emoji: {
    fontSize: 17,
  },
  contagem: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5F7167',
  },
  contagemSelecionada: {
    color: colors.primaryDark,
  },
});
