// src/features/adolescente/services/trilhaService.ts
import { supabase } from '../../../../lib/supabase';
import { concederXp } from '../../../../shared/services/xpService';
import type { NoTrilha } from '../components/TrilhaPath';

// Fallbacks usados quando `xp_bonus` está nulo no banco (ver
// migration_progresso_modulo_trilha.sql) — combinados com o Figma.
const XP_BONUS_MODULO_PADRAO = 100;
const XP_BONUS_TRILHA_PADRAO = 125;

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
  ordem: number;
  titulo: string;
  subtitulo: string;
};

export type TrilhaComProgresso = {
  trilha: Trilha;
  modulos: ModuloDaTrilha[];
  nos: NoTrilha[];
  // mesma ordem dos nós — pra quem precisar do detalhe (título, tipo, xp) além do status
  licoes: LicaoDaTrilha[];
};

// Rótulo de módulo gerado por padrão fixo, não cadastrado no banco (decisão:
// modulos_trilha não tem coluna de título — ver referência "A1 Abertura",
// "A2 Aprofundamento", "A3 Consolidação"). A letra acompanha a ordem da
// TRILHA (só existe uma trilha ativa por vez hoje, então sempre "A"; se um
// dia houver mais de uma trilha simultânea, a 2ª vira "B" e por aí vai) e o
// número é a ordem do módulo dentro dela. A partir do 4º módulo, que a
// referência não cobre, cai num rótulo genérico "Módulo N".
const ETAPAS_MODULO = ['Abertura', 'Aprofundamento', 'Consolidação'];

function gerarTituloModulo(ordemTrilha: number, ordemModulo: number): string {
  // A ordem padrão do banco é 0. Para a primeira trilha, 0 e 1 representam
  // a letra A — assim nunca renderizamos "@1" na interface.
  const numeroDaTrilha = Math.max(1, ordemTrilha || 1);
  const letra = String.fromCharCode(64 + numeroDaTrilha); // 1 -> 'A', 2 -> 'B', ...
  const etapa = ETAPAS_MODULO[ordemModulo - 1];
  return etapa ? `${letra}${ordemModulo} ${etapa}` : `${letra}${ordemModulo} Módulo ${ordemModulo}`;
}

/**
 * Busca a trilha aprovada de menor `ordem` (por enquanto só existe uma trilha ativa
 * por vez — se um dia liberar mais de uma ao mesmo tempo, passar `trilhaId` explícito)
 * e monta a sequência de nós já cruzando com o progresso do usuário.
 */
export async function buscarTrilhaComProgresso(
  usuarioId: string,
  trilhaId?: string
): Promise<TrilhaComProgresso | null> {
  // 1. trilha aprovada
  let query = supabase
    .from('trilhas')
    .select('id, titulo, descricao, tema, ordem, xp_bonus')
    .eq('status', 'aprovada');

  query = trilhaId ? query.eq('id', trilhaId) : query.order('ordem').limit(1);

  const { data: trilhasData, error: erroTrilha } = await query;
  if (erroTrilha) throw erroTrilha;
  const trilhaRow = trilhasData?.[0];
  if (!trilhaRow) return null;
  const trilha: Trilha = {
    id: trilhaRow.id,
    titulo: trilhaRow.titulo,
    descricao: trilhaRow.descricao,
    tema: trilhaRow.tema,
    ordem: trilhaRow.ordem,
    xpBonus: trilhaRow.xp_bonus ?? null,
  };

  // 2. módulos, na ordem
  const { data: modulos, error: erroModulos } = await supabase
    .from('modulos_trilha')
    .select('id, titulo, ordem')
    .eq('trilha_id', trilha.id)
    .order('ordem');
  if (erroModulos) throw erroModulos;
  if (!modulos || modulos.length === 0) {
    return { trilha, modulos: [], nos: [], licoes: [] };
  }

  const modulosComTitulo: ModuloDaTrilha[] = modulos.map((m, i) => ({
    id: m.id,
    ordem: m.ordem,
    // O banco é a fonte de verdade para o título. O fallback mantém o app
    // compatível com registros antigos que ainda não tenham esse campo.
    titulo: m.titulo || gerarTituloModulo(trilha.ordem, i + 1),
    subtitulo: `Trilha: ${trilha.titulo}`,
  }));

  // 3. lições de todos os módulos
  const moduloIds = modulos.map((m) => m.id);
  const { data: licoesData, error: erroLicoes } = await supabase
    .from('licoes')
    .select('id, modulo_id, titulo, ordem, tipo, icone, xp_recompensa')
    .in('modulo_id', moduloIds);
  if (erroLicoes) throw erroLicoes;

  // reordena: primeiro pela ordem do módulo, depois pela ordem da lição dentro dele
  // (o `.order('ordem')` do Supabase não sabe encadear os dois níveis, então faz na mão)
  const ordemModulo = new Map(modulos.map((m, i) => [m.id, i]));
  const licoesOrdenadas = [...(licoesData ?? [])].sort((a, b) => {
    const modA = ordemModulo.get(a.modulo_id) ?? 0;
    const modB = ordemModulo.get(b.modulo_id) ?? 0;
    if (modA !== modB) return modA - modB;
    return a.ordem - b.ordem;
  });

  if (licoesOrdenadas.length === 0) {
    return { trilha, modulos: modulosComTitulo, nos: [], licoes: [] };
  }

  // 4. progresso do usuário nessas lições
  const licaoIds = licoesOrdenadas.map((l) => l.id);
  const { data: progresso, error: erroProgresso } = await supabase
    .from('progresso_licao')
    .select('licao_id')
    .eq('usuario_id', usuarioId)
    .in('licao_id', licaoIds);
  if (erroProgresso) throw erroProgresso;

  const concluidas = new Set((progresso ?? []).map((p) => p.licao_id));

  // 5. Status de cada nó: somente uma sequência CONTÍGUA de lições pode ficar
  // concluída. Isso evita que um registro antigo/inconsistente em uma lição à
  // frente "fure" o cadeado visual: depois da primeira pendência, todo o
  // restante continua bloqueado até que o usuário avance passo a passo.
  // `tipo` viaja junto no nó (não só na lista `licoes`) pra quem desenha o
  // caminho (TrilhaPath) resolver sozinho o estado visual de "prática real
  // pendente" — que é só a combinação status==='atual' + tipo==='atividade_rastreavel'
  // (ver seção 5 do modelo-pedagogico-trilha.md).
  let encontrouPrimeiraPendente = false;
  const nos: NoTrilha[] = licoesOrdenadas.map((licao) => {
    let status: NoTrilha['status'];
    if (!encontrouPrimeiraPendente && concluidas.has(licao.id)) {
      status = 'concluida';
    } else if (!encontrouPrimeiraPendente) {
      status = 'atual';
      encontrouPrimeiraPendente = true;
    } else {
      status = 'bloqueada';
    }
    return { id: licao.id, moduloId: licao.modulo_id, status, tipo: licao.tipo, icone: licao.icone ?? null };
  });

  const licoes: LicaoDaTrilha[] = licoesOrdenadas.map((l) => ({
    id: l.id,
    moduloId: l.modulo_id,
    titulo: l.titulo,
    ordem: l.ordem,
    tipo: l.tipo,
    icone: l.icone ?? null,
    xpRecompensa: l.xp_recompensa,
  }));

  return { trilha, modulos: modulosComTitulo, nos, licoes };
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
  | 'meta'; // plano "se… então…"; mesma convenção da enquete

export type QuestaoQuiz = {
  id: string;
  enunciado: string;
  ordem: number;
  formato: FormatoExercicio;
  // Convenções por formato (ver migration_formato_exercicios.sql):
  // - completar: nenhuma chave extra (usa o token {lacuna} no enunciado)
  // - ordene: nenhuma chave extra (usa a própria ordem de `opcoes`, já
  //   ordenada por `opcoes_quiz.ordem`, como gabarito)
  // - associe: dadosExtra.pares: ParAssocie[]
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
  const diasParaChecar = Math.max(1, Math.ceil(janelaHoras / 24));
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - (diasParaChecar - 1));
  const dataLimiteStr = dataLimite.toISOString().slice(0, 10);

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
export async function concluirLicaoComProgresso(
  usuarioId: string,
  licaoId: string,
  xpRecompensa: number,
  acertos: number | null = null,
  totalQuestoes: number | null = null
): Promise<ResultadoConclusao> {
  // Não confia apenas no estado da tela: uma rota pode ser aberta
  // programaticamente ou ficar desatualizada entre duas telas. A mesma regra
  // usada para pintar o caminho é revalidada antes de gravar o progresso.
  const { data: licaoParaValidacao, error: erroValidacao } = await supabase
    .from('licoes')
    .select('id, modulos_trilha ( trilha_id )')
    .eq('id', licaoId)
    .single();
  if (erroValidacao) throw erroValidacao;

  const trilhaIdParaValidacao: string | undefined = (licaoParaValidacao.modulos_trilha as any)?.trilha_id;
  if (trilhaIdParaValidacao) {
    const progressoDaTrilha = await buscarTrilhaComProgresso(usuarioId, trilhaIdParaValidacao);
    const noDaLicao = progressoDaTrilha?.nos.find((no) => no.id === licaoId);
    if (!noDaLicao || noDaLicao.status === 'bloqueada') {
      throw new Error('Esta lição ainda está bloqueada. Conclua a etapa atual para liberá-la.');
    }
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

  if (jaEstavaConcluida) {
    // Não é a primeira conclusão: não concede XP de novo (nem de lição, nem
    // de bônus — o bônus só é dado no instante em que o nível fecha pela
    // primeira vez). Só devolve o nível bruto pra navegação continuar
    // fazendo sentido (reabrir a última lição de um módulo já visto ainda
    // deve levar pra "Módulo completo!", só que sem XP).
    const nivel = await resolverNivelConclusao(licaoId);
    return {
      nivel,
      xpGanhoLicao: 0,
      xpGanhoBonus: 0,
      acertosPercentual: nivel === 'licao' ? null : acertosPercentualDaQuestao,
    };
  }

  // 2. grava o progresso da lição e concede o XP normal dela
  const { error: erroProgresso } = await supabase
    .from('progresso_licao')
    .insert({ usuario_id: usuarioId, licao_id: licaoId, xp_ganho: xpRecompensa });
  if (erroProgresso) throw erroProgresso;

  await concederXp(usuarioId, xpRecompensa);

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
    return { nivel: 'licao', xpGanhoLicao: xpRecompensa, xpGanhoBonus: 0, acertosPercentual: null };
  }

  // 5. módulo fechou nesta chamada — concede bônus de módulo
  const xpBonusModulo = modulo?.xp_bonus ?? XP_BONUS_MODULO_PADRAO;
  await concederXp(usuarioId, xpBonusModulo);

  if (!trilhaId) {
    return {
      nivel: 'modulo',
      xpGanhoLicao: xpRecompensa,
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
      xpGanhoLicao: xpRecompensa,
      xpGanhoBonus: xpBonusModulo,
      acertosPercentual: acertosPercentualDaQuestao,
    };
  }

  const xpBonusTrilha = modulo?.trilhas?.xp_bonus ?? XP_BONUS_TRILHA_PADRAO;
  await concederXp(usuarioId, xpBonusTrilha);

  return {
    nivel: 'trilha',
    xpGanhoLicao: xpRecompensa,
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
