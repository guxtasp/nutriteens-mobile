// src/features/adolescente/social/components/DesafioGrupoEntradaCard.tsx
//
// Cartão da aba Turma que leva ao Desafio em grupo. Mostra o desafio em andamento (barra da turma e se você já
// cumpriu hoje); sem desafio, convida a montar a turma. Só celebra: nunca cobra quem não cumpriu.
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { formatarDataISO } from '../../../../shared/utils/data';
import { listarDesafios } from '../services/desafioGrupoService';
import { ATIVIDADE } from '../theme/turma';
import { ativosDoDesafio, diasRestantes, jaAcabou, marcoAtingido, nomeDaMetrica, type DesafioGrupo } from '../utils/desafioGrupo';

type Props = { onPress: () => void };

export default function DesafioGrupoEntradaCard({ onPress }: Props) {
  const [desafios, setDesafios] = useState<DesafioGrupo[] | null>(null);

  useFocusEffect(useCallback(() => {
    let vivo = true;
    listarDesafios().then((d) => { if (vivo) setDesafios(d); }).catch(() => { if (vivo) setDesafios(null); });
    return () => { vivo = false; };
  }, []));

  const hoje = formatarDataISO(new Date());
  const lista = desafios ?? [];
  const andamento = lista.find((d) => d.situacao === 'ativo' && !jaAcabou(d, hoje)) ?? null;
  const acabado = lista.find((d) => d.situacao === 'ativo' && jaAcabou(d, hoje)) ?? null;
  const convites = lista.filter((d) => d.situacao === 'convidado').length;

  let titulo = 'Desafio em grupo';
  let sub = 'Cumpram um hábito juntos por 7 dias, cada um na sua meta.';
  let acao = 'COMEÇAR';
  if (andamento) {
    const ativos = ativosDoDesafio(andamento);
    const eu = ativos.find((m) => m.eu);
    const marco = marcoAtingido(andamento.totalDias, ativos.length);
    const resta = diasRestantes(andamento.fim, hoje);
    titulo = `${nomeDaMetrica(andamento.metrica)} · ${eu?.fezHoje ? 'hoje já foi' : 'falta o seu dia'}`;
    sub = `${ativos.length} ${ativos.length === 1 ? 'pessoa' : 'pessoas'} · ${resta <= 0 ? 'último dia' : `${resta} ${resta === 1 ? 'dia' : 'dias'} para o fim`}${andamento.modo === 'PODIO' ? ' · com pódio' : ''}${marco !== 'NENHUM' ? ` · ${marco.toLowerCase()}` : ''}`;
    acao = eu?.fezHoje ? 'ABRIR' : 'CUMPRIR';
  } else if (convites > 0) {
    titulo = convites === 1 ? 'Você tem um convite de desafio' : `Você tem ${convites} convites de desafio`;
    sub = 'Toque para ver e entrar.';
    acao = 'VER';
  } else if (acabado) {
    titulo = 'O desafio acabou!';
    sub = 'Veja como a turma foi e jogue de novo com um toque.';
    acao = 'VER';
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${sub}`}
      style={({ pressed }) => [estilos.pressable, pressed && { transform: [{ translateY: 2 }] }]}
    >
      <LinearGradient colors={['#E6DDFB', ATIVIDADE.desafio.fundo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={estilos.cartao}>
        <View style={estilos.icone}><Ionicons name="trophy" size={30} color={colors.white} /></View>
        <View style={estilos.textos}>
          <AppText style={estilos.rotulo}>DESAFIO EM GRUPO</AppText>
          <AppText style={estilos.titulo} numberOfLines={2}>{titulo}</AppText>
          <AppText style={estilos.sub} numberOfLines={2}>{sub}</AppText>
        </View>
        <View style={estilos.pilula}>
          <AppText style={estilos.pilulaTexto}>{acao}</AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.primaryDark} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pressable: { marginBottom: 14, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#E4E9E6' },
  cartao: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 92, borderRadius: 22 },
  icone: { width: 56, height: 56, borderRadius: 28, backgroundColor: ATIVIDADE.desafio.cor, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 1 },
  rotulo: { fontFamily: typography.bold, fontSize: 10.5, letterSpacing: 0.8, color: '#5A6B64' },
  titulo: { fontFamily: typography.bold, fontSize: 15.5, lineHeight: 20, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 12.5, lineHeight: 17, color: '#4B5B54' },
  pilula: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 34, paddingLeft: 12, paddingRight: 8, borderRadius: 17, backgroundColor: colors.primary, borderBottomWidth: 3, borderBottomColor: colors.primaryShadow },
  pilulaTexto: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.4, color: colors.primaryDark },
});
