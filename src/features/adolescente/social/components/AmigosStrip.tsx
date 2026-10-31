// src/features/adolescente/social/components/AmigosStrip.tsx
//
// Faixa horizontal de amigos (estilo "stories"). Quem já manteve a sequência hoje ganha anel verde e uma chama;
// quem não manteve fica com anel neutro, sem nenhum aviso. Tocar abre o perfil do amigo.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { AmigoSocial } from '../services/socialService';
import { turma } from '../theme/turma';
import { AvatarSocialView } from './AvatarSocialView';

type Props = {
  amigos: AmigoSocial[];
  /** amizadeId -> manteve a sequência hoje */
  mantiveramHoje: Record<string, boolean>;
  onAbrirAmigo: (amigo: AmigoSocial) => void;
  /** margem lateral da tela/cartão onde a faixa está, para ela rolar até a borda (padrão 20) */
  margem?: number;
};

export function AmigosStrip({ amigos, mantiveramHoje, onAbrirAmigo, margem = 20 }: Props) {
  if (amigos.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.conteudo, { paddingHorizontal: margem }]} style={{ marginHorizontal: -margem, marginBottom: 14 }}>
      {amigos.map((amigo) => {
        const ativo = mantiveramHoje[amigo.amizadeId] === true;
        return (
          <Pressable
            key={amigo.amizadeId}
            onPress={() => onAbrirAmigo(amigo)}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Ver perfil de ${amigo.apelido}${ativo ? ', manteve a sequência hoje' : ''}`}
          >
            <View>
              {ativo ? (
                <LinearGradient colors={[colors.primary, '#4FB36A']} style={styles.anel}>
                  <View style={styles.miolo}><AvatarSocialView avatar={amigo.avatar} size="small" /></View>
                </LinearGradient>
              ) : (
                <View style={[styles.anel, styles.anelNeutro]}>
                  <View style={styles.miolo}><AvatarSocialView avatar={amigo.avatar} size="small" /></View>
                </View>
              )}
              {ativo && (
                <View style={styles.chama}><Ionicons name="flame" size={12} color={colors.white} /></View>
              )}
            </View>
            <AppText style={styles.nome} numberOfLines={1}>{amigo.apelido}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { paddingVertical: 2, gap: 12 },
  item: { width: 64, alignItems: 'center' },
  anel: { width: 58, height: 58, borderRadius: 29, padding: 3, alignItems: 'center', justifyContent: 'center' },
  anelNeutro: { backgroundColor: '#E1E8E3' },
  miolo: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 0 },
  chama: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: turma.chama, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  nome: { marginTop: 6, fontFamily: typography.semiBold, fontSize: 12, color: '#4A5D53', maxWidth: 64 },
});
