// src/features/adolescente/home/components/AvatarFesta.tsx
//
// O avatar do usuário (a pose do Bróxis que ele escolheu no Social) em clima de festa: círculo
// com brilho em volta e chapéu de festa por cima. Não é foto nem dado pessoal. Estático, para
// aparecer na imagem exportada.
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { poseDoAvatar } from '../../social/utils/amizade';
import { posicaoChapeu } from '../utils/posicaoChapeu';

type Props = {
  /** chave do avatar (profiles.avatar_social); vazia/antiga cai na pose padrão */
  avatar: string | null | undefined;
  diametro: number;
};

export default function AvatarFesta({ avatar, diametro }: Props) {
  const chapeu = posicaoChapeu(diametro);
  const halo = Math.round(diametro * 0.12);

  return (
    <View
      style={{ width: diametro, height: diametro }}
      accessible
      accessibilityLabel="Seu avatar de chapéu de festa"
    >
      <View
        pointerEvents="none"
        style={[styles.halo, { top: -halo, left: -halo, right: -halo, bottom: -halo, borderRadius: (diametro + halo * 2) / 2 }]}
      />
      <View style={[styles.circulo, { width: diametro, height: diametro, borderRadius: diametro / 2 }]}>
        <BroxisMascot pose={poseDoAvatar(avatar)} size={diametro} entrance="nenhuma" showParticles={false} />
      </View>
      <Image
        source={require('../../../../../assets/img/aniversario/chapeu-festa.png')}
        style={{
          position: 'absolute',
          width: chapeu.largura,
          height: chapeu.largura,
          left: chapeu.esquerda,
          top: chapeu.topo,
          transform: [{ rotate: `${chapeu.giroGraus}deg` }],
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute', backgroundColor: 'rgba(255,243,196,0.28)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
  circulo: {
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E6F4D5', borderWidth: 4, borderColor: '#FFFFFF',
  },
});
