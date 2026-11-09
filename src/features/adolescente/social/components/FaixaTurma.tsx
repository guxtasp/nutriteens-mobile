// src/features/adolescente/social/components/FaixaTurma.tsx
//
// Cartão "Na sequência hoje" no topo da aba Minha turma: os amigos em círculos, com anel verde e chama em quem
// já manteve a sequência hoje (a sequência é o hábito diário do app, a "chama"). Quem já manteve vem primeiro.
// Só celebra quem manteve; nunca aponta quem faltou.
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../../../../shared/theme/colors';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { buscarAmigosHoje } from '../services/feedService';
import type { AmigoSocial } from '../services/socialService';
import { turma, sombraCartao, HOJE } from '../theme/turma';
import { AmigosStrip } from './AmigosStrip';
import SecaoTitulo from './SecaoTitulo';

type Props = {
  amigos: AmigoSocial[];
  refreshToken: number;
  onAbrirAmigo: (amigo: AmigoSocial) => void;
  /** abre a lista completa ("Sua turma"); sem isso o link não aparece */
  onVerTodos?: () => void;
};

export function FaixaTurma({ amigos, refreshToken, onAbrirAmigo, onVerTodos }: Props) {
  const [hoje, setHoje] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let vivo = true;
    buscarAmigosHoje().then((r) => { if (vivo) setHoje(r); }).catch(() => undefined);
    return () => { vivo = false; };
  }, [refreshToken, amigos.length]);

  if (amigos.length === 0) return null;
  const qtd = amigos.filter((a) => hoje[a.amizadeId] === true).length;
  // Quem já manteve a sequência hoje vai para o começo da faixa (a ordem original se mantém dentro de cada grupo).
  const ordenados = [...amigos].sort((a, b) => Number(hoje[b.amizadeId] === true) - Number(hoje[a.amizadeId] === true));

  return (
    <View style={[estilos.bloco, sombraCartao]}>
      <SecaoTitulo titulo={HOJE.titulo} icone="flame" corIcone={turma.chama} corFundo={turma.chamaFundo}
        direita={onVerTodos ? (
          <Pressable onPress={onVerTodos} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Ver todos os ${amigos.length} amigos`}>
            <AppText style={estilos.verTodos}>Ver todos ({amigos.length.toLocaleString('pt-BR')})</AppText>
          </Pressable>
        ) : undefined}
      />
      <AppText style={estilos.sub}>
        {qtd === 0
          ? 'Ninguém da turma cumpriu o dia ainda. Bora abrir o caminho!'
          : `${qtd} de ${amigos.length} ${qtd === 1 ? 'amigo já cumpriu' : 'amigos já cumpriram'} o dia hoje.`}
      </AppText>
      <AmigosStrip amigos={ordenados.slice(0, 12)} mantiveramHoje={hoje} onAbrirAmigo={onAbrirAmigo} margem={14} />
      <AppText style={estilos.legenda}>{HOJE.explicacao}</AppText>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { marginBottom: 14, padding: 14, borderRadius: turma.raioCartao, backgroundColor: colors.white, borderWidth: 1, borderColor: turma.borda },
  verTodos: { fontFamily: typography.bold, fontSize: 13, color: '#2F7A3E' },
  legenda: { fontFamily: typography.regular, fontSize: 12, lineHeight: 16, color: turma.textoSuave, marginTop: -4 },
  sub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: turma.textoSuave, marginTop: -4, marginBottom: 12 },
});
