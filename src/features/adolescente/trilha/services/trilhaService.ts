// src/features/adolescente/services/trilhaService.ts
import { supabase } from '../../../../lib/supabase';
import { concederXp } from '../../../../shared/services/xpService';
import type { NoTrilha } from '../components/TrilhaPath';

export type Trilha = {
  id: string;
  titulo: string;
  descricao: string | null;
  tema: string;
  ordem: number;
};

export type TipoLicao = 'conteudo' | 'quiz' | 'atividade_rastreavel';

export type LicaoDaTrilha = {
  id: string;
  moduloId: string;
  titulo: string;
  ordem: number;
  tipo: TipoLicao;
  xpRecompensa: number;
};

export type TrilhaComProgresso = {
  trilha: Trilha;
  nos: NoTrilha[];
  // mesma ordem dos nós — pra quem precisar do detalhe (título, tipo, xp) além do status
  licoes: LicaoDaTrilha[];
};

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
    .select('id, titulo, descricao, tema, ordem')
    .eq('status', 'aprovada');

  query = trilhaId ? query.eq('id', trilhaId) : query.order('ordem').limit(1);

  const { data: trilhasData, error: erroTrilha } = await query;
  if (erroTrilha) throw erroTrilha;
  const trilha = trilhasData?.[0] as Trilha | undefined;
  if (!trilha) return null;

  // 2. módulos, na ordem
  const { data: modulos, error: erroModulos } = await supabase
    .from('modulos_trilha')
    .select('id, ordem')
    .eq('trilha_id', trilha.id)
    .order('ordem');
  if (erroModulos) throw erroModulos;
  if (!modulos || modulos.length === 0) {
    return { trilha, nos: [], licoes: [] };
  }

  // 3. lições de todos os módulos
  const moduloIds = modulos.map((m) => m.id);
  const { data: licoesData, error: erroLicoes } = await supabase
    .from('licoes')
    .select('id, modulo_id, titulo, ordem, tipo, xp_recompensa')
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
    return { trilha, nos: [], licoes: [] };
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

  // 5. status de cada nó: concluída (tem progresso), atual (primeira pendente), bloqueada (resto)
  let jaMarcouAtual = false;
  const nos: NoTrilha[] = licoesOrdenadas.map((licao) => {
    let status: NoTrilha['status'];
    if (concluidas.has(licao.id)) {
      status = 'concluida';
    } else if (!jaMarcouAtual) {
      status = 'atual';
      jaMarcouAtual = true;
    } else {
      status = 'bloqueada';
    }
    return { id: licao.id, status };
  });

  const licoes: LicaoDaTrilha[] = licoesOrdenadas.map((l) => ({
    id: l.id,
    moduloId: l.modulo_id,
    titulo: l.titulo,
    ordem: l.ordem,
    tipo: l.tipo,
    xpRecompensa: l.xp_recompensa,
  }));

  return { trilha, nos, licoes };
}

// ============================================================
// Detalhe de uma lição específica (conteúdo / quiz / atividade rastreável)
// ============================================================

export type OpcaoQuiz = {
  id: string;
  texto: string;
  correta: boolean;
  ordem: number;
};

export type QuestaoQuiz = {
  id: string;
  enunciado: string;
  ordem: number;
  opcoes: OpcaoQuiz[];
};

export type DetalheLicao = {
  id: string;
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
    .select('id, titulo, tipo, xp_recompensa, conteudo, tipo_habito, criterio_conclusao')
    .eq('id', licaoId)
    .single();
  if (erroLicao) throw erroLicao;

  const detalhe: DetalheLicao = {
    id: licao.id,
    titulo: licao.titulo,
    tipo: licao.tipo,
    xpRecompensa: licao.xp_recompensa,
    texto: licao.conteudo?.texto ?? null,
    questoes: [],
    tipoHabito: licao.tipo_habito ?? null,
    janelaHoras: licao.criterio_conclusao?.janela_horas ?? null,
  };

  if (licao.tipo === 'quiz') {
    const { data: questoes, error: erroQuestoes } = await supabase
      .from('questoes_quiz')
      .select('id, enunciado, ordem, opcoes_quiz ( id, texto, correta, ordem )')
      .eq('licao_id', licaoId)
      .order('ordem');
    if (erroQuestoes) throw erroQuestoes;

    detalhe.questoes = (questoes ?? []).map((q: any) => ({
      id: q.id,
      enunciado: q.enunciado,
      ordem: q.ordem,
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

/**
 * Marca a lição como concluída (grava XP ganho junto, pra bater com a UNIQUE
 * (usuario_id, licao_id) — não duplica se já tiver progresso) e soma o XP total
 * do usuário em `xp_usuario`.
 */
export async function concluirLicao(usuarioId: string, licaoId: string, xpRecompensa: number): Promise<void> {
  const { error: erroProgresso } = await supabase
    .from('progresso_licao')
    .upsert({ usuario_id: usuarioId, licao_id: licaoId, xp_ganho: xpRecompensa }, { onConflict: 'usuario_id,licao_id', ignoreDuplicates: true });
  if (erroProgresso) throw erroProgresso;

  await concederXp(usuarioId, xpRecompensa);
}