// src/features/conteudo/services/edicaoService.ts
// Criar e editar trilhas, lições e receitas. As permissões são do banco (RLS + triggers do
// fluxo): a nutricionista edita sem perder o status (sobe a versão), o Admin volta o
// conteúdo para rascunho, e o status só muda por conteudo_transicionar.
import { supabase } from '../../../lib/supabase';
import type { LicaoPayload, PassoPayload } from '../utils/passosEdicao';
import type { ReceitaPayload } from '../utils/receitaEdicao';

function falha(error: { message: string } | null): never | void {
  if (error) throw error;
}

// ---------------------------------------------------------------- trilha
export type TrilhaEditavel = {
  id: string;
  titulo: string;
  descricao: string | null;
  tema: string;
  ordem: number;
  xpBonus: number | null;
  modulos: {
    id: string;
    titulo: string;
    ordem: number;
    xpBonus: number | null;
    licoes: { id: string; titulo: string; ordem: number; tipo: string; xp: number; icone: string | null; passos: number }[];
  }[];
};

export async function listarTemas(): Promise<string[]> {
  const { data, error } = await supabase.rpc('painel_trilha_temas');
  falha(error);
  return (data ?? []) as string[];
}

export async function buscarTrilhaEditavel(id: string): Promise<TrilhaEditavel> {
  const { data, error } = await supabase
    .from('trilhas')
    .select('id, titulo, descricao, tema, ordem, xp_bonus, modulos_trilha(id, titulo, ordem, xp_bonus, licoes(id, titulo, ordem, tipo, xp_recompensa, icone, questoes_quiz(count)))')
    .eq('id', id)
    .single();
  falha(error);
  const t: any = data;
  return {
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    tema: String(t.tema),
    ordem: t.ordem ?? 0,
    xpBonus: t.xp_bonus ?? null,
    modulos: [...(t.modulos_trilha ?? [])]
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((m: any) => ({
        id: m.id,
        titulo: m.titulo,
        ordem: m.ordem,
        xpBonus: m.xp_bonus ?? null,
        licoes: [...(m.licoes ?? [])]
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((l: any) => ({
            id: l.id,
            titulo: l.titulo,
            ordem: l.ordem,
            tipo: String(l.tipo),
            xp: l.xp_recompensa,
            icone: l.icone ?? null,
            passos: l.questoes_quiz?.[0]?.count ?? 0,
          })),
      })),
  };
}

export type TrilhaOrdemLinha = { id: string; titulo: string; ordem: number; status: string; criadoEm: string | null };

/** Todas as trilhas com a ordem e o status (para sugerir a ordem e avisar qual o adolescente vê). */
export async function listarTrilhasOrdem(): Promise<TrilhaOrdemLinha[]> {
  const { data, error } = await supabase.from('trilhas').select('id, titulo, ordem, status, criado_em').order('ordem');
  falha(error);
  return (data ?? []).map((t: any) => ({ id: t.id, titulo: t.titulo, ordem: t.ordem ?? 0, status: String(t.status), criadoEm: t.criado_em ?? null }));
}

export async function criarTrilha(d: { titulo: string; descricao: string; tema: string; ordem: number; xpBonus?: number | null }): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão expirada. Entre novamente.');
  const { data, error } = await supabase
    .from('trilhas')
    .insert({
      titulo: d.titulo.trim(),
      descricao: d.descricao.trim() || null,
      tema: d.tema,
      ordem: d.ordem,
      xp_bonus: d.xpBonus ?? null,
      criado_por: auth.user.id,
    })
    .select('id')
    .single();
  falha(error);
  return (data as any).id as string;
}

/**
 * Atualiza SÓ os campos que vierem em `d`. Importante: o trigger do fluxo dispara quando titulo,
 * descricao ou tema aparecem no UPDATE (mesmo com o mesmo valor); por isso quem chama deve mandar
 * apenas o que mudou. Status e aprovação NÃO passam por aqui (só pelo fluxo de aprovação).
 */
export async function salvarTrilha(
  id: string,
  d: { titulo?: string; descricao?: string; tema?: string; ordem?: number; xpBonus?: number | null }
): Promise<void> {
  const campos: Record<string, any> = {};
  if (d.titulo !== undefined) campos.titulo = d.titulo.trim();
  if (d.descricao !== undefined) campos.descricao = d.descricao.trim() || null;
  if (d.tema !== undefined) campos.tema = d.tema;
  if (d.ordem !== undefined) campos.ordem = d.ordem;
  if (d.xpBonus !== undefined) campos.xp_bonus = d.xpBonus;
  if (Object.keys(campos).length === 0) return;
  const { error } = await supabase.from('trilhas').update(campos).eq('id', id);
  falha(error);
}

