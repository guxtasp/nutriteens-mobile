// Transforma uma questão da trilha (qualquer formato) em linhas de texto
// legíveis para REVISÃO (gabarito visível). Lógica pura, testada.
// Convenções por formato: ver FormatoExercicio em trilhaService.ts.

export type OpcaoRevisao = { texto: string; correta: boolean; ordem: number; categoria?: string | null };
export type QuestaoRevisao = {
  enunciado: string;
  formato: string;
  dadosExtra: Record<string, any>;
  opcoes: OpcaoRevisao[];
};

export const ROTULO_FORMATO: Record<string, string> = {
  multipla_escolha: 'Múltipla escolha',
  verdadeiro_falso: 'Verdadeiro ou falso',
  completar: 'Completar a frase',
  ordene: 'Ordene',
  associe: 'Associe',
  classifique: 'Classifique',
  cartao: 'Cartão de conteúdo',
  enquete: 'Enquete (sem nota)',
  meta: 'Meta "se… então…"',
  memoria: 'Jogo da memória',
  prato: 'Monte seu prato',
};

export type DescricaoQuestao = { rotuloFormato: string; titulo: string; linhas: string[] };

export function descreverQuestao(q: QuestaoRevisao): DescricaoQuestao {
  const extra = q.dadosExtra ?? {};
  const opcoes = [...(q.opcoes ?? [])].sort((a, b) => a.ordem - b.ordem);
  const linhas: string[] = [];

  switch (q.formato) {
    case 'cartao':
      if (extra.texto) linhas.push(String(extra.texto));
      break;

    case 'ordene':
      opcoes.forEach((o, i) => linhas.push(`${i + 1}. ${o.texto}`));
      break;

    case 'associe':
    case 'memoria':
      for (const p of extra.pares ?? []) linhas.push(`${p.esquerda}  ↔  ${p.direita}`);
      break;

    case 'classifique': {
      const categorias: string[] = extra.categorias ?? [];
      if (categorias.length) linhas.push(`Colunas: ${categorias.join(' | ')}`);
      for (const o of opcoes) linhas.push(`${o.texto}  →  ${o.categoria ?? '(sem categoria!)'}`);
      break;
    }

    case 'prato': {
      const alimentos: any[] = extra.alimentos ?? [];
      if (alimentos.length) linhas.push(`Alimentos: ${alimentos.map((a) => a.nome ?? a.id ?? '?').join(', ')}`);
      if (extra.capacidade) linhas.push(`Capacidade do prato: ${extra.capacidade} · mínimo de itens: ${extra.minimoItens ?? '—'}`);
      break;
    }

    case 'enquete':
    case 'meta':
      opcoes.forEach((o) => linhas.push(`• ${o.texto}`));
      break;

    default:
      // multipla_escolha, verdadeiro_falso, completar: gabarito marcado
      opcoes.forEach((o) => linhas.push(`${o.correta ? '✓' : '○'} ${o.texto}`));
  }

  if (extra.explicacao) linhas.push(`Explicação: ${extra.explicacao}`);
  if (extra.feedback) linhas.push(`Feedback: ${extra.feedback}`);

  return {
    rotuloFormato: ROTULO_FORMATO[q.formato] ?? q.formato,
    titulo: q.enunciado,
    linhas,
  };
}

/** Problemas objetivos que o revisor deve ver antes de aprovar. */
export function problemasDaQuestao(q: QuestaoRevisao): string[] {
  const problemas: string[] = [];
  const opcoes = q.opcoes ?? [];
  const corretas = opcoes.filter((o) => o.correta).length;

  if (!q.enunciado || q.enunciado.trim().length === 0) problemas.push('Enunciado vazio.');

  if (['multipla_escolha', 'verdadeiro_falso'].includes(q.formato)) {
    if (opcoes.length < 2) problemas.push('Menos de 2 opções.');
    if (corretas !== 1) problemas.push(corretas === 0 ? 'Nenhuma opção marcada como correta.' : 'Mais de uma opção correta.');
  }
  if (q.formato === 'completar' && !q.enunciado.includes('{lacuna}')) {
    problemas.push('Falta o token {lacuna} no enunciado.');
  }
  if (q.formato === 'classifique') {
    const categorias: string[] = q.dadosExtra?.categorias ?? [];
    if (categorias.length < 2) problemas.push('Menos de 2 categorias.');
    if (opcoes.some((o) => !o.categoria || !categorias.includes(o.categoria))) {
      problemas.push('Há item sem categoria válida.');
    }
  }
  if ((q.formato === 'associe' || q.formato === 'memoria') && (q.dadosExtra?.pares ?? []).length < 2) {
    problemas.push('Menos de 2 pares.');
  }
  if (q.formato === 'cartao' && !q.dadosExtra?.texto) problemas.push('Cartão sem texto.');
  return problemas;
}
