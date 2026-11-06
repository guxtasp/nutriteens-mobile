// src/features/adolescente/components/HomeHeader.tsx
import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { layout } from '../../../../shared/theme/layout';
import { useSaudacao } from '../hooks/useSaudacao';
import EstatisticaPill from './EstatisticaPill';
import ChipSemInternet from './ChipSemInternet';
import { SinoNotificacoes } from '../../notificacoes/components/SinoNotificacoes';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTourAlvo } from '../../tour/TourContext';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'Home'>;
type Props = { 
  nome: string; 
  pontos: number; 
  sequenciaAtual: number; 
  onAbrirPerfil?: () => void 
};

const COR_XP = colors.primary ?? '#3FA85C';
const COR_SEQUENCIA = '#EA580C';

export default function HomeHeader({ nome, pontos, sequenciaAtual, onAbrirPerfil }: Props) {
  const saudacao = useSaudacao();
  const navigation = useNavigation<NavigationProp>();
  const refPerfil = useTourAlvo('perfil');
  const refEstatisticas = useTourAlvo('estatisticas');

  const handleAbrirPerfil = useCallback(() => {
    if (onAbrirPerfil) {
      onAbrirPerfil();
    } else {
      navigation.navigate('Profile');
    }
  }, [onAbrirPerfil, navigation]);

  return (
    <View style={styles.cabecalho}>
      {/* linha 1: saudação inteira (uma linha) + perfil */}
      <View style={styles.linhaSaudacao}>
        <AppText
          style={styles.saudacao}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          Olá, {nome}.
        </AppText>

        <Pressable
          ref={refPerfil}
          collapsable={false}
          onPress={handleAbrirPerfil}
          style={styles.perfilBotao}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
        >
          <Ionicons name="person-circle-outline" size={35} color={colors.primaryDark} />
        </Pressable>
      </View>

      <AppText style={styles.pergunta}>{saudacao}</AppText>

      {/* linha 2: XP, sequência e sino — fora da linha da saudação para não espremê-la */}
      <View ref={refEstatisticas} collapsable={false} style={styles.estatisticas}>
        {/* XP: sempre visível, mesmo em 0 — é um contador persistente, diferente da sequência */}
        <Pressable
          onPress={() => navigation.navigate('ExtratoXp')}
          accessibilityRole="button"
          accessibilityLabel={`${pontos} pontos de experiência. Ver extrato`}
        >
          <EstatisticaPill
            icone={<MaterialCommunityIcons name="gift" size={18} color={COR_XP} />}
            valor={pontos}
            sufixo="XP"
            cor={COR_XP}
          />
        </Pressable>

        {sequenciaAtual > 0 && (
          <Pressable
            onPress={() => navigation.navigate('Sequencia')}
            accessibilityRole="button"
            accessibilityLabel="Ver sequência"
          >
            <EstatisticaPill
              icone={<Ionicons name="flame" size={20} color={COR_SEQUENCIA} />}
              valor={sequenciaAtual}
              cor={COR_SEQUENCIA}
            />
          </Pressable>
        )}

        <ChipSemInternet />

        <SinoNotificacoes />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    paddingHorizontal: layout.margemH,
    paddingTop: layout.cabecalhoPaddingTop,
    paddingBottom: layout.cabecalhoPaddingBottom,
  },
  linhaSaudacao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  saudacao: {
    flex: 1,
    fontFamily: typography.bold,
    fontSize: 24,
    color: colors.primaryDark,
    lineHeight: 30,
  },
  pergunta: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.primary ?? '#3FA85C',
    marginTop: 2,
  },
  estatisticas: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    // encolhe à largura das pílulas: o destaque do tour não pega a linha toda
    alignSelf: 'flex-start',
  },
  perfilBotao: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
