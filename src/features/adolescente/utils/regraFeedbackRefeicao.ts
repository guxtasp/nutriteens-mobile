// src/features/adolescente/utils/regraFeedbackRefeicao.ts
//
// Regra v3 — separa duas lógicas que antes ficavam parecidas demais:
//
//   1. Trilha de PROCESSAMENTO (NOVA): é avaliativa por natureza (in natura vs
//      ultraprocessado), então mantém tom de "resultado" — processamento,
//      nutricional (variedade de grupos) e melhoria continuam nessa trilha.
//
//   2. Trilha de MISSÃO (lacuna de nutriente na semana): NÃO é mais tratada
//      como avaliação/nota. Vira um convite do Bróxis, sempre em tom positivo,
//      nunca "você está com falta de X" — e some da tela quando não há lacuna,
//      em vez de aparecer como um bloco "vazio" ou neutro.
//
// A classificação EBIA nunca vira um bloco visível pro adolescente (decisão de
// produto já tomada antes) — ela só calibra o TOM da trilha de processamento
// (evitarCobranca), como um modificador interno, nunca como um "resultado".

export type ClassificacaoNova = 'IN_NATURA' | 'INGREDIENTE_CULINARIO' | 'PROCESSADO' | 'ULTRAPROCESSADO';
export type ClassificacaoEbia = 'SEGURANCA_ALIMENTAR' | 'INSEGURANCA_LEVE' | 'INSEGURANCA_MODERADA' | 'INSEGURANCA_GRAVE';
export type NivelQualidade = 'EXCELENTE' | 'EQUILIBRADO' | 'ATENCAO_ULTRAPROCESSADO';
export type DimensaoFeedback = 'NOVA_POSITIVO' | 'NOVA_ATENCAO' | 'NEUTRO';

export type LacunaNutriente = {
  // vitamina_d removida: TACO não mede esse nutriente, então nunca teria dado real (ver nutrienteService.ts)
  nutriente: 'vitamina_c' | 'ferro' | 'calcio' | 'vitamina_a' | 'zinco';
  rotulo: string;
  sugestao: string;
};

export type ItemRefeicaoFeedback = {
  classificacaoNova: ClassificacaoNova;
  gruposAlimentares: string[];
};

export type MissaoNutriente = {
  titulo: string;
  texto: string;
  nutriente: LacunaNutriente['nutriente'];
};

export type FeedbackRefeicao = {
  nivelQualidade: NivelQualidade;
  dimensaoPrincipal: DimensaoFeedback;
  processamento: string;
  nutricional: string;
  melhoria: string;
  // null quando não há lacuna detectada essa semana — a tela deve
  // simplesmente não mostrar o bloco de missão nesse caso, não mostrar
  // um "tudo certo" genérico (isso pertenceria à trilha de processamento).
  missao: MissaoNutriente | null;
  // -1 (tudo ultraprocessado) a 1 (tudo in natura) — só pra dar mais nuance
  // visual à cara do Bróxis na tela (qual variante dentro do nivelQualidade),
  // NÃO é persistido no banco (nivel_qualidade continua com só 3 valores lá).
  intensidade: number;
};

export type EntradaFeedback = {
  itens: ItemRefeicaoFeedback[];
  classificacaoEbia: ClassificacaoEbia;
  lacunaNutrienteSemana: LacunaNutriente | null;
};

const EVITAR_COBRANCA: Record<ClassificacaoEbia, boolean> = {
  SEGURANCA_ALIMENTAR: false,
  INSEGURANCA_LEVE: false,
  INSEGURANCA_MODERADA: true,
  INSEGURANCA_GRAVE: true,
};

function gerarProcessamento(proporcaoUltra: number, proporcaoNatural: number, evitarCobranca: boolean): string {
  if (proporcaoUltra >= 0.5) {
    return evitarCobranca
      ? 'Essa refeição teve mais itens industrializados. Tudo bem, o que importa é ir ajustando aos poucos, sem pressa.'
      : 'Essa refeição teve bastante alimento ultraprocessado. Vale ficar de olho nisso nas próximas.';
  }
  if (proporcaoNatural >= 0.5) {
    return 'A maior parte dessa refeição foi de alimentos in natura ou pouco processados. Mandou bem!';
  }
  return 'Essa refeição teve uma mistura equilibrada entre alimentos naturais e industrializados.';
}

function gerarNutricional(gruposUnicos: Set<string>): string {
  if (gruposUnicos.size >= 3) {
    return `Essa refeição variou entre ${gruposUnicos.size} grupos alimentares diferentes — boa diversidade.`;
  }
  if (gruposUnicos.size === 2) {
    return 'Essa refeição teve 2 grupos alimentares diferentes. Aumentar a variedade ajuda a cobrir mais nutrientes.';
  }
  return 'Essa refeição ficou concentrada em um único grupo alimentar. Variar mais ajuda o corpo a receber nutrientes diferentes.';
}

function gerarMelhoria(proporcaoUltra: number): { texto: string; dimensaoPrincipal: DimensaoFeedback } {
  if (proporcaoUltra >= 0.5) {
    return {
      texto: 'Na próxima refeição, tente trocar um item industrializado por algo in natura, como uma fruta ou legume.',
      dimensaoPrincipal: 'NOVA_ATENCAO',
    };
  }
  return {
    texto: 'Continue assim! Na próxima, capriche numa boa variedade de grupos alimentares.',
    dimensaoPrincipal: 'NOVA_POSITIVO',
  };
}

// Convite de missão — nunca "você está com falta de X". Sempre framed como
// algo pra explorar, ligado ao mesmo personagem/sistema de missões do dia,
// não como um julgamento sobre o que a pessoa comeu.
function gerarMissaoNutriente(lacuna: LacunaNutriente): MissaoNutriente {
  return {
    nutriente: lacuna.nutriente,
    titulo: `Missão do Bróxis: ${lacuna.rotulo}`,
    texto: `Essa semana ainda dá tempo de explorar uma boa fonte de ${lacuna.rotulo}. Que tal ${lacuna.sugestao}?`,
  };
}

export function gerarFeedbackRefeicao(entrada: EntradaFeedback): FeedbackRefeicao {
  const { itens, classificacaoEbia, lacunaNutrienteSemana } = entrada;
  const evitarCobranca = EVITAR_COBRANCA[classificacaoEbia];
  const missao = lacunaNutrienteSemana ? gerarMissaoNutriente(lacunaNutrienteSemana) : null;

  if (itens.length === 0) {
    return {
      nivelQualidade: 'EQUILIBRADO',
      dimensaoPrincipal: 'NEUTRO',
      processamento: 'Refeição registrada!',
      nutricional: 'Ainda não temos alimentos suficientes nessa refeição pra avaliar a variedade.',
      melhoria: 'Na próxima, tente registrar os alimentos com mais detalhe pra gente te dar dicas melhores.',
      missao,
      intensidade: 0,
    };
  }

  const total = itens.length;
  const qtdUltra = itens.filter((i) => i.classificacaoNova === 'ULTRAPROCESSADO').length;
  const qtdNatural = itens.filter(
    (i) => i.classificacaoNova === 'IN_NATURA' || i.classificacaoNova === 'INGREDIENTE_CULINARIO'
  ).length;
  const proporcaoUltra = qtdUltra / total;
  const proporcaoNatural = qtdNatural / total;
  const gruposUnicos = new Set(itens.flatMap((i) => i.gruposAlimentares));

  const nivelQualidade: NivelQualidade =
    proporcaoUltra >= 0.5 ? 'ATENCAO_ULTRAPROCESSADO' : proporcaoNatural >= 0.5 ? 'EXCELENTE' : 'EQUILIBRADO';

  const { texto: melhoria, dimensaoPrincipal } = gerarMelhoria(proporcaoUltra);

  return {
    nivelQualidade,
    dimensaoPrincipal,
    processamento: gerarProcessamento(proporcaoUltra, proporcaoNatural, evitarCobranca),
    nutricional: gerarNutricional(gruposUnicos),
    melhoria,
    missao,
    intensidade: proporcaoNatural - proporcaoUltra,
  };
}
