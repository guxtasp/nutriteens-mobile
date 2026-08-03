// src/features/recordatorio/components/GradeDeAlimentos.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { AlimentoCatalogo } from '../services/recordatorioService';

interface GradeDeAlimentosProps {
  alimentos: AlimentoCatalogo[];
  selecionados: Set<string>;
  onAlternar: (id: string) => void;
}

// Grid simples de "cartões" com o nome do alimento. Trocar por ícone/imagem
// por alimento quando a arte estiver pronta (ver campo `nome` como chave).
export function GradeDeAlimentos({ alimentos, selecionados, onAlternar }: GradeDeAlimentosProps) {
  return (
    <View style={styles.grid}>
      {alimentos.map((alimento) => {
        const ativo = selecionados.has(alimento.id);
        return (
          <Pressable
            key={alimento.id}
            onPress={() => onAlternar(alimento.id)}
            style={[styles.card, ativo && styles.cardAtivo]}
          >
            <AppText style={[styles.texto, ativo && styles.textoAtivo]}>{alimento.nome}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  card: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  cardAtivo: {
    borderColor: colors.primaryDark,
    backgroundColor: '#E3F5D4',
  },
  texto: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: '#5A5A5A',
    textAlign: 'center',
  },
  textoAtivo: {
    fontFamily: typography.bold,
    color: colors.primaryDark,
  },
});