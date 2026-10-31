// src/features/adolescente/social/components/FeedCard.tsx
//
// Card de uma novidade no feed: avatar, "apelido + o que fez", quando, selo colorido do tipo de novidade e as
// reações prontas. Tocar no autor abre o perfil do amigo.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { COR_EVENTO, sombraCartao, turma } from '../theme/turma';
import { AvatarSocialView } from './AvatarSocialView';
import { ReacoesBar, VISUAL_REACAO } from './ReacoesBar';
import { REACAO_INFO, iconeEvento, tempoRelativo, textoEvento, type EventoFeed, type Reacao } from '../utils/feed';

type Props = {
  evento: EventoFeed;
  onReagir: (evento: EventoFeed, reacao: Reacao) => void;
  onAbrirAutor: (evento: EventoFeed) => void;
  reagindo?: boolean;
};

export function FeedCard({ evento, onReagir, onAbrirAutor, reagindo = false }: Props) {
  const podeAbrir = !evento.ehMeu && !!evento.amizadeId;
  const cor = COR_EVENTO[evento.tipo];

  return (
    <View style={[styles.card, sombraCartao]}>
      <View style={styles.topo}>
        <Pressable
          disabled={!podeAbrir}
          onPress={() => onAbrirAutor(evento)}
          accessibilityRole={podeAbrir ? 'button' : undefined}
          accessibilityLabel={podeAbrir ? `Ver perfil de ${evento.apelido}` : undefined}
        >
          <AvatarSocialView avatar={evento.avatar} size="small" />
        </Pressable>

        <View style={styles.info}>
          <AppText style={styles.frase}>
            <AppText style={styles.autor}>{evento.ehMeu ? 'Você' : evento.apelido}</AppText> {textoEvento(evento)}
          </AppText>
          <AppText style={styles.tempo}>{tempoRelativo(evento.criadoEm)}</AppText>
        </View>

        <View style={[styles.selo, { backgroundColor: cor.fundo }]}>
          <Ionicons name={iconeEvento(evento.tipo) as any} size={20} color={cor.icone} />
        </View>
      </View>

      <ReacoesBar evento={evento} desabilitado={reagindo} onReagir={onReagir} />

      {evento.ehMeu && evento.quemReagiu.length > 0 && (
        <View style={styles.quemReagiu}>
          {evento.quemReagiu.map((r, i) => (
            <View key={`${r.apelido}-${i}`} style={styles.quemItem}>
              <Ionicons name={VISUAL_REACAO[r.reacao].icone} size={13} color={VISUAL_REACAO[r.reacao].cor} />
              <AppText style={styles.quemTexto} accessibilityLabel={`${r.apelido}: ${REACAO_INFO[r.reacao].rotulo}`}>{r.apelido}</AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: turma.raioCartao, borderWidth: 1, borderColor: turma.borda, padding: 14, marginBottom: 12 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1 },
  frase: { fontFamily: typography.regular, fontSize: 15, lineHeight: 21, color: '#26382F' },
  autor: { fontFamily: typography.bold, color: colors.primaryDark },
  tempo: { marginTop: 2, fontFamily: typography.regular, fontSize: 12, color: turma.textoMudo },
  selo: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quemReagiu: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  quemItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quemTexto: { fontFamily: typography.semiBold, fontSize: 12.5, color: '#5F7167' },
});
