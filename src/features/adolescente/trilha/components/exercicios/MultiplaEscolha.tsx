// src/features/adolescente/trilha/components/exercicios/MultiplaEscolha.tsx
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
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
 * só tem 2 opções — ver VerdadeiroFalso.tsx).
 *
 * Só destaca a opção que o usuário tocou (verde se certa, vermelho se
 * errada) — não revela qual era a certa quando ele erra (a explicação no
 * FeedbackExercicio é quem cobre isso).
 *
 * Animações: as opções entram em cascata, a tocada dá um pulinho e a errada
 * balança de um lado pro outro.
 */
export default function MultiplaEscolha({ opcoes, selecionada, respondido, onSelecionar }: Props) {
  return (
    <View style={styles.lista}>
      <AppText style={styles.instrucao}>Toque para selecionar</AppText>
      {opcoes.map((opcao, i) => {
        const estaSelecionada = selecionada === opcao.id;
        const mostrarErrada = respondido && estaSelecionada && !opcao.correta;
        const destacada = estaSelecionada && !mostrarErrada;

        return (
          // externo: entrada em cascata; interno: pulinho / balanço
          <MotiView
            key={opcao.id}
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 280, delay: 80 + i * 70 }}
            style={styles.itemExterno}
          >
            <MotiView
              animate={{
                scale: destacada ? [1, 1.04, 1] : 1,
                translateX: mostrarErrada ? [0, -9, 9, -6, 6, 0] : 0,
              }}
              transition={{ type: 'timing', duration: mostrarErrada ? 380 : 200 }}
            >
              <Pressable
                disabled={respondido}
                onPress={() => onSelecionar(opcao.id)}
                style={[styles.opcao, destacada && styles.opcaoSelecionada, mostrarErrada && styles.opcaoErrada]}
              >
                <AppText
                  style={[
                    styles.opcaoTexto,
                    destacada && styles.opcaoTextoSelecionada,
                    mostrarErrada && styles.opcaoTextoErrada,
                  ]}
                >
                  {opcao.texto.toUpperCase()}
                </AppText>
              </Pressable>
            </MotiView>
          </MotiView>
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
  itemExterno: { marginBottom: 12 },
  opcao: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.exercicioBorda,
    borderBottomWidth: 5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  opcaoSelecionada: { borderColor: colors.primary },
  opcaoErrada: {
    backgroundColor: colors.exercicioErro,
    borderColor: colors.exercicioErro,
    borderBottomColor: colors.exercicioErroSuave,
  },
  opcaoTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.exercicioBorda,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  opcaoTextoSelecionada: { color: colors.primary },
  opcaoTextoErrada: { color: colors.exercicioErroSuave },
});