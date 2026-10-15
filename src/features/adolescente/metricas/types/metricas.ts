// src/features/adolescente/metricas/types/metricas.ts
//
// Tipos do módulo de Métricas e Feedback. Tudo aqui descreve FATOS já registrados
// pelo próprio adolescente (entrada) e os números calculados a partir deles (saída).
// Nada é inferido: receita, missão ou conteúdo visualizado NÃO viram consumo.

/** AAAA-MM-DD. Datas são tratadas como texto, sem fuso (o serviço entrega o dia local já resolvido). */
export type DataISO = string;

export type TipoPeriodo = 'semana' | 'mes';

/** Intervalo inclusivo. */
export type Janela = { inicio: DataISO; fim: DataISO; dias: number };
export type Janelas = { atual: Janela; anterior: Janela };

// ---------- Entrada (o serviço da Fase 4 monta isto a partir do Supabase) ----------

export type AlimentoRegistrado = { alimentoId: string; nome: string; grupos: string[] };
export type RefeicaoRegistrada = { id: string; data: DataISO; tipo: string; alimentos: AlimentoRegistrado[] };
export type RegistroAgua = { data: DataISO; ml: number };
export type RegistroAtividade = { data: DataISO; tipo: string; minutos: number };
/** `concluida` = XP da missão já concedido (única marca persistida de conclusão). */
export type MissaoDiariaRegistro = { data: DataISO; concluida: boolean };
export type LicaoConcluida = { data: DataISO; licaoId: string; trilhaId: string };
export type LancamentoXp = { data: DataISO; origem: string; quantidade: number };
export type ConquistaObtida = { tipo: 'insignia' | 'carta'; nome: string; data: DataISO };
export type ProgressoTrilha = { trilhaId: string; titulo: string; totalLicoes: number; licoesConcluidas: number };
/** Primeira vez (em todo o histórico do usuário) que cada alimento foi registrado. */
export type PrimeiraAparicaoAlimento = { alimentoId: string; nome: string; data: DataISO };

export type DadosBrutos = {
  hoje: DataISO;
  refeicoes: RefeicaoRegistrada[];
  agua: RegistroAgua[];
  /** meta diária em ml; null quando o perfil não permite calcular (não inventamos meta) */
  metaAguaMl: number | null;
  atividades: RegistroAtividade[];
  missoesDiarias: MissaoDiariaRegistro[];
  licoes: LicaoConcluida[];
  xp: LancamentoXp[];
  conquistas: ConquistaObtida[];
  trilhas: ProgressoTrilha[];
  primeiraAparicaoAlimentos: PrimeiraAparicaoAlimento[];
};

// ---------- Saída ----------

export type NivelDados = 'nenhum' | 'pouco' | 'suficiente';

export type DiaHabito = {
  data: DataISO;
  refeicoes: number;
  /** null quando não há meta calculável */
  aguaMeta: boolean | null;
  aguaRegistrada: boolean;
  atividade: boolean;
};

export type MetricasHabitos = {
  diasComRefeicao: number;
  refeicoes: number;
  refeicoesPorTipo: Record<string, number>;
  alimentosDistintos: number;
  /** grupos presentes e em quantos dias apareceram (ordem: mais dias primeiro) */
  grupos: { grupo: string; dias: number }[];
  /** null = não dá para afirmar (usuário ainda sem histórico anterior ao período) */
  alimentosNovos: string[] | null;
  agua: { diasComRegistro: number; diasComMeta: number | null; mediaMlPorDiaRegistrado: number | null };
  atividade: { diasAtivos: number; minutos: number; tiposDistintos: number };
  porDia: DiaHabito[];
};

export type MetricasEngajamento = {
  missoes: { atribuidas: number; concluidas: number };
  licoes: number;
  /** estado atual (não restrito ao período) */
  trilhas: { emAndamento: ProgressoTrilha[]; finalizadas: number };
  xpNoPeriodo: number;
  xpPorOrigem: Record<string, number>;
  porDia: { data: DataISO; ativo: boolean; acoes: number }[];
};

export type MetricasEvolucao = {
  conquistasNoPeriodo: number;
  /** mais recentes primeiro, mesmo fora do período */
  conquistasRecentes: ConquistaObtida[];
};

export type MetricasPeriodo = {
  janela: Janela;
  /** dias com alguma refeição, água, atividade ou lição concluída */
  diasAtivos: number;
  nivelDados: NivelDados;
  habitos: MetricasHabitos;
  engajamento: MetricasEngajamento;
  evolucao: MetricasEvolucao;
};

export type DirecaoComparacao = 'subiu' | 'igual' | 'desceu' | 'sem_base';
export type Comparacao = { direcao: DirecaoComparacao; atual: number; anterior: number; diferenca: number };

export type ChaveComparacao =
  | 'diasAtivos' | 'diasComRefeicao' | 'alimentosDistintos' | 'gruposPresentes'
  | 'diasComAgua' | 'diasComMetaAgua' | 'diasAtividade' | 'minutosAtividade'
  | 'licoes' | 'missoesConcluidas' | 'conquistas';

export type MetricasCompletas = {
  tipo: TipoPeriodo;
  atual: MetricasPeriodo;
  anterior: MetricasPeriodo;
  comparacoes: Record<ChaveComparacao, Comparacao>;
};
