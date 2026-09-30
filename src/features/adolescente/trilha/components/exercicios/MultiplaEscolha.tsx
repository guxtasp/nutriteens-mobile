// src/features/adolescente/trilha/components/exercicios/MultiplaEscolha.tsx
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { OpcaoQuiz } from '../../services/trilhaService';

type Props = {
  opcoes: OpcaoQuiz[];
  selecionada: string | null;
  respondido: boolean;
  onSelecionar: (opcaoId: string) => void;
};

/**
 * Múltipla escolha (também serve pro "verdadeiro ou falso" quando a questão
 * só tem 2 opções — mesmo componente, ver VerdadeiroFalso.tsx que é só uma
 * variação visual dele com rótulos fixos).
 *
 * Só destaca a opção que o usuário tocou (verde se certa, vermelho se
 * errada) — não revela qual era a certa quando ele erra e não escolheu ela
 * (a explicação no FeedbackExercicio é quem cobre isso). Ver nota em
 * VerdadeiroFalso sobre por que essa é a escolha de design.
 */
export default function MultiplaEscolha({ opcoes, selecionada, respondido, onSelecionar }: Props) {
  return (
    <View style={styles.lista}>
      <AppText style={styles.instrucao}>Toque para selecionar</AppText>
      {opcoes.map((opcao) => {
        const estaSelecionada = selecionada === opcao.id;
        const mostrarCerta = respondido && estaSelecionada && opcao.correta;
        const mostrarErrada = respondido && estaSelecionada && !opcao.correta;

        return (
          <Pressable
            key={opcao.id}
            disabled={respondido}
            onPress={() => onSelecionar(opcao.id)}
            style={[
              styles.opcao,
              estaSelecionada && !respondido && styles.opcaoSelecionada,
              mostrarCerta && styles.opcaoCerta,
              mostrarErrada && styles.opcaoErrada,
            ]}
          >
            <AppText
              style={[
                styles.opcaoTexto,
                (mostrarCerta || mostrarErrada) && styles.opcaoTextoRespondido,
              ]}
            >
              {opcao.texto}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { marginTop: 24 },
  instrucao: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.placeholder,
    textAlign: 'center',
    marginBottom: 14,
  },
  opcao: {
    borderWidth: 1.5,
    borderColor: '#B9C2B6',
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  opcaoSelecionada: { borderColor: colors.primary },
  opcaoCerta: { borderColor: colors.success, backgroundColor: 'rgba(16, 185, 129, 0.08)' },
  opcaoErrada: { borderColor: colors.error, backgroundColor: 'rgba(192, 57, 43, 0.08)', borderBottomColor: colors.error },
  opcaoTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.placeholder,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  opcaoTextoRespondido: { color: colors.textOnLight },
});
