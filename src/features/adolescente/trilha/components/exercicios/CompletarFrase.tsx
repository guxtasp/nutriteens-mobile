// src/features/adolescente/trilha/components/exercicios/CompletarFrase.tsx
import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';
import type { OpcaoQuiz } from '../../services/trilhaService';
import { BALANCO, PULINHO, atrasoCascata } from './animacoes';

// Convenção de conteúdo (ver migration_formato_exercicios.sql): o enunciado
// carrega esse token literal no lugar da lacuna.
export const TOKEN_LACUNA = '{lacuna}';

type FraseProps = {
  enunciado: string;
  opcaoEscolhida: OpcaoQuiz | undefined;
};

/**
 * Só o texto da frase com a lacuna — vai DENTRO do balão do mascote
 * (MascoteFala), igual ao Figma: a pergunta com lacuna é só mais uma
 * variação do enunciado, não uma caixa separada.
 */
export function FraseComLacuna({ enunciado, opcaoEscolhida }: FraseProps) {
  const [antes, depois] = enunciado.split(TOKEN_LACUNA);
  return (
    <AppText style={styles.fraseTexto}>
      {antes}
      <AppText style={[styles.lacuna, opcaoEscolhida && styles.lacunaPreenchida]}>
        {opcaoEscolhida ? ` ${opcaoEscolhida.texto} ` : ' _______ '}
      </AppText>
      {depois}
    </AppText>
  );
}

type BancoProps = {
  opcoes: OpcaoQuiz[];
  selecionada: string | null;
  respondido: boolean;
  onSelecionar: (opcaoId: string) => void;
};

/**
 * O banco de palavras pra tocar e preencher a lacuna — fica fora do balão.
 * Animações: as palavras entram em cascata, a escolhida dá um pulinho e, ao
 * responder, a certa pulsa e a errada balança.
 */
export default function BancoDePalavras({ opcoes, selecionada, respondido, onSelecionar }: BancoProps) {
  return (
    <View>
      <AppText style={styles.instrucao}>Complete minha frase</AppText>
      <View style={styles.banco}>
        {opcoes.map((opcao, indice) => {
          const estaSelecionada = selecionada === opcao.id;
          const mostrarCerta = respondido && estaSelecionada && opcao.correta;
          const mostrarErrada = respondido && estaSelecionada && !opcao.correta;

          return (
            <MotiView
              key={opcao.id}
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 260, delay: atrasoCascata(indice, 100, 70) }}
            >
              <MotiView
                animate={{
                  scale: mostrarCerta ? PULINHO : estaSelecionada && !respondido ? [1, 1.18, 1] : 1,
                  translateX: mostrarErrada ? BALANCO : 0,
                }}
                transition={{ type: 'timing', duration: mostrarErrada ? 380 : 240 }}
              >
                <Pressable disabled={respondido} onPress={() => onSelecionar(opcao.id)}>
                  <AppText
                    style={[
                      styles.chip,
                      estaSelecionada && !respondido && styles.chipSelecionado,
                      mostrarCerta && styles.chipCerto,
                      mostrarErrada && styles.chipErrado,
                    ]}
                  >
                    {opcao.texto}
                  </AppText>
                </Pressable>
              </MotiView>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fraseTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.exercicioTexto,
    textAlign: 'center',
  },
  lacuna: { color: colors.placeholder },
  lacunaPreenchida: { color: colors.primaryShadow },
  instrucao: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.placeholder,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  banco: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.exercicioBorda,
    borderRadius: 14,
    padding: 16,
  },
  chip: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.exercicioTexto,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  chipSelecionado: { color: colors.primary },
  chipCerto: { color: colors.primary },
  chipErrado: { color: colors.exercicioErro },
});