// src/features/adolescente/trilha/components/exercicios/VerdadeiroFalso.tsx
import React from 'react';
import MultiplaEscolha from './MultiplaEscolha';
import type { OpcaoQuiz } from '../../services/trilhaService';

type Props = {
  opcoes: OpcaoQuiz[];
  selecionada: string | null;
  respondido: boolean;
  onSelecionar: (opcaoId: string) => void;
};

/**
 * Visualmente é o mesmo componente de múltipla escolha (mesmas bordas,
 * mesmo destaque de seleção) — só reaproveita, sem duplicar estilo. A
 * diferença de conteúdo é responsabilidade de quem cadastra a questão:
 * `opcoes_quiz` tem só 2 linhas, com texto "VERDADEIRO"/"FALSO".
 *
 * Design combinado (a partir do Figma): quando erra, só a opção tocada
 * fica vermelha — a opção certa NÃO é destacada em verde. Com só 2
 * alternativas, sinalizar "essa está errada" já entrega a resposta por
 * eliminação; destacar a outra em verde seria redundante.
 */
export default function VerdadeiroFalso({ opcoes, selecionada, respondido, onSelecionar }: Props) {
  return (
    <MultiplaEscolha
      opcoes={opcoes}
      selecionada={selecionada}
      respondido={respondido}
      onSelecionar={onSelecionar}
    />
  );
}
