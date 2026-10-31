// src/features/adolescente/social/components/SecaoTitulo.tsx
//
// Título de seção da aba Turma: selo colorido com ícone, título, contador opcional e algo à direita.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  corIcone?: string;
  corFundo?: string;
  contador?: number;
  direita?: React.ReactNode;
};

export default function SecaoTitulo({ titulo, icone, corIcone = colors.primaryDark, corFundo = '#E3F2D3', contador, direita }: Props) {
  return (
    <View style={estilos.linha}>
      <View style={[estilos.selo, { backgroundColor: corFundo }]}>
        <Ionicons name={icone} size={17} color={corIcone} />
      </View>
      <AppText style={estilos.titulo}>{titulo}</AppText>
      {contador !== undefined && (
        <View style={estilos.contador}><AppText style={estilos.contadorTexto}>{contador}</AppText></View>
      )}
      {!!direita && <View style={{ marginLeft: 'auto' }}>{direita}</View>}
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 10 },
  selo: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  contador: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
});
