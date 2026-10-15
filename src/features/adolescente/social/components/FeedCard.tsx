// src/features/adolescente/social/components/FeedCard.tsx
//
// Card de uma atividade no feed: avatar, "apelido + o que fez", quando e as
// reações prontas. Tocar no autor abre o perfil do amigo.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../../../shared/theme/colors';
import { AvatarSocialView } from './AvatarSocialView';
import { ReacoesBar } from './ReacoesBar';
import {
  REACAO_INFO,
  iconeEvento,
  tempoRelativo,
  textoEvento,
  type EventoFeed,
  type Reacao,
} from '../utils/feed';

type Props = {
  evento: EventoFeed;
  onReagir: (evento: EventoFeed, reacao: Reacao) => void;
  onAbrirAutor: (evento: EventoFeed) => void;
  reagindo?: boolean;
};

export function FeedCard({ evento, onReagir, onAbrirAutor, reagindo = false }: Props) {
  const podeAbrir = !evento.ehMeu && !!evento.amizadeId;

  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <TouchableOpacity
          disabled={!podeAbrir}
          onPress={() => onAbrirAutor(evento)}
          activeOpacity={0.7}
          accessibilityRole={podeAbrir ? 'button' : undefined}
          accessibilityLabel={podeAbrir ? `Ver perfil de ${evento.apelido}` : undefined}
        >
          <AvatarSocialView avatar={evento.avatar} size="small" />
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.frase}>
            <Text style={styles.autor}>{evento.ehMeu ? 'Você' : evento.apelido}</Text> {textoEvento(evento)}
          </Text>
          <Text style={styles.tempo}>{tempoRelativo(evento.criadoEm)}</Text>
        </View>

        <View style={styles.icone}>
          <Ionicons name={iconeEvento(evento.tipo) as any} size={20} color={colors.primaryDark} />
        </View>
      </View>

      <ReacoesBar evento={evento} desabilitado={reagindo} onReagir={onReagir} />

      {evento.ehMeu && evento.quemReagiu.length > 0 && (
        <Text style={styles.quemReagiu}>
          {evento.quemReagiu.map((r) => `${r.apelido} ${REACAO_INFO[r.reacao].emoji}`).join('  ·  ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4ECDF',
    padding: 14,
    marginBottom: 12,
  },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
  },
  frase: {
    fontSize: 15,
    lineHeight: 21,
    color: '#26382F',
  },
  autor: {
    fontWeight: '800',
    color: colors.primaryDark,
  },
  tempo: {
    marginTop: 2,
    fontSize: 12,
    color: '#87959A',
  },
  icone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5DF',
  },
  quemReagiu: {
    marginTop: 10,
    fontSize: 13,
    color: '#5F7167',
  },
});
