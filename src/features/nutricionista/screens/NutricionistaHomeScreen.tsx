// src/features/nutricionista/screens/NutricionistaHomeScreen.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

const ITENS = [
  { rota: 'ParticipantesList', label: 'Participantes' },
  { rota: 'ConteudoList', label: 'Conteúdo educativo' },
];

export default function NutricionistaHomeScreen({ navigation }: any) {
  return (
    <View style={styles.root}>
      <AppText style={styles.titulo}>Painel da nutricionista</AppText>
      {ITENS.map((item) => (
        <Pressable key={item.rota} style={styles.item} onPress={() => navigation.navigate(item.rota)}>
          <AppText style={styles.itemTexto}>{item.label}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, padding: 24, paddingTop: 60 },
  titulo: { fontFamily: typography.bold, fontSize: 22, color: colors.primaryDark, marginBottom: 24 },
  item: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 12, padding: 16, marginBottom: 12 },
  itemTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
});