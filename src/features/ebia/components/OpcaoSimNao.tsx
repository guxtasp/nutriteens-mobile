import React from 'react';
import { View, StyleSheet } from 'react-native';
import { OptionButton } from '../../../shared/ui/OptionButton';

const OPCOES = [
  { label: 'Sim', value: true },
  { label: 'Não', value: false },
];

interface OpcaoSimNaoProps {
  selecionado: boolean | null;
  onSelecionar: (valor: boolean) => void;
}

export function OpcaoSimNao({ selecionado, onSelecionar }: OpcaoSimNaoProps) {
  return (
    <View style={styles.opcoes}>
      {OPCOES.map((opcao) => (
        <OptionButton
          key={opcao.label}
          label={opcao.label}
          ativo={selecionado === opcao.value}
          onPress={() => onSelecionar(opcao.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  opcoes: { gap: 16 },
});