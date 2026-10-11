// Espaço da ilustração dos cartões (no protótipo é o quadrado com X).
// Troque o ícone por <Image source={...} /> quando as artes ficarem prontas.
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Props = { icone: string; tamanho?: number; style?: StyleProp<ViewStyle> };

export default function Ilustracao({ icone, tamanho = 44, style }: Props) {
  return (
    <View style={[styles.caixa, style]}>
      <MaterialCommunityIcons name={icone as any} size={tamanho} color="#8BC34A" />
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { backgroundColor: '#F0F5F1', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
