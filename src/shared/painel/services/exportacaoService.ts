// src/shared/painel/services/exportacaoService.ts
// Exportação de dados em CSV para pesquisa. Os dados vêm anonimizados do banco
// (RPC painel_exportar): só o código do participante, nunca nome/e-mail/escola.
import { supabase } from '../../../lib/supabase';
import type { Intervalo } from '../periodo';
import { montarCsv, type Separador } from '../utils/csv';

export type ColunaExport = { nome: string; descricao: string };

export type ConjuntoExport = {
  chave: string;
  titulo: string;
  descricao: string;
  /** como o período filtra este conjunto */
  periodo: string;
  /** true: respeita o período escolhido */
  usaPeriodo: boolean;
  colunas: ColunaExport[];
};

const P: ColunaExport = { nome: 'participante', descricao: 'Código do participante (ex.: NT-000001). Não identifica a pessoa.' };

// A ORDEM e os NOMES das colunas precisam bater com os apelidos do SQL em
// migration_exportacao_csv.sql (painel_exportar).
export const CONJUNTOS: ConjuntoExport[] = [
  {
    chave: 'usuarios', titulo: 'Participantes',
    descricao: 'Perfil de cada adolescente: idade, gênero, tipo de escola, EBIA atual, peso e altura, sequência e XP.',
    periodo: 'Quem se cadastrou até o fim do período (o início é ignorado).', usaPeriodo: true,
    colunas: [P,
      { nome: 'idade', descricao: 'Idade em anos completos hoje.' },
      { nome: 'genero', descricao: 'Gênero informado no cadastro.' },
      { nome: 'tipo_instituicao', descricao: 'PUBLICA, PRIVADA ou FILANTROPICA.' },
      { nome: 'classificacao_ebia', descricao: 'Última classificação EBIA do participante.' },
      { nome: 'etapa_onboarding', descricao: 'Etapa do cadastro/triagem em que está.' },
      { nome: 'peso_kg', descricao: 'Peso informado (kg).' },
      { nome: 'altura_cm', descricao: 'Altura informada (cm).' },
      { nome: 'data_cadastro', descricao: 'Dia do cadastro (AAAA-MM-DD).' },
      { nome: 'ultimo_acesso', descricao: 'Data e hora do último evento no app.' },
      { nome: 'sequencia_atual', descricao: 'Dias seguidos mantidos hoje.' },
      { nome: 'maior_sequencia', descricao: 'Maior sequência de dias já alcançada.' },
      { nome: 'xp_total', descricao: 'XP acumulado.' },
      { nome: 'fase_atual', descricao: 'Fase do mascote.' },
    ],
  },
  {
    chave: 'triagem_ebia', titulo: 'Triagem EBIA',
    descricao: 'Cada EBIA concluída: pontuação, classificação e as 5 respostas (1 = sim, 0 = não).',
    periodo: 'Pela data em que a avaliação foi feita.', usaPeriodo: true,
    colunas: [P,
      { nome: 'data_avaliacao', descricao: 'Data e hora em que a avaliação foi feita.' },
      { nome: 'pontuacao_total', descricao: 'Número de respostas "sim" (0 a 5).' },
      { nome: 'classificacao', descricao: 'SEGURANCA_ALIMENTAR, INSEGURANCA_LEVE, INSEGURANCA_MODERADA ou INSEGURANCA_GRAVE.' },
      { nome: 'pergunta_1', descricao: 'Resposta à pergunta 1 (1 = sim, 0 = não).' },
      { nome: 'pergunta_2', descricao: 'Resposta à pergunta 2.' },
      { nome: 'pergunta_3', descricao: 'Resposta à pergunta 3.' },
      { nome: 'pergunta_4', descricao: 'Resposta à pergunta 4.' },
      { nome: 'pergunta_5', descricao: 'Resposta à pergunta 5.' },
    ],
  },
  {
    chave: 'recordatorio', titulo: 'Recordatório alimentar',
    descricao: 'O recordatório da triagem: uma linha por alimento, com os escores Sisvan do dia.',
    periodo: 'Pelo dia a que o recordatório se refere.', usaPeriodo: true,
    colunas: [P,
      { nome: 'data_referencia', descricao: 'Dia lembrado pelo adolescente (AAAA-MM-DD).' },
      { nome: 'concluido', descricao: '1 se o recordatório foi concluído.' },
      { nome: 'escore_saudavel', descricao: 'Escore Sisvan de marcadores saudáveis (0 a 3).' },
      { nome: 'escore_nao_saudavel', descricao: 'Escore Sisvan de marcadores não saudáveis (0 a 4).' },
      { nome: 'refeicao', descricao: 'Tipo da refeição.' },
      { nome: 'alimento', descricao: 'Nome do alimento.' },
      { nome: 'quantidade', descricao: 'Quantidade registrada.' },
      { nome: 'classificacao_nova', descricao: 'Classificação NOVA do alimento.' },
      { nome: 'grupos_alimentares', descricao: 'Grupos alimentares, separados por "|".' },
    ],
  },
  {
    chave: 'alimentacao', titulo: 'Registro de alimentação',
    descricao: 'Refeições registradas no dia a dia, uma linha por alimento.',
    periodo: 'Pelo dia do registro.', usaPeriodo: true,
    colunas: [P,
      { nome: 'data', descricao: 'Dia do registro (AAAA-MM-DD).' },
      { nome: 'refeicao', descricao: 'Tipo da refeição.' },
      { nome: 'realizada', descricao: '1 se a refeição foi feita.' },
      { nome: 'horario', descricao: 'Horário do registro.' },
      { nome: 'alimento', descricao: 'Nome do alimento.' },
      { nome: 'quantidade', descricao: 'Quantidade registrada.' },
      { nome: 'classificacao_nova', descricao: 'Classificação NOVA do alimento.' },
      { nome: 'ultraprocessado', descricao: '1 se o alimento é ultraprocessado.' },
      { nome: 'grupos_alimentares', descricao: 'Grupos alimentares, separados por "|".' },
    ],
  },
  {
    chave: 'agua', titulo: 'Água',
    descricao: 'Cada copo/garrafa registrada, com a quantidade em ml.',
    periodo: 'Pelo dia do registro.', usaPeriodo: true,
    colunas: [P,
      { nome: 'data', descricao: 'Dia do registro.' },
      { nome: 'horario', descricao: 'Horário do registro.' },
      { nome: 'quantidade_ml', descricao: 'Quantidade em ml.' },
    ],
  },
  {
    chave: 'atividade_fisica', titulo: 'Atividade física',
    descricao: 'Atividades registradas: tipo, duração e passos.',
    periodo: 'Pelo dia do registro.', usaPeriodo: true,
    colunas: [P,
      { nome: 'data', descricao: 'Dia do registro.' },
      { nome: 'horario', descricao: 'Horário do registro.' },
      { nome: 'tipo_atividade', descricao: 'Nome da atividade.' },
      { nome: 'duracao_minutos', descricao: 'Duração em minutos.' },
      { nome: 'quantidade_passos', descricao: 'Passos (quando informado).' },
    ],
  },
  {
    chave: 'eventos', titulo: 'Eventos de uso',
    descricao: 'Cada ação registrada no app (login, lição, desafio, receita, amizade...).',
    periodo: 'Pelo dia do evento.', usaPeriodo: true,
    colunas: [P,
      { nome: 'evento', descricao: 'Nome do evento.' },
      { nome: 'data_hora', descricao: 'Data e hora (horário de Brasília).' },
      { nome: 'sessao', descricao: 'Identificador anônimo da sessão de uso.' },
    ],
  },
  {
    chave: 'sessoes', titulo: 'Sessões e tempo de uso',
    descricao: 'Uma linha por sessão de uso, com a duração estimada.',
    periodo: 'Pelo dia dos eventos da sessão.', usaPeriodo: true,
    colunas: [P,
      { nome: 'sessao', descricao: 'Identificador anônimo da sessão.' },
      { nome: 'inicio', descricao: 'Primeiro evento da sessão.' },
      { nome: 'fim', descricao: 'Último evento da sessão.' },
      { nome: 'duracao_min', descricao: 'Minutos entre o primeiro e o último evento. É uma estimativa: sessão com um único evento tem 0.' },
      { nome: 'eventos', descricao: 'Quantidade de eventos na sessão.' },
    ],
  },
  {
    chave: 'gamificacao', titulo: 'Engajamento e gamificação',
    descricao: 'Por participante: XP, fase, sequência e o que fez no período (lições, insígnias, missões, dias com registro).',
    periodo: 'Os totais "no período" respeitam o período; XP e sequência são o valor de hoje.', usaPeriodo: true,
    colunas: [P,
      { nome: 'xp_total', descricao: 'XP acumulado.' },
      { nome: 'fase_atual', descricao: 'Fase do mascote.' },
      { nome: 'sequencia_atual', descricao: 'Dias seguidos mantidos hoje.' },
      { nome: 'maior_sequencia', descricao: 'Maior sequência já alcançada.' },
      { nome: 'licoes_no_periodo', descricao: 'Lições concluídas no período.' },
      { nome: 'xp_licoes_no_periodo', descricao: 'XP ganho com lições no período.' },
      { nome: 'insignias_no_periodo', descricao: 'Insígnias/conquistas obtidas no período.' },
      { nome: 'missoes_diarias_concluidas', descricao: 'Missões diárias concluídas no período.' },
      { nome: 'dias_com_registro', descricao: 'Dias com algum registro no período.' },
    ],
  },
  {
    chave: 'social', titulo: 'Uso social',
    descricao: 'Por participante: quantidade de amigos, publicações no feed, reações enviadas e chamas em dupla. Não mostra quem são os amigos.',
    periodo: 'Feed e reações respeitam o período; amigos e chamas são o valor de hoje.', usaPeriodo: true,
    colunas: [P,
      { nome: 'feed_visivel', descricao: '1 se a pessoa deixa o feed visível.' },
      { nome: 'amigos', descricao: 'Amizades aceitas.' },
      { nome: 'eventos_no_feed', descricao: 'Itens gerados no feed no período.' },
      { nome: 'reacoes_enviadas', descricao: 'Reações enviadas no período.' },
      { nome: 'chamas_em_dupla_ativas', descricao: 'Chamas em dupla ativas hoje.' },
    ],
  },
];

export type Periodo = Intervalo | null; // null = tudo

const TAMANHO_PAGINA = 2000;
const MAX_PAGINAS = 100; // trava de segurança: 200 mil linhas por arquivo

export type Progresso = (carregadas: number, total: number) => void;

export async function buscarConjunto(
  conjunto: ConjuntoExport,
  periodo: Periodo,
  aoProgredir?: Progresso
): Promise<Record<string, unknown>[]> {
  const todas: Record<string, unknown>[] = [];
  let total = Infinity;
  for (let pagina = 0; pagina < MAX_PAGINAS && todas.length < total; pagina++) {
    const { data, error } = await supabase.rpc('painel_exportar', {
      p_conjunto: conjunto.chave,
      p_inicio: periodo?.inicio ?? null,
      p_fim: periodo?.fim ?? null,
      p_limite: TAMANHO_PAGINA,
      p_offset: pagina * TAMANHO_PAGINA,
    });
    if (error) throw error;
    const r = data as { total: number; linhas: Record<string, unknown>[] };
    total = Number(r.total);
    if (!r.linhas.length) break;
    todas.push(...r.linhas);
    aoProgredir?.(todas.length, total);
  }
  if (todas.length > 0) {
    const faltando = conjunto.colunas.filter((c) => !(c.nome in todas[0]));
    if (faltando.length) console.warn(`[exportacao] ${conjunto.chave}: colunas sem dados no banco:`, faltando.map((c) => c.nome));
  }
  return todas;
}

export function csvDoConjunto(conjunto: ConjuntoExport, linhas: Record<string, unknown>[], sep: Separador): string {
  return montarCsv(conjunto.colunas.map((c) => c.nome), linhas, sep);
}

/** Dicionário de dados: explica cada coluna de cada arquivo (ajuda quem vai analisar). */
export function csvDicionario(conjuntos: ConjuntoExport[], sep: Separador): string {
  const linhas = conjuntos.flatMap((c) =>
    c.colunas.map((col) => ({ arquivo: c.chave, coluna: col.nome, descricao: col.descricao, periodo: c.periodo }))
  );
  return montarCsv(['arquivo', 'coluna', 'descricao', 'periodo'], linhas, sep);
}

export type ExportacaoRecente = { conjunto: string; inicio: string | null; fim: string | null; linhas: number; criadoEm: string; quem: string | null };

export async function listarExportacoesRecentes(): Promise<ExportacaoRecente[]> {
  const { data, error } = await supabase.rpc('painel_exportacoes_recentes', { p_limite: 10 });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    conjunto: r.conjunto, inicio: r.inicio, fim: r.fim, linhas: r.linhas, criadoEm: r.criado_em, quem: r.quem,
  }));
}

export function nomeArquivo(chave: string, periodo: Periodo, hoje: string): string {
  const faixa = periodo ? `${periodo.inicio}_a_${periodo.fim}` : `tudo_ate_${hoje}`;
  return `nutriteens_${chave}_${faixa}.csv`;
}
