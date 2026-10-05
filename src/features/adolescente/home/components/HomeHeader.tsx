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
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

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

  const handleAbrirPerfil = useCallback(() => {
    if (onAbrirPerfil) {
      onAbrirPerfil();
    } else {
      navigation.navigate('Profile');
    }
  }, [onAbrirPerfil, navigation]);

  return (
    <View style={styles.linha}>
      <View style={styles.esquerda}>
        <AppText style={styles.saudacao}>
          Olá, {nome}.
        </AppText>
        <AppText style={styles.pergunta}>
          {saudacao}
        </AppText>
      </View>

      <View style={styles.direita}>
        {/* XP: sempre visível, mesmo em 0 — é um contador persistente, diferente da sequência */}
        <EstatisticaPill
          icone={<MaterialCommunityIcons name="gift" size={18} color={COR_XP} />}
          valor={pontos}
          sufixo="XP"
          cor={COR_XP}
        />

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

        <Pressable 
          onPress={handleAbrirPerfil} 
          style={styles.perfilBotao}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
        >
          <Ionicons
            name="person-circle-outline"
            size={35}
            color={colors.primaryDark}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: layout.margemH,
    paddingTop: layout.cabecalhoPaddingTop,
    paddingBottom: layout.cabecalhoPaddingBottom,
  },
  esquerda: {
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  saudacao: {
    fontFamily: typography.bold,
    fontSize: 24,
    color: colors.primaryDark,
    lineHeight: 26,
  },
  pergunta: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.primary ?? '#3FA85C',
    marginTop: 4,
  },
  direita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  perfilBotao: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
