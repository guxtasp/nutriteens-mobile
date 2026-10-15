// src/features/adolescente/social/components/AmigosStrip.tsx
//
// Faixa horizontal de amigos no topo do feed (estilo "stories"). O anel verde
// indica quem já manteve a sequência hoje. Tocar abre o perfil do amigo.
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../../../../shared/theme/colors';
import type { AmigoSocial } from '../services/socialService';
import { AvatarSocialView } from './AvatarSocialView';

type Props = {
  amigos: AmigoSocial[];
  /** amizadeId -> manteve a sequência hoje */
  mantiveramHoje: Record<string, boolean>;
  onAbrirAmigo: (amigo: AmigoSocial) => void;
};

export function AmigosStrip({ amigos, mantiveramHoje, onAbrirAmigo }: Props) {
  if (amigos.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.conteudo}
      style={styles.faixa}
    >
      {amigos.map((amigo) => {
        const ativo = mantiveramHoje[amigo.amizadeId] === true;

        return (
          <TouchableOpacity
            key={amigo.amizadeId}
            activeOpacity={0.7}
            onPress={() => onAbrirAmigo(amigo)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${amigo.apelido}${ativo ? ', manteve a sequência hoje' : ''}`}
          >
            <View style={[styles.anel, ativo && styles.anelAtivo]}>
              <AvatarSocialView avatar={amigo.avatar} size="small" />
            </View>
            <Text style={styles.nome} numberOfLines={1}>
              {amigo.apelido}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  faixa: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  conteudo: {
    paddingHorizontal: 20,
    gap: 14,
  },
  item: {
    width: 62,
    alignItems: 'center',
  },
  anel: {
    padding: 3,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: '#D9E3D3',
  },
  anelAtivo: {
    borderColor: colors.primary,
  },
  nome: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5D53',
    maxWidth: 62,
  },
});
