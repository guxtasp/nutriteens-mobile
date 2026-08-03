// src/features/adolescente/utils/regraFeedbackRefeicao.ts

// Regra v1 — placeholder simples baseado na proporção de classificação NOVA
// dos itens da refeição. Isolado nesse arquivo de propósito: quando a
// lógica "legal" for definida, só mexe aqui, nada mais no app depende
// da implementação interna, só do retorno de calcularFeedbackRefeicao().

export type ClassificacaoNova = 'IN_NATURA' | 'INGREDIENTE_CULINARIO' | 'PROCESSADO' | 'ULTRAPROCESSADO';
export type NivelQualidade = 'EXCELENTE' | 'EQUILIBRADO' | 'ATENCAO_ULTRAPROCESSADO';

export type FeedbackRefeicao = {
  nivelQualidade: NivelQualidade;
  mensagemEducativa: string;
};

export function calcularFeedbackRefeicao(classificacoes: ClassificacaoNova[]): FeedbackRefeicao {
  if (classificacoes.length === 0) {
    return {
      nivelQualidade: 'EQUILIBRADO',
      mensagemEducativa: 'Refeição registrada!',
    };
  }

  const total = classificacoes.length;
  const qtdUltra = classificacoes.filter((c) => c === 'ULTRAPROCESSADO').length;
  const qtdNatural = classificacoes.filter(
    (c) => c === 'IN_NATURA' || c === 'INGREDIENTE_CULINARIO'
  ).length;

  const proporcaoUltra = qtdUltra / total;
  const proporcaoNatural = qtdNatural / total;

  if (proporcaoUltra >= 0.5) {
    return {
      nivelQualidade: 'ATENCAO_ULTRAPROCESSADO',
      mensagemEducativa: 'Essa refeição teve bastante alimento ultraprocessado. Que tal equilibrar com algo mais natural na próxima?',
    };
  }

  if (proporcaoNatural >= 0.5) {
    return {
      nivelQualidade: 'EXCELENTE',
      mensagemEducativa: 'Muito bem! Essa refeição teve boa presença de alimentos naturais.',
    };
  }

  return {
    nivelQualidade: 'EQUILIBRADO',
    mensagemEducativa: 'Refeição equilibrada, com uma mistura de tipos de alimentos.',
  };
}