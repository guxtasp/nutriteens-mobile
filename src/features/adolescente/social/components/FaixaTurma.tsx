// src/features/adolescente/social/components/FaixaTurma.tsx
//
// Cartão "Na sequência hoje" no topo da aba Minha turma: os amigos em círculos, com anel verde e chama em quem
// já manteve a sequência hoje. Só celebra quem manteve; nunca aponta quem faltou.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../../../shared/theme/colors';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { buscarAmigosHoje } from '../services/feedService';
import type { AmigoSocial } from '../services/socialService';
import { turma, sombraCartao } from '../theme/turma';
import { AmigosStrip } from './AmigosStrip';
import SecaoTitulo from './SecaoTitulo';

type Props = {
  amigos: AmigoSocial[];
  refreshToken: number;
  onAbrirAmigo: (amigo: AmigoSocial) => void;
};

export function FaixaTurma({ amigos, refreshToken, onAbrirAmigo }: Props) {
  const [hoje, setHoje] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let vivo = true;
    buscarAmigosHoje().then((r) => { if (vivo) setHoje(r); }).catch(() => undefined);
    return () => { vivo = false; };
  }, [refreshToken, amigos.length]);

  if (amigos.length === 0) return null;
  const qtd = amigos.filter((a) => hoje[a.amizadeId] === true).length;

  return (
    <View style={[estilos.bloco, sombraCartao]}>
      <SecaoTitulo titulo="Na sequência hoje" icone="flame" corIcone={turma.chama} corFundo={turma.chamaFundo} />
      <AppText style={estilos.sub}>
        {qtd === 0
          ? 'O dia está só começando. Bora abrir o caminho!'
          : `${qtd} ${qtd === 1 ? 'amigo já manteve' : 'amigos já mantiveram'} a sequência hoje.`}
      </AppText>
      <AmigosStrip amigos={amigos} mantiveramHoje={hoje} onAbrirAmigo={onAbrirAmigo} margem={14} />
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { marginBottom: 14, padding: 14, borderRadius: turma.raioCartao, backgroundColor: colors.white, borderWidth: 1, borderColor: turma.borda },
  sub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: turma.textoSuave, marginTop: -4, marginBottom: 12 },
});