export async function criarModulo(trilhaId: string, titulo: string, ordem: number): Promise<void> {
  const { error } = await supabase.from('modulos_trilha').insert({ trilha_id: trilhaId, titulo: titulo.trim(), ordem });
  falha(error);
}

export async function renomearModulo(id: string, titulo: string): Promise<void> {
  const { error } = await supabase.from('modulos_trilha').update({ titulo: titulo.trim() }).eq('id', id);
  falha(error);
}

export async function salvarModulo(id: string, d: { titulo?: string; xpBonus?: number | null }): Promise<void> {
  const campos: Record<string, any> = {};
  if (d.titulo !== undefined) campos.titulo = d.titulo.trim();
  if (d.xpBonus !== undefined) campos.xp_bonus = d.xpBonus;
  if (Object.keys(campos).length === 0) return;
  const { error } = await supabase.from('modulos_trilha').update(campos).eq('id', id);
  falha(error);
}

function erroDeFuncao(error: { message: string; code?: string }, migration: string): Error {
  if (error.code === 'PGRST202' || /could not find the function/i.test(String(error.message))) {
    return new Error(`O banco ainda não tem esta função. Rode ${migration} no Supabase.`);
  }
  return error as unknown as Error;
}

/** Nova ordem dos módulos (nivel 'MODULO', pai = trilha) ou das lições (nivel 'LICAO', pai = módulo). Atômico. */
export async function reordenarItens(nivel: 'MODULO' | 'LICAO', paiId: string, idsNaOrdem: string[]): Promise<void> {
  const { error } = await supabase.rpc('conteudo_reordenar', { p_nivel: nivel, p_pai_id: paiId, p_ids: idsNaOrdem });
  if (error) throw erroDeFuncao(error, 'migration_trilha_estrutura.sql');
}

/** Exclui módulo/lição com os passos. O banco recusa se adolescentes já concluíram a lição. */
export async function excluirItem(nivel: 'MODULO' | 'LICAO', id: string): Promise<void> {
  const { error } = await supabase.rpc('conteudo_excluir_item', { p_nivel: nivel, p_id: id });
  if (error) throw erroDeFuncao(error, 'migration_trilha_estrutura.sql');
}

// ---------------------------------------------------------------- lição
export type OpcaoEditavel = { id: string; texto: string; correta: boolean; ordem: number; categoria: string | null };
export type QuestaoEditavel = {
  id: string;
  enunciado: string;
  formato: string;
  dadosExtra: Record<string, any>;
  opcoes: OpcaoEditavel[];
};
export type LicaoEditavel = {
  id: string;
  moduloId: string;
  titulo: string;
  tipo: string;
  xp: number;
  icone: string | null;
  tipoHabito: string | null;
  janelaHoras: number | null;
  conteudo: Record<string, any> | null;
  questoes: QuestaoEditavel[];
};

export async function buscarLicaoEditavel(id: string): Promise<LicaoEditavel> {
  const { data, error } = await supabase
    .from('licoes')
    .select('id, modulo_id, titulo, tipo, xp_recompensa, icone, tipo_habito, criterio_conclusao, conteudo, questoes_quiz(id, enunciado, ordem, formato, dados_extra, opcoes_quiz(id, texto, correta, ordem, categoria))')
    .eq('id', id)
    .single();
  falha(error);
  const l: any = data;
  return {
    id: l.id,
    moduloId: l.modulo_id,
    titulo: l.titulo,
    tipo: String(l.tipo),
    xp: l.xp_recompensa,
    icone: l.icone ?? null,
    tipoHabito: l.tipo_habito ? String(l.tipo_habito) : null,
    janelaHoras: l.criterio_conclusao?.janela_horas ?? null,
    conteudo: l.conteudo ?? null,
    questoes: [...(l.questoes_quiz ?? [])]
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((q: any) => ({
        id: q.id,
        enunciado: q.enunciado,
        formato: q.formato ?? 'multipla_escolha',
        dadosExtra: q.dados_extra ?? {},
        opcoes: [...(q.opcoes_quiz ?? [])]
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((o: any) => ({ id: o.id, texto: o.texto, correta: !!o.correta, ordem: o.ordem, categoria: o.categoria ?? null })),
      })),
  };
}

export async function salvarLicao(id: string, d: { titulo: string; xp: number; conteudo?: Record<string, any> | null }): Promise<void> {
  const patch: Record<string, any> = { titulo: d.titulo.trim(), xp_recompensa: d.xp };
  if (d.conteudo !== undefined) patch.conteudo = d.conteudo;
  const { error } = await supabase.from('licoes').update(patch).eq('id', id);
  falha(error);
}

export async function salvarQuestao(id: string, d: { enunciado: string; dadosExtra?: Record<string, any> }): Promise<void> {
  const patch: Record<string, any> = { enunciado: d.enunciado.trim() };
  if (d.dadosExtra) patch.dados_extra = d.dadosExtra;
  const { error } = await supabase.from('questoes_quiz').update(patch).eq('id', id);
  falha(error);
}

