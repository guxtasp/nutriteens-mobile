// src/features/adolescente/social/components/CabecalhoTela.tsx
//
// Cabeçalho único das telas da Turma (Desafio e Jardim): botão de voltar redondo + título centralizado.
// Antes cada tela repetia o mesmo bloco; agora lista, detalhe e criação ficam iguais.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = { titulo: string; aoVoltar: () => void };

export default function CabecalhoTela({ titulo, aoVoltar }: Props) {
  return (
    <View style={estilos.header}>
      <Pressable onPress={aoVoltar} style={estilos.voltar} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
        <Ionicons name="arrow-back" size={22} color={colors.primaryDark} />
      </Pressable>
      <AppText style={estilos.titulo} numberOfLines={1}>{titulo}</AppText>
      <View style={{ width: 40 }} />
    </View>
  );
}

const estilos = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  voltar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: '#E4E9E6' },
  titulo: { flex: 1, textAlign: 'center', fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
});
