// src/features/adolescente/social/components/DesafioResumoCard.tsx
//
// Cartão COMPACTO de um desafio na lista (o desafio inteiro abre no detalhe). Mostra só o essencial:
// hábito, tempo que falta, o progresso numa linha e quem já cumpriu hoje. Toda a conversa fica no detalhe.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { AvatarSocialView } from './AvatarSocialView';
import { ATIVIDADE, MEDALHA } from '../theme/turma';
import {
  DIAS_DESAFIO, METRICAS_DESAFIO, ativosDoDesafio, diasRestantes, jaAcabou, marcoAtingido, nomeDaMetrica, type DesafioGrupo, type MarcoDesafio,
} from '../utils/desafioGrupo';

const ROXO = ATIVIDADE.desafio.cor;
const COR_MARCO: Record<MarcoDesafio, string> = { NENHUM: '#D5DCD8', BRONZE: MEDALHA[3].cor, PRATA: MEDALHA[2].cor, OURO: MEDALHA[1].cor };

type Props = { d: DesafioGrupo; hoje: string; aoAbrir: () => void };

export default function DesafioResumoCard({ d, hoje, aoAbrir }: Props) {
  const ativos = ativosDoDesafio(d);
  const eu = ativos.find((m) => m.eu);
  const acabou = jaAcabou(d, hoje);
  const resta = diasRestantes(d.fim, hoje);
  const marco = marcoAtingido(d.totalDias, ativos.length);
  const equipe = d.modo !== 'PODIO';
  const maximo = Math.max(1, ativos.length * DIAS_DESAFIO);
  const fracao = equipe ? Math.min(1, d.totalDias / maximo) : Math.min(1, d.meusDias.length / DIAS_DESAFIO);
  const falta = !acabou && !!eu && !eu.fezHoje;

  const tempo = acabou ? 'Acabou' : resta <= 0 ? 'Último dia' : `${resta} ${resta === 1 ? 'dia' : 'dias'}`;
  const linhaProgresso = equipe
    ? `Turma: ${d.totalDias} ${d.totalDias === 1 ? 'dia' : 'dias'} · ${marco === 'NENHUM' ? 'a caminho do bronze' : `medalha de ${marco === 'BRONZE' ? 'bronze' : marco === 'PRATA' ? 'prata' : 'ouro'}`}`
    : `Você: ${d.meusDias.length} de ${DIAS_DESAFIO} dias`;

  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      accessibilityLabel={`${nomeDaMetrica(d.metrica)}, ${equipe ? 'em equipe' : 'com pódio'}, ${tempo}. ${linhaProgresso}. ${falta ? 'Falta cumprir hoje.' : ''} Toque para abrir.`}
      style={({ pressed }) => [estilos.cartao, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
    >
      <View style={estilos.topo}>
        <View style={estilos.icone}><Ionicons name={(METRICAS_DESAFIO.find((m) => m.metrica === d.metrica)?.icone ?? 'flag') as any} size={22} color={colors.white} /></View>
        <View style={{ flex: 1 }}>
          <AppText style={estilos.titulo} numberOfLines={1}>{nomeDaMetrica(d.metrica)}</AppText>
          <View style={estilos.modoLinha}>
            <Ionicons name={equipe ? 'people' : 'trophy'} size={13} color="#6B7B74" />
            <AppText style={estilos.modo}>{equipe ? 'Em equipe' : 'Com pódio'}</AppText>
          </View>
        </View>
        <View style={[estilos.chipTempo, acabou && { backgroundColor: '#E8F3DC' }]}>
          <AppText style={estilos.chipTempoTexto}>{tempo}</AppText>
        </View>
      </View>

      <View style={estilos.trilho}>
        <View style={[estilos.cheio, { width: `${Math.max(3, Math.round(fracao * 100))}%`, backgroundColor: equipe && marco !== 'NENHUM' ? COR_MARCO[marco] : ROXO }]} />
      </View>
      <AppText style={estilos.progresso}>{linhaProgresso}</AppText>

      <View style={estilos.rodape}>
        <View style={estilos.avatares}>
          {ativos.slice(0, 4).map((m, i) => (
            <View key={m.apelido + (m.eu ? 'eu' : '')} style={[estilos.avatarBox, i > 0 && { marginLeft: -10 }]}>
              <AvatarSocialView avatar={m.avatar} size="small" />
              {m.fezHoje && <View style={estilos.check}><Ionicons name="checkmark" size={10} color={colors.white} /></View>}
            </View>
          ))}
          {ativos.length > 4 && <AppText style={estilos.mais}>+{ativos.length - 4}</AppText>}
        </View>
        {falta ? (
          <View style={estilos.pilulaFalta}><AppText style={estilos.pilulaFaltaTexto}>Cumpra hoje</AppText></View>
        ) : !acabou && eu?.fezHoje ? (
          <View style={estilos.pilulaOk}><Ionicons name="checkmark" size={14} color={colors.primaryDark} /><AppText style={estilos.pilulaOkTexto}>Hoje feito</AppText></View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9AA5A0" />
        )}
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 2, borderBottomWidth: 4, borderColor: '#E4E9E6', padding: 14, gap: 10 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icone: { width: 44, height: 44, borderRadius: 22, backgroundColor: ROXO, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  modoLinha: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  modo: { fontFamily: typography.regular, fontSize: 12.5, color: '#6B7B74' },
  chipTempo: { paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: ATIVIDADE.desafio.fundo, alignItems: 'center', justifyContent: 'center' },
  chipTempoTexto: { fontFamily: typography.bold, fontSize: 12, color: ROXO },
  trilho: { height: 10, borderRadius: 5, backgroundColor: '#EEF2EF', overflow: 'hidden' },
  cheio: { height: 10, borderRadius: 5 },
  progresso: { fontFamily: typography.semiBold, fontSize: 12.5, color: '#4B5B54' },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatares: { flexDirection: 'row', alignItems: 'center' },
  mais: { fontFamily: typography.bold, fontSize: 12, color: '#5A6B64', marginLeft: 6 },
  avatarBox: { width: 42, height: 42 },
  check: { position: 'absolute', right: -3, bottom: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#3E8E2F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
  pilulaFalta: { paddingHorizontal: 12, height: 30, borderRadius: 15, backgroundColor: ROXO, alignItems: 'center', justifyContent: 'center' },
  pilulaFaltaTexto: { fontFamily: typography.bold, fontSize: 12.5, color: colors.white },
  pilulaOk: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 30, borderRadius: 15, backgroundColor: '#EAF5DD' },
  pilulaOkTexto: { fontFamily: typography.bold, fontSize: 12.5, color: colors.primaryDark },
});
