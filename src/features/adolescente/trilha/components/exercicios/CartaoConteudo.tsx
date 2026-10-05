// src/features/adolescente/trilha/components/exercicios/CartaoConteudo.tsx
//
// Passo de ENSINO (sem resposta, sem nota): título + texto curto, com o
// Broxis falando. Convenção de dados: enunciado = título;
// dados_extra.texto = corpo (até ~40 palavras, uma ideia só).
//
// Animação: o balão do Broxis aparece primeiro (ver MascoteFala); depois o
// título e o texto surgem um de cada vez, pra dar ritmo de leitura.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import MascoteFala from './MascoteFala';

type Props = { titulo: string; texto?: string | null };

export default function CartaoConteudo({ titulo, texto }: Props) {
  return (
    <MascoteFala>
      <View style={styles.bloco}>
        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 280 }}
        >
          <AppText style={styles.titulo}>{titulo}</AppText>
        </MotiView>
        {!!texto && (
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300, delay: 480 }}
          >
            <AppText style={styles.texto}>{texto}</AppText>
          </MotiView>
        )}
      </View>
    </MascoteFala>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: 8 },
  titulo: { fontFamily: typography.bold, fontSize: 15, lineHeight: 21, color: colors.primaryDark },
  texto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 21, color: colors.exercicioTexto },
});