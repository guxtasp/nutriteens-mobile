// src/features/adolescente/services/trilhaService.ts
import { supabase } from '../../../../lib/supabase';
import { concederXp } from '../../../../shared/services/xpService';
import type { NoTrilha } from '../components/TrilhaPath';
import { dataInicioJanela } from '../utils/janelaHabito';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import { ordenarLicoesDoCaminho, ordenarTrilhas, statusDasLicoes } from '../utils/sequenciaTrilhas';

// O valor do XP (lição, bônus de módulo e de trilha — incluindo os fallbacks quando
// `xp_bonus` é nulo) é decidido pelo banco em `conceder_xp` (migration_xp_servidor.sql).
// Aqui só se usa o valor devolvido, para a tela mostrar exatamente o que foi creditado.

export type Trilha = {
  id: string;
  titulo: string;
  descricao: string | null;
  tema: string;
  ordem: number;
  xpBonus: number | null;
};

export type TipoLicao = 'conteudo' | 'quiz' | 'atividade_rastreavel';

export type LicaoDaTrilha = {
  id: string;
  moduloId: string;
  titulo: string;
  ordem: number;
  tipo: TipoLicao;
  icone: string | null;
  xpRecompensa: number;
};

export type ModuloDaTrilha = {
  id: string;
  trilhaId: string;
  ordem: number;
  titulo: string;
  subtitulo: string;
};

export type TrilhasComProgresso = {
  // todas as trilhas aprovadas que têm módulo, na ordem do caminho (cada uma é uma "unidade")
  trilhas: Trilha[];
  modulos: ModuloDaTrilha[];
  nos: NoTrilha[];
  // mesma ordem dos nós — pra quem precisar do detalhe (título, tipo, xp) além do status
  licoes: LicaoDaTrilha[];
};

// Rótulo de módulo gerado por padrão fixo, usado só quando o módulo não tem
// título no banco (registros antigos): "A1 Abertura", "A2 Aprofundamento",
// "A3 Consolidação". A letra é a POSIÇÃO da trilha no caminho (1ª = A, 2ª = B…)
// e o número é a posição do módulo dentro dela. Do 4º módulo em diante cai no
// rótulo genérico "Módulo N".
const ETAPAS_MODULO = ['Abertura', 'Aprofundamento', 'Consolidação'];

function gerarTituloModulo(posicaoTrilha: number, ordemModulo: number): string {
  const letra = String.fromCharCode(64 + Math.max(1, posicaoTrilha)); // 1 -> 'A', 2 -> 'B', ...
  const etapa = ETAPAS_MODULO[ordemModulo - 1];
  return etapa ? `${letra}${ordemModulo} ${etapa}` : `${letra}${ordemModulo} Módulo ${ordemModulo}`;
}

/**
 * Busca TODAS as trilhas aprovadas e monta um caminho contínuo, estilo Duolingo:
 * cada trilha é uma unidade; as unidades vêm na ordem (`ordem`, empate = a mais
 * antiga) e o bloqueio atravessa todas — a trilha seguinte só libera quando a
 * anterior termina. Já cruza com o progresso do usuário.
 */
