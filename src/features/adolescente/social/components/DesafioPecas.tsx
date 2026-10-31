// src/features/adolescente/social/components/DesafioPecas.tsx
//
// Peças pequenas do Desafio em grupo usadas pela lista, pelo detalhe e pela criação.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { formatarDataISO } from '../../../../shared/utils/data';
import { ehErroRestricaoSocial } from '../utils/moderacao';
import { AvatarSocialView } from './AvatarSocialView';
import { ATIVIDADE } from '../theme/turma';
import { DIAS_DESAFIO, MAX_DESAFIOS_ATIVOS, ehErroLimiteDesafio, type DesafioGrupo, type MembroDesafio, type MetricaDesafio } from '../utils/desafioGrupo';

export const ROXO = ATIVIDADE.desafio.cor;

export const ROTA_REGISTRO: Record<MetricaDesafio, 'ConsumoAgua' | 'AtividadeFisica' | 'TipoRefeicao'> = {
  AGUA: 'ConsumoAgua', ATIVIDADE: 'AtividadeFisica', PASSOS: 'AtividadeFisica', REGISTRO: 'TipoRefeicao',
};

export function mensagemErroDesafio(e: unknown): string {
  if (ehErroRestricaoSocial(e)) return 'Seu espaço de amigos está em pausa por enquanto. Seus hábitos continuam contando nos desafios que você já faz.';
  if (ehErroLimiteDesafio(e)) return `Você já está em ${MAX_DESAFIOS_ATIVOS} desafios. Termine ou saia de um para criar outro.`;
  return 'Algo deu errado. Tente de novo daqui a pouco.';
}

export function diasDoDesafio(inicio: string): string[] {
  const base = new Date(`${inicio}T00:00:00`);
  return Array.from({ length: DIAS_DESAFIO }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return formatarDataISO(d);
  });
}

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const letraDoDia = (iso: string) => LETRAS[new Date(`${iso}T00:00:00`).getDay()];

/** "Sua semana": os 7 dias do desafio com o que VOCÊ cumpriu. */
export function FaixaDias({ d, hoje }: { d: DesafioGrupo; hoje: string }) {
  const feitos = new Set(d.meusDias);
  return (
    <View style={estilos.faixa}>
      {diasDoDesafio(d.inicio).map((iso) => {
        const feito = feitos.has(iso);
        const ehHoje = iso === hoje;
        const futuro = iso > hoje;
        return (
          <View key={iso} style={estilos.diaCol} accessible accessibilityLabel={`${iso}${feito ? ', cumprido' : ehHoje ? ', hoje' : ''}`}>
            <View style={[estilos.diaBolinha, feito && { backgroundColor: colors.primary, borderColor: colors.primary }, ehHoje && !feito && { borderColor: ROXO, borderWidth: 2 }, futuro && { opacity: 0.45 }]}>
              {feito && <Ionicons name="checkmark" size={16} color={colors.primaryDark} />}
            </View>
            <AppText style={[estilos.diaLetra, ehHoje && { color: ROXO }]}>{letraDoDia(iso)}</AppText>
          </View>
        );
      })}
    </View>
  );
}

/** Avatares da turma; quem cumpriu hoje ganha o selinho verde. Nunca aponta quem não cumpriu. */
export function MembrosHoje({ membros, tamanho = 'small' }: { membros: MembroDesafio[]; tamanho?: 'small' }) {
  return (
    <View style={estilos.membros}>
      {membros.map((m) => (
        <View key={m.apelido + (m.eu ? 'eu' : '')} style={[estilos.membro, m.pendente && { opacity: 0.5 }]} accessible accessibilityLabel={`${m.eu ? 'Você' : m.apelido}${m.pendente ? ', convite enviado' : m.fezHoje ? ', cumpriu hoje' : ''}`}>
          <View>
            <AvatarSocialView avatar={m.avatar} size={tamanho} />
            {m.fezHoje && !m.pendente && <View style={estilos.check}><Ionicons name="checkmark" size={12} color={colors.white} /></View>}
          </View>
          <AppText style={estilos.nomeMembro} numberOfLines={1}>{m.eu ? 'Você' : m.apelido}</AppText>
          {m.pendente && <AppText style={estilos.miudo}>convidado</AppText>}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: { flexDirection: 'row', justifyContent: 'space-between' },
  diaCol: { alignItems: 'center', gap: 4 },
  diaBolinha: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#D5DCD8', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  diaLetra: { fontFamily: typography.bold, fontSize: 11, color: '#8A9A92' },
  membros: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  membro: { alignItems: 'center', gap: 3, width: 58 },
  nomeMembro: { fontFamily: typography.regular, fontSize: 11.5, color: '#4B5B54', maxWidth: 58 },
  miudo: { fontFamily: typography.regular, fontSize: 11, color: '#6B7B74' },
  check: { position: 'absolute', right: -4, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#3E8E2F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
});