export async function salvarOpcao(id: string, d: { texto: string; correta: boolean }): Promise<void> {
  const { error } = await supabase.from('opcoes_quiz').update({ texto: d.texto.trim(), correta: d.correta }).eq('id', id);
  falha(error);
}

/**
 * Cria (sem `id`) ou atualiza (com `id`) uma lição COM todos os passos e alternativas, numa
 * única transação do banco (função conteudo_salvar_licao, migration_licao_atomica.sql).
 * A permissão (Admin/Nutricionista) e a validação são conferidas dentro da função.
 */
export async function salvarLicaoCompleta(d: {
  id?: string;
  moduloId?: string;
  ordem?: number;
  licao: LicaoPayload;
  passos: PassoPayload[];
}): Promise<string> {
  const { data, error } = await supabase.rpc('conteudo_salvar_licao', {
    p_licao_id: d.id ?? null,
    p_modulo_id: d.moduloId ?? null,
    p_licao: { ...d.licao, ...(d.ordem !== undefined ? { ordem: d.ordem } : {}) },
    p_passos: d.passos,
  });
  if (error) {
    const msg = String(error.message ?? '');
    if ((error as any).code === 'PGRST202' || /could not find the function/i.test(msg)) {
      throw new Error('O banco ainda não tem a função de salvar lição. Rode migration_licao_atomica.sql no Supabase.');
    }
    throw error;
  }
  return data as string;
}

/** Lição de leitura: um cartão de conteúdo (formato 'cartao'), mesmo padrão das trilhas existentes. */
export async function criarLicaoLeitura(moduloId: string, d: { titulo: string; texto: string; xp: number; ordem: number }): Promise<string> {
  const { data, error } = await supabase
    .from('licoes')
    .insert({ modulo_id: moduloId, titulo: d.titulo.trim(), ordem: d.ordem, tipo: 'conteudo', xp_recompensa: d.xp })
    .select('id')
    .single();
  falha(error);
  const licaoId = (data as any).id as string;
  const q = await supabase
    .from('questoes_quiz')
    .insert({ licao_id: licaoId, enunciado: d.titulo.trim(), ordem: 1, formato: 'cartao', dados_extra: { texto: d.texto.trim() } });
  falha(q.error);
  return licaoId;
}

// ---------------------------------------------------------------- receita
export type PassoEditavel = { id: string | null; ordem: number; titulo: string; descricao: string; fotoUrl?: string | null };
export type IngredienteEditavel = { id: string; alimentoId: string; nome: string; quantidade: string };
export type ReceitaEditavel = {
  id: string;
  titulo: string;
  modoPreparo: string;
  tempoPreparoMin: number | null;
  porcoes: number | null;
  dificuldade: string;
  alimentoResultanteId: string;
  alimentoResultanteNome: string;
  fotoUrl: string | null;
  ingredientes: IngredienteEditavel[];
  passos: PassoEditavel[];
};

export async function buscarReceitaEditavel(id: string): Promise<ReceitaEditavel> {
  const { data, error } = await supabase
    .from('receitas')
    .select('id, titulo, modo_preparo, tempo_preparo_min, porcoes, dificuldade, foto_url, alimento_resultante_id, prato:alimentos!receitas_alimento_resultante_id_fkey(nome), receita_ingredientes(id, alimento_id, quantidade_texto, alimentos(nome)), receita_passos(id, ordem, titulo, descricao, foto_url)')
    .eq('id', id)
    .single();
  falha(error);
  const r: any = data;
  return {
    id: r.id,
    titulo: r.titulo,
    modoPreparo: r.modo_preparo ?? '',
    tempoPreparoMin: r.tempo_preparo_min,
    porcoes: r.porcoes,
    dificuldade: String(r.dificuldade ?? 'FACIL'),
    alimentoResultanteId: r.alimento_resultante_id,
    alimentoResultanteNome: r.prato?.nome ?? '',
    fotoUrl: r.foto_url ?? null,
    ingredientes: (r.receita_ingredientes ?? [])
      .map((i: any) => ({ id: i.id, alimentoId: i.alimento_id, nome: i.alimentos?.nome ?? '', quantidade: i.quantidade_texto ?? '' }))
      .sort((a: IngredienteEditavel, b: IngredienteEditavel) => a.nome.localeCompare(b.nome, 'pt-BR')),
    passos: [...(r.receita_passos ?? [])]
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((p: any) => ({ id: p.id, ordem: p.ordem, titulo: p.titulo, descricao: p.descricao, fotoUrl: p.foto_url ?? null })),
  };
}

export async function listarPratos(busca: string): Promise<{ id: string; nome: string }[]> {
  let q = supabase.from('alimentos').select('id, nome').eq('eh_prato_composto', true).order('nome').limit(30);
  if (busca.trim()) q = q.ilike('nome', `%${busca.trim()}%`);
  const { data, error } = await q;
  falha(error);
  return (data ?? []) as { id: string; nome: string }[];
}

/** Busca alimentos do catálogo (para escolher o ingrediente de uma receita). */
export async function listarAlimentosBusca(busca: string): Promise<{ id: string; nome: string }[]> {
  let q = supabase.from('alimentos').select('id, nome').order('nome').limit(30);
  if (busca.trim()) q = q.ilike('nome', `%${busca.trim()}%`);
  const { data, error } = await q;
  falha(error);
  return (data ?? []) as { id: string; nome: string }[];
}

/**
 * Cria (sem `id`, com `alimentoId` = prato composto) ou atualiza (com `id`) uma receita COM
 * ingredientes e passos, numa única transação (conteudo_salvar_receita, migration_receita_atomica.sql).
 */
export async function salvarReceitaCompleta(d: { id?: string; alimentoId?: string; dados: ReceitaPayload }): Promise<string> {
  const { data, error } = await supabase.rpc('conteudo_salvar_receita', {
    p_receita_id: d.id ?? null,
    p_alimento_id: d.alimentoId ?? null,
    p_receita: d.dados.receita,
    p_ingredientes: d.dados.ingredientes,
    p_passos: d.dados.passos,
  });
  if (error) throw erroDeFuncao(error, 'migration_receita_atomica.sql');
  return data as string;
}

type DadosReceita = { titulo: string; modoPreparo: string; tempoPreparoMin: number | null; porcoes: number | null; dificuldade: string };

export async function criarReceita(alimentoId: string, d: DadosReceita): Promise<string> {
  const { data, error } = await supabase
    .from('receitas')
    .insert({
      alimento_resultante_id: alimentoId,
      titulo: d.titulo.trim(),
      modo_preparo: d.modoPreparo.trim(),
      tempo_preparo_min: d.tempoPreparoMin,
      porcoes: d.porcoes,
      dificuldade: d.dificuldade,
    })
    .select('id')
    .single();
  falha(error);
  return (data as any).id as string;
}

export async function salvarReceita(id: string, d: DadosReceita): Promise<void> {
  const { error } = await supabase
    .from('receitas')
    .update({
      titulo: d.titulo.trim(),
      modo_preparo: d.modoPreparo.trim(),
      tempo_preparo_min: d.tempoPreparoMin,
      porcoes: d.porcoes,
      dificuldade: d.dificuldade,
    })
    .eq('id', id);
  falha(error);
}

export async function salvarPasso(receitaId: string, p: PassoEditavel): Promise<void> {
  if (p.id) {
    const { error } = await supabase.from('receita_passos').update({ ordem: p.ordem, titulo: p.titulo.trim(), descricao: p.descricao.trim() }).eq('id', p.id);
    falha(error);
  } else {
    const { error } = await supabase.from('receita_passos').insert({ receita_id: receitaId, ordem: p.ordem, titulo: p.titulo.trim(), descricao: p.descricao.trim() });
    falha(error);
  }
}

export async function removerPasso(id: string): Promise<void> {
  const { error } = await supabase.from('receita_passos').delete().eq('id', id);
  falha(error);
}


// ---------------------------------------------------------------- troca (justificativa)
export type TrocaEditavel = {
  id: string;
  categoria: string;
  origemNome: string | null;
  destinoNome: string;
  frase: string;
  dica: string;
  rapida: boolean;
};

export async function buscarTrocaEditavel(id: string): Promise<TrocaEditavel> {
  const { data, error } = await supabase
    .from('alimento_trocas')
    .select('id, categoria, frase, dica, rapida, origem:alimentos!alimento_trocas_origem_id_fkey(nome), destino:alimentos!alimento_trocas_destino_id_fkey(nome)')
    .eq('id', id)
    .single();
  falha(error);
  const t: any = data;
  return {
    id: t.id,
    categoria: t.categoria,
    origemNome: t.origem?.nome ?? null,
    destinoNome: t.destino?.nome ?? '',
    frase: t.frase,
    dica: t.dica ?? '',
    rapida: !!t.rapida,
  };
}

/** Texto da troca. Status e versão são do fluxo (trigger fluxo_alteracao), não daqui. */
export async function salvarTroca(id: string, d: { frase: string; dica: string; rapida: boolean }): Promise<void> {
  const { error } = await supabase
    .from('alimento_trocas')
    .update({ frase: d.frase.trim(), dica: d.dica.trim() || null, rapida: d.rapida, atualizado_em: new Date().toISOString() })
    .eq('id', id);
  falha(error);
}