export async function buscarTrilhasComProgresso(usuarioId: string): Promise<TrilhasComProgresso> {
  // 1. trilhas aprovadas
  const { data: trilhasData, error: erroTrilhas } = await supabase
    .from('trilhas')
    .select('id, titulo, descricao, tema, ordem, xp_bonus, criado_em')
    .eq('status', 'aprovada');
  if (erroTrilhas) throw erroTrilhas;

  const trilhasOrdenadas = ordenarTrilhas(
    (trilhasData ?? []).map((t) => ({ ...t, ordem: t.ordem ?? 0, criadoEm: t.criado_em as string | null }))
  );
  if (trilhasOrdenadas.length === 0) return { trilhas: [], modulos: [], nos: [], licoes: [] };

  // 2. módulos de todas as trilhas
  const { data: modulosData, error: erroModulos } = await supabase
    .from('modulos_trilha')
    .select('id, titulo, ordem, trilha_id')
    .in('trilha_id', trilhasOrdenadas.map((t) => t.id))
    .order('ordem');
  if (erroModulos) throw erroModulos;

  // só entram no caminho as trilhas que têm módulo (trilha vazia não vira "unidade" sem nada dentro)
  const trilhasComModulo = trilhasOrdenadas.filter((t) => (modulosData ?? []).some((m) => m.trilha_id === t.id));
  const trilhas: Trilha[] = trilhasComModulo.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    tema: t.tema,
    ordem: t.ordem,
    xpBonus: t.xp_bonus ?? null,
  }));
  if (trilhas.length === 0) return { trilhas: [], modulos: [], nos: [], licoes: [] };

  const modulosOrdenados = [...(modulosData ?? [])]
    .filter((m) => trilhas.some((t) => t.id === m.trilha_id))
    .sort(
      (a, b) =>
        trilhas.findIndex((t) => t.id === a.trilha_id) - trilhas.findIndex((t) => t.id === b.trilha_id) ||
        a.ordem - b.ordem
    );

  const modulos: ModuloDaTrilha[] = modulosOrdenados.map((m) => {
    const posicaoTrilha = trilhas.findIndex((t) => t.id === m.trilha_id);
    const doMesmaTrilha = modulosOrdenados.filter((x) => x.trilha_id === m.trilha_id);
    return {
      id: m.id,
      trilhaId: m.trilha_id,
      ordem: m.ordem,
      // O banco é a fonte de verdade para o título; o fallback cobre registros antigos.
      titulo: m.titulo || gerarTituloModulo(posicaoTrilha + 1, doMesmaTrilha.findIndex((x) => x.id === m.id) + 1),
      subtitulo: `Trilha: ${trilhas[posicaoTrilha].titulo}`,
    };
  });

  // 3. lições de todos os módulos
  const { data: licoesData, error: erroLicoes } = await supabase
    .from('licoes')
    .select('id, modulo_id, titulo, ordem, tipo, icone, xp_recompensa')
    .in('modulo_id', modulos.map((m) => m.id));
  if (erroLicoes) throw erroLicoes;

  const licoesOrdenadas = ordenarLicoesDoCaminho(
    trilhas,
    modulos,
    (licoesData ?? []).map((l) => ({ ...l, moduloId: l.modulo_id as string }))
  );
  if (licoesOrdenadas.length === 0) return { trilhas, modulos, nos: [], licoes: [] };

  // 4. progresso do usuário nessas lições
  const { data: progresso, error: erroProgresso } = await supabase
    .from('progresso_licao')
    .select('licao_id')
    .eq('usuario_id', usuarioId)
    .in('licao_id', licoesOrdenadas.map((l) => l.id));
  if (erroProgresso) throw erroProgresso;

  // 5. status de cada nó, na ordem do caminho INTEIRO (todas as trilhas). `tipo`
  // viaja junto no nó pra TrilhaPath resolver sozinho o estado de "prática real
  // pendente" (status 'atual' + tipo 'atividade_rastreavel').
  const status = statusDasLicoes(
    licoesOrdenadas.map((l) => l.id),
    new Set((progresso ?? []).map((p) => p.licao_id))
  );
  const nos: NoTrilha[] = licoesOrdenadas.map((l, i) => ({
    id: l.id,
    moduloId: l.modulo_id,
    status: status[i],
    tipo: l.tipo,
    icone: l.icone ?? null,
  }));

  const licoes: LicaoDaTrilha[] = licoesOrdenadas.map((l) => ({
    id: l.id,
    moduloId: l.modulo_id,
    titulo: l.titulo,
    ordem: l.ordem,
    tipo: l.tipo,
    icone: l.icone ?? null,
    xpRecompensa: l.xp_recompensa,
  }));

  return { trilhas, modulos, nos, licoes };
}

// ============================================================
// Detalhe de uma lição específica (conteúdo / quiz / atividade rastreável)
// ============================================================

export type OpcaoQuiz = {
  id: string;
  texto: string;
  correta: boolean;
  ordem: number;
  categoria: string | null; // só usado pelo formato "classifique"
};

// Par de associação do formato "associe" (vive em `dados_extra.pares`).
// `id` é a chave que liga o item da esquerda ao da direita — a resposta do
// usuário é considerada certa pra esse par quando ele associa o item de
// esquerda com o item de direita que tem o MESMO `id` de par.
export type ParAssocie = {
  id: string;
  esquerda: string;
  direita: string;
};

export type FormatoExercicio =
  | 'multipla_escolha'
  | 'verdadeiro_falso'
  | 'completar'
  | 'ordene'
  | 'associe'
  | 'classifique'
  // passos SEM NOTA (ver modelo-pedagogico-trilha.md):
  | 'cartao' // ensino: enunciado = título, dadosExtra.texto = corpo
  | 'enquete' // escolha sem certo/errado; dadosExtra.feedback = mensagem neutra
  | 'meta' // plano "se… então…"; mesma convenção da enquete
  | 'memoria' // jogo da memória; dadosExtra.pares: ParAssocie[]; dadosExtra.feedback opcional
  | 'prato'; // monte seu prato; dadosExtra.alimentos/criterios/capacidade/minimoItens/feedback (ver utils/prato.ts)

export type QuestaoQuiz = {
  id: string;
  enunciado: string;
  ordem: number;
  formato: FormatoExercicio;
  // Convenções por formato (ver migration_formato_exercicios.sql):
  // - completar: nenhuma chave extra (usa o token {lacuna} no enunciado)
  // - ordene: nenhuma chave extra (usa a própria ordem de `opcoes`, já
  //   ordenada por `opcoes_quiz.ordem`, como gabarito)
  // - associe / memoria: dadosExtra.pares: ParAssocie[]
  // - prato: dadosExtra.alimentos: AlimentoPrato[], dadosExtra.criterios: CriterioPrato[]
  //   (opcional), dadosExtra.capacidade (3 a 7), dadosExtra.minimoItens e
  //   dadosExtra.feedback; `opcoes` fica vazio. Ver utils/prato.ts
  // - classifique: dadosExtra.categorias: string[] (rótulos das colunas);
  //   cada opção carrega em `categoria` qual delas é a certa
  // - qualquer formato pode ter dadosExtra.explicacao: string, mostrada
  //   no feedback quando o usuário erra
  dadosExtra: Record<string, any>;
  opcoes: OpcaoQuiz[];
};

export type DetalheLicao = {
  id: string;
  moduloId: string;
  titulo: string;
  tipo: TipoLicao;
  xpRecompensa: number;
  // só preenchido quando tipo === 'conteudo'
  texto: string | null;
  // só preenchido quando tipo === 'quiz'
  questoes: QuestaoQuiz[];
  // só preenchido quando tipo === 'atividade_rastreavel'
  tipoHabito: string | null;
  janelaHoras: number | null;
};

/** Busca todo o conteúdo de uma lição, incluindo quiz (com opções) quando for o caso. */
export async function buscarDetalheLicao(licaoId: string): Promise<DetalheLicao> {
  const { data: licao, error: erroLicao } = await supabase
    .from('licoes')
    .select('id, modulo_id, titulo, tipo, xp_recompensa, conteudo, tipo_habito, criterio_conclusao')
    .eq('id', licaoId)
    .single();
  if (erroLicao) throw erroLicao;

  const detalhe: DetalheLicao = {
    id: licao.id,
    moduloId: licao.modulo_id,
    titulo: licao.titulo,
    tipo: licao.tipo,
    xpRecompensa: licao.xp_recompensa,
    texto: licao.conteudo?.texto ?? null,
    questoes: [],
    tipoHabito: licao.tipo_habito ?? null,
    janelaHoras: licao.criterio_conclusao?.janela_horas ?? null,
  };

  // Lição de conteúdo também pode ser uma SESSÃO de passos (cartões + exercícios).
  // Se não tiver nenhum passo cadastrado, volta vazio e a tela usa o texto
  // antigo (conteudo.texto) — lições já existentes continuam funcionando.
  if (licao.tipo === 'quiz' || licao.tipo === 'conteudo') {
    const { data: questoes, error: erroQuestoes } = await supabase
      .from('questoes_quiz')
      .select('id, enunciado, ordem, formato, dados_extra, opcoes_quiz ( id, texto, correta, ordem, categoria )')
      .eq('licao_id', licaoId)
      .order('ordem');
    if (erroQuestoes) throw erroQuestoes;

    detalhe.questoes = (questoes ?? []).map((q: any) => ({
      id: q.id,
      enunciado: q.enunciado,
      ordem: q.ordem,
      formato: q.formato ?? 'multipla_escolha',
      dadosExtra: q.dados_extra ?? {},
      opcoes: (q.opcoes_quiz ?? []).sort((a: OpcaoQuiz, b: OpcaoQuiz) => a.ordem - b.ordem),
    }));
  }

  return detalhe;
}

/**
 * Checa se o usuário já tem um registro do hábito (hoje por enquanto — `registros_diarios`
 * só guarda data, sem horário exato, então uma janela em horas só é aproximada; pra
 * janelas de até 24h isso equivale a "hoje". Ver nota nas pendências gerais do projeto.)
 */
export async function verificarHabitoRecente(
  usuarioId: string,
  tipoHabito: string,
  janelaHoras: number
): Promise<boolean> {
  // Data LOCAL (igual à gravada em registros_diarios.data), não UTC.
  const dataLimiteStr = dataInicioJanela(janelaHoras);

  const { data: registrosDiarios, error: erroRegistros } = await supabase
    .from('registros_diarios')
    .select('id')
    .eq('user_id', usuarioId)
    .gte('data', dataLimiteStr);
  if (erroRegistros) throw erroRegistros;

  const registroIds = (registrosDiarios ?? []).map((r) => r.id);
  if (registroIds.length === 0) return false;

  if (tipoHabito === 'atividade_fisica') {
    const { count, error } = await supabase
      .from('registros_atividade_fisica')
      .select('id', { count: 'exact', head: true })
      .in('registro_diario_id', registroIds);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  if (tipoHabito === 'agua') {
    const { count, error } = await supabase
      .from('registros_agua')
      .select('id', { count: 'exact', head: true })
      .in('registro_diario_id', registroIds);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  if (tipoHabito === 'alimentacao') {
    const { count, error } = await supabase
      .from('refeicoes')
      .select('id', { count: 'exact', head: true })
      .in('registro_diario_id', registroIds);
    if (error) throw error;
    return (count ?? 0) > 0;
  }

  console.warn('tipo_habito desconhecido em verificarHabitoRecente:', tipoHabito);
  return false;
}

// ============================================================
// Conclusão de lição — com detecção de fechamento de Módulo/Trilha
// ============================================================

export type NivelConclusao = 'licao' | 'modulo' | 'trilha';

export type ResultadoConclusao = {
  nivel: NivelConclusao;
  // XP da lição em si (0 se já tinha sido concluída antes — não concede de novo)
  xpGanhoLicao: number;
  // XP de bônus por fechar módulo/trilha, só preenchido quando nivel !== 'licao'
  xpGanhoBonus: number;
  // % de acerto do quiz que fechou o módulo/trilha (0-100). Null quando
  // nivel === 'licao' (tela de lição não mostra ACERTOS, ver seção 6 do
  // modelo-pedagogico-trilha.md) ou quando a lição não é quiz.
  acertosPercentual: number | null;
};

/**
 * Marca a lição como concluída e resolve, na mesma chamada, se isso fecha o
 * módulo e/ou a trilha inteira (última lição de cada um), concedendo o XP
 * de bônus correspondente quando for o caso.
 *
 * Idempotente: se a lição já estava concluída (usuário reabriu uma lição
 * antiga), não concede XP de lição de novo — e também não recalcula/concede
 * bônus de módulo/trilha de novo (só é concedido no exato momento em que a
 * ÚLTIMA lição pendente daquele nível é concluída pela primeira vez).
 */
/** Eventos da lição (não bloqueiam nem derrubam a conclusão). trilha_iniciada = 1ª lição concluída da trilha. */
function emitirEventosDeLicao(usuarioId: string, licaoId: string, trilhaId?: string) {
  registrarEvento('licao_concluida', trilhaId ? { licao_id: licaoId, trilha_id: trilhaId } : { licao_id: licaoId }, { userId: usuarioId });
  if (!trilhaId) return;
  supabase
    .from('progresso_licao')
    .select('licao_id, licoes!inner(modulos_trilha!inner(trilha_id))', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId)
    .eq('licoes.modulos_trilha.trilha_id', trilhaId)
    .then(
      ({ count }) => {
        if (count === 1) registrarEvento('trilha_iniciada', { trilha_id: trilhaId }, { userId: usuarioId });
      },
      () => {}
    );
}

export async function concluirLicaoComProgresso(
  usuarioId: string,
  licaoId: string,
  xpRecompensa: number,
  acertos: number | null = null,
  totalQuestoes: number | null = null
): Promise<ResultadoConclusao> {
  // Não confia apenas no estado da tela: uma rota pode ser aberta
  // programaticamente ou ficar desatualizada entre duas telas. A mesma regra
  // usada para pintar o caminho (inclusive o bloqueio entre trilhas) é
  // revalidada antes de gravar o progresso.
  const caminho = await buscarTrilhasComProgresso(usuarioId);
  const noDaLicao = caminho.nos.find((no) => no.id === licaoId);
  if (!noDaLicao || noDaLicao.status === 'bloqueada') {
    throw new Error('Esta lição ainda está bloqueada. Conclua a etapa atual para liberá-la.');
  }

  // 1. já tinha progresso antes desta chamada?
  const { data: progressoExistente, error: erroCheck } = await supabase
    .from('progresso_licao')
    .select('licao_id')
    .eq('usuario_id', usuarioId)
    .eq('licao_id', licaoId)
    .maybeSingle();
  if (erroCheck) throw erroCheck;

  const jaEstavaConcluida = !!progressoExistente;

  const acertosPercentualDaQuestao =
    acertos != null && totalQuestoes ? Math.round((100 * acertos) / totalQuestoes) : null;

  // Não é a primeira conclusão: não concede XP de novo (nem de lição, nem de
  // bônus — o bônus só é dado no instante em que o nível fecha pela primeira
  // vez). Só devolve o nível bruto pra navegação continuar fazendo sentido
  // (reabrir a última lição de um módulo já visto ainda deve levar pra
  // "Módulo completo!", só que sem XP).
  const resultadoSemXp = async (): Promise<ResultadoConclusao> => {
    const nivel = await resolverNivelConclusao(licaoId);
    return {
      nivel,
      xpGanhoLicao: 0,
      xpGanhoBonus: 0,
      acertosPercentual: nivel === 'licao' ? null : acertosPercentualDaQuestao,
    };
  };

  if (jaEstavaConcluida) return resultadoSemXp();

  // 2. grava o progresso da lição e concede o XP normal dela
  const { error: erroProgresso } = await supabase
    .from('progresso_licao')
    .insert({ usuario_id: usuarioId, licao_id: licaoId, xp_ganho: xpRecompensa });
  if (erroProgresso) {
    // 23505 = unique_violation: outra chamada gravou o mesmo progresso entre o
    // "já concluiu?" de cima e este insert (duplo toque, por exemplo). Quem
    // gravou primeiro já concedeu o XP, então aqui não se concede de novo e
    // também não se mostra erro.
    if ((erroProgresso as { code?: string }).code === '23505') return resultadoSemXp();
    throw erroProgresso;
  }

  const xpLicaoConcedido = await concederXp('licao', licaoId);

  // 3. busca módulo/trilha da lição pra saber se ela é a última de cada um
  const { data: licao, error: erroLicao } = await supabase
    .from('licoes')
    .select('id, modulo_id, modulos_trilha ( id, trilha_id, ordem, xp_bonus, trilhas ( id, xp_bonus ) )')
    .eq('id', licaoId)
    .single();
  if (erroLicao) throw erroLicao;

  const moduloId: string = licao.modulo_id;
  const modulo: any = licao.modulos_trilha;
  const trilhaId: string | undefined = modulo?.trilha_id;
  emitirEventosDeLicao(usuarioId, licaoId, trilhaId);

  // 4. todas as lições do módulo já concluídas (incluindo essa que acabou de gravar)?
  const { data: licoesDoModulo, error: erroLicoesModulo } = await supabase
    .from('licoes')
    .select('id')
    .eq('modulo_id', moduloId);
  if (erroLicoesModulo) throw erroLicoesModulo;

  const idsLicoesModulo = (licoesDoModulo ?? []).map((l) => l.id);
  const { data: progressoModulo, error: erroProgressoModulo } = await supabase
    .from('progresso_licao')
    .select('licao_id')
    .eq('usuario_id', usuarioId)
    .in('licao_id', idsLicoesModulo);
  if (erroProgressoModulo) throw erroProgressoModulo;

  const moduloFechou = (progressoModulo ?? []).length >= idsLicoesModulo.length;

  if (!moduloFechou) {
    return { nivel: 'licao', xpGanhoLicao: xpLicaoConcedido, xpGanhoBonus: 0, acertosPercentual: null };
  }

  // 5. módulo fechou nesta chamada — concede bônus de módulo
  const xpBonusModulo = await concederXp('bonus_modulo', moduloId);

  if (!trilhaId) {
    return {
      nivel: 'modulo',
      xpGanhoLicao: xpLicaoConcedido,
      xpGanhoBonus: xpBonusModulo,
      acertosPercentual: acertosPercentualDaQuestao,
    };
  }

  // 6. essa também era a última lição pendente da trilha inteira?
  const { data: modulosDaTrilha, error: erroModulosTrilha } = await supabase
    .from('modulos_trilha')
    .select('id')
    .eq('trilha_id', trilhaId);
  if (erroModulosTrilha) throw erroModulosTrilha;

  const idsModulosTrilha = (modulosDaTrilha ?? []).map((m) => m.id);
  const { data: licoesDaTrilha, error: erroLicoesTrilha } = await supabase
    .from('licoes')
    .select('id')
    .in('modulo_id', idsModulosTrilha);
  if (erroLicoesTrilha) throw erroLicoesTrilha;

  const idsLicoesTrilha = (licoesDaTrilha ?? []).map((l) => l.id);
  const { data: progressoTrilha, error: erroProgressoTrilha } = await supabase
    .from('progresso_licao')
    .select('licao_id')
    .eq('usuario_id', usuarioId)
    .in('licao_id', idsLicoesTrilha);
  if (erroProgressoTrilha) throw erroProgressoTrilha;

  const trilhaFechou = (progressoTrilha ?? []).length >= idsLicoesTrilha.length;

  if (!trilhaFechou) {
    return {
      nivel: 'modulo',
      xpGanhoLicao: xpLicaoConcedido,
      xpGanhoBonus: xpBonusModulo,
      acertosPercentual: acertosPercentualDaQuestao,
    };
  }

  if (trilhaId) registrarEvento('trilha_concluida', { trilha_id: trilhaId }, { userId: usuarioId });
  const xpBonusTrilha = await concederXp('bonus_trilha', trilhaId);

  return {
    nivel: 'trilha',
    xpGanhoLicao: xpLicaoConcedido,
    xpGanhoBonus: xpBonusModulo + xpBonusTrilha,
    acertosPercentual: acertosPercentualDaQuestao,
  };
}

/**
 * Usado só no caminho de "lição já estava concluída antes" — recalcula em
 * que nível a navegação deveria cair (lição/módulo/trilha), sem conceder
 * XP nenhum, só olhando o progresso já salvo.
 */
async function resolverNivelConclusao(licaoId: string): Promise<NivelConclusao> {
  const { data: licao, error: erroLicao } = await supabase
    .from('licoes')
    .select('id, modulo_id, modulos_trilha ( id, trilha_id )')
    .eq('id', licaoId)
    .single();
  if (erroLicao) throw erroLicao;

  const moduloId: string = licao.modulo_id;
  const trilhaId: string | undefined = (licao.modulos_trilha as any)?.trilha_id;

  const { data: licoesDoModulo } = await supabase.from('licoes').select('id').eq('modulo_id', moduloId);
  const idsLicoesModulo = (licoesDoModulo ?? []).map((l) => l.id);

  if (idsLicoesModulo.length === 0 || !trilhaId) return 'licao';

  // essa lição é a última do módulo? (maior `ordem` DENTRO do módulo)
  const ehUltimaDoModulo = await ehUltimaLicao(licaoId, idsLicoesModulo);
  if (!ehUltimaDoModulo) return 'licao';

  // e é a última da trilha? `licoes.ordem` reinicia a cada módulo (1 a 5), então
  // comparar a `ordem` entre módulos empata: a última da trilha é a de maior
  // `ordem` do ÚLTIMO módulo.
  const { data: ultimoModulo } = await supabase
    .from('modulos_trilha')
    .select('id')
    .eq('trilha_id', trilhaId)
    .order('ordem', { ascending: false })
    .limit(1);
  const ultimoModuloId = ultimoModulo?.[0]?.id;
  if (!ultimoModuloId || ultimoModuloId !== moduloId) return 'modulo';

  return 'trilha';
}

async function ehUltimaLicao(licaoId: string, idsCandidatos: string[]): Promise<boolean> {
  if (!idsCandidatos.includes(licaoId)) return false;
  const { data } = await supabase.from('licoes').select('id, ordem').in('id', idsCandidatos).order('ordem', { ascending: false }).limit(1);
  return data?.[0]?.id === licaoId;
}