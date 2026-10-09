// src/features/adolescente/notificacoes/components/SinoNotificacoes.tsx
//
// Sino do cabeçalho, no mesmo estilo das pílulas de XP e sequência (borda
// colorida, cantos arredondados). Bolinha vermelha quando há notificação não lida.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { colors } from '../../../../shared/theme/colors';
import { useNotificacoesApp } from '../hooks/useNotificacoesApp';

const COR_SINO = colors.primaryDark;

export function SinoNotificacoes() {
  const navigation = useNavigation<NativeStackNavigationProp<AdolescenteStackParamList>>();
  const { naoLidas } = useNotificacoesApp();

  return (
    <Pressable
      onPress={() => navigation.navigate('Notificacoes')}
      accessibilityRole="button"
      accessibilityLabel={naoLidas > 0 ? 'Notificações, há novas' : 'Notificações'}
    >
      <View style={styles.pill}>
        <Ionicons name={naoLidas > 0 ? 'notifications' : 'notifications-outline'} size={20} color={COR_SINO} />
        {naoLidas > 0 && <View style={styles.bolinha} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // mesmas medidas do EstatisticaPill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COR_SINO,
    borderRadius: 14,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  bolinha: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
});
