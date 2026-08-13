// src/features/adolescente/components/HomeHeader.tsx
import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { useSaudacao } from '../hooks/useSaudacao';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'Home'>;
type Props = { 
  nome: string; 
  pontos: number; 
  sequenciaAtual: number; 
  onAbrirPerfil?: () => void 
};

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
        {sequenciaAtual > 0 && (
          <View style={[styles.pontosPill, styles.sequenciaPill]}>
            <Ionicons name="flame" size={20} color="#EA580C" />
            <AppText style={[styles.pontosTexto, styles.sequenciaTexto]}>{sequenciaAtual}</AppText>
          </View>
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
    gap: 2,
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
  sequenciaPill: {
    borderColor: '#EA580C',
  },
  sequenciaTexto: {
    color: '#EA580C',
  },
  perfilBotao: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});