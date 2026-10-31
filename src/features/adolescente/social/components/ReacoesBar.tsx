// src/features/adolescente/social/components/ReacoesBar.tsx
//
// Linha de reações prontas de um evento do feed (Parabéns, Força, Bora, Fogo). Conjunto fixo, sem texto livre.
// Ícones do app em vez de emojis. Em evento de outra pessoa dá para reagir; no meu, só vejo as contagens.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { REACAO_INFO, REACOES, type EventoFeed, type Reacao } from '../utils/feed';

type Props = {
  evento: EventoFeed;
  desabilitado?: boolean;
  onReagir: (evento: EventoFeed, reacao: Reacao) => void;
};

/** Ícone e cor de cada reação (o emoji continua só como dado no banco/utils). */
export const VISUAL_REACAO: Record<Reacao, { icone: keyof typeof Ionicons.glyphMap; iconeVazio: keyof typeof Ionicons.glyphMap; cor: string; fundo: string }> = {
  PARABENS: { icone: 'ribbon', iconeVazio: 'ribbon-outline', cor: '#B07A12', fundo: '#FFF1C9' },
  FORCA: { icone: 'barbell', iconeVazio: 'barbell-outline', cor: '#2F7FC4', fundo: '#DCEEFE' },
  BORA: { icone: 'nutrition', iconeVazio: 'nutrition-outline', cor: '#3E8E2F', fundo: '#DDF1CF' },
  FOGO: { icone: 'flame', iconeVazio: 'flame-outline', cor: '#D9731A', fundo: '#FFE9D2' },
};

export function ReacoesBar({ evento, desabilitado = false, onReagir }: Props) {
  const somenteLeitura = evento.ehMeu;
  const lista = somenteLeitura ? REACOES.filter((r) => (evento.reacoes[r] ?? 0) > 0) : REACOES;
  if (lista.length === 0) return null;

  return (
    <View style={styles.linha}>
      {lista.map((reacao) => {
        const n = evento.reacoes[reacao] ?? 0;
        const selecionada = evento.minhaReacao === reacao;
        const info = REACAO_INFO[reacao];
        const v = VISUAL_REACAO[reacao];
        const bloqueada = desabilitado || somenteLeitura;

        return (
          <Pressable
            key={reacao}
            disabled={bloqueada}
            onPress={() => onReagir(evento, reacao)}
            accessibilityRole="button"
            accessibilityLabel={`${info.rotulo}${n > 0 ? `, ${n}` : ''}`}
            accessibilityState={{ selected: selecionada, disabled: bloqueada }}
            style={({ pressed }) => [
              styles.pill,
              selecionada && { backgroundColor: v.fundo, borderColor: v.cor },
              pressed && !bloqueada && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Ionicons name={selecionada ? v.icone : v.iconeVazio} size={17} color={selecionada ? v.cor : '#6B7A74'} />
            {n > 0 ? (
              <AppText style={[styles.contagem, selecionada && { color: v.cor }]}>{n}</AppText>
            ) : (
              !somenteLeitura && <AppText style={styles.rotulo}>{info.rotulo}</AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { minHeight: 38, paddingHorizontal: 12, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F6F8F6', borderWidth: 1.5, borderColor: '#E4EAE6' },
  contagem: { fontFamily: typography.bold, fontSize: 13, color: '#5F7167' },
  rotulo: { fontFamily: typography.semiBold, fontSize: 12.5, color: '#6B7A74' },
});

