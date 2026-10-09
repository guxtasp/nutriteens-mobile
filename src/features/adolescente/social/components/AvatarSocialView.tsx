// src/features/adolescente/social/components/AvatarSocialView.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { avatarSocialValido, poseDoAvatar } from '../utils/amizade';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';

export type TamanhoAvatarSocial = 'small' | 'medium' | 'large' | 'xlarge';

const TAMANHOS: Record<TamanhoAvatarSocial, number> = {
  small: 42,
  medium: 64,
  large: 82,
  xlarge: 120,
};

/**
 * O banco guarda apenas a chave do avatar ("supercontente", "curioso", etc.).
 * `poseDoAvatar` traduz a chave para a pose do Broxis, que é desenhada
 * dentro de um círculo. Sem avatar válido, aparece um placeholder.
 */
export function AvatarSocialView({
  avatar,
  size = 'medium',
}: {
  avatar: string | null | undefined;
  size?: TamanhoAvatarSocial;
}) {
  const diameter = TAMANHOS[size];

  // Chave vazia ou de um avatar que não existe mais (ex.: "aceno"):
  // mostra um placeholder neutro até a pessoa escolher outro.
  const valido = avatarSocialValido(avatar);

  return (
    <View
      style={[
        styles.avatar,
        !valido && styles.avatarPlaceholder,
        { width: diameter, height: diameter, borderRadius: diameter / 2 },
      ]}
    >
      {valido ? (
        <BroxisMascot pose={poseDoAvatar(avatar)} size={diameter} entrance="nenhuma" showParticles={false} />
      ) : (
        <Ionicons name="person" size={Math.round(diameter * 0.5)} color="#9DB08C" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E6F4D5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    backgroundColor: '#EEF3EA',
  },
});
