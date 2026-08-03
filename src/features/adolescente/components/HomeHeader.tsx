// src/features/adolescente/components/HomeHeader.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { useSaudacao } from '../hooks/useSaudacao';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'Home'>;
type Props = { nome: string; pontos: number; onAbrirPerfil?: () => void };

export default function HomeHeader({ nome, pontos, onAbrirPerfil }: Props) {
  const saudacao = useSaudacao();
  const navigation = useNavigation<NavigationProp>();
  function irParaPerfil() {
    navigation.navigate('Profile');
  }
  return (
    <View style={styles.linha}>
      <View style={styles.esquerda}>
        <AppText style={styles.saudacao} numberOfLines={1} ellipsizeMode="tail">
          Olá, {nome}.
        </AppText>
        <AppText style={styles.pergunta} numberOfLines={1} ellipsizeMode="tail">
          {saudacao}
        </AppText>
      </View>

      <View style={styles.direita}>
        <View style={styles.pontosPill}>
          <Ionicons name="water" size={14} color={colors.primaryDark} />
          <AppText style={styles.pontosTexto}>{pontos}</AppText>
        </View>
        <Ionicons
          name="person-circle-outline"
          size={30}
          color={colors.primaryDark}
          onPress={onAbrirPerfil || irParaPerfil}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
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
  },
  pergunta: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.primary ?? '#3FA85C',
    marginTop: 2,
  },
  direita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  pontosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pontosTexto: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: colors.primaryDark,
  },
});