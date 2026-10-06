// src/features/conteudo/services/edicaoService.ts
// Criar e editar trilhas, lições e receitas. As permissões são do banco (RLS + triggers do
// fluxo): a nutricionista edita sem perder o status (sobe a versão), o Admin volta o
// conteúdo para rascunho, e o status só muda por conteudo_transicionar.
import { supabase } from '../../../lib/supabase';

function falha(error: { message: string } | null): never | void {
  if (error) throw error;
}

// ---------------------------------------------------------------- trilha
export type TrilhaEditavel = {
  id: string;
  titulo: string;
  descricao: string | null;
  tema: string;
  modulos: { id: string; titulo: string; ordem: number; licoes: { id: string; titulo: string; ordem: number; tipo: string; xp: number }[] }[];
};

export async function listarTemas(): Promise<string[]> {
  const { data, error } = await supabase.rpc('painel_trilha_temas');
  falha(error);
  return (data ?? []) as string[];
}

export async function buscarTrilhaEditavel(id: string): Promise<TrilhaEditavel> {
  const { data, error } = await supabase
    .from('trilhas')
    .select('id, titulo, descricao, tema, modulos_trilha(id, titulo, ordem, licoes(id, titulo, ordem, tipo, xp_recompensa))')
    .eq('id', id)
    .single();
  falha(error);
  const t: any = data;
  return {
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    tema: String(t.tema),
    modulos: [...(t.modulos_trilha ?? [])]
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((m: any) => ({
        id: m.id,
        titulo: m.titulo,
        ordem: m.ordem,
        licoes: [...(m.licoes ?? [])]
          .sort((a: any, b: any) => a.ordem - b.ordem)
          .map((l: any) => ({ id: l.id, titulo: l.titulo, ordem: l.ordem, tipo: String(l.tipo), xp: l.xp_recompensa })),
      })),
  };
}

export async function criarTrilha(d: { titulo: string; descricao: string; tema: string }): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Sessão expirada. Entre novamente.');
  const { data, error } = await supabase
    .from('trilhas')
    .insert({ titulo: d.titulo.trim(), descricao: d.descricao.trim() || null, tema: d.tema, criado_por: auth.user.id })
    .select('id')
    .single();
  falha(error);
  return (data as any).id as string;
}

export async function salvarTrilha(id: string, d: { titulo: string; descricao: string }): Promise<void> {
  const { error } = await supabase.from('trilhas').update({ titulo: d.titulo.trim(), descricao: d.descricao.trim() || null }).eq('id', id);
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

// ---------------------------------------------------------------- lição
export type OpcaoEditavel = { id: string; texto: string; correta: boolean; ordem: number };
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
  conteudo: Record<string, any> | null;
  questoes: QuestaoEditavel[];
};

export async function buscarLicaoEditavel(id: string): Promise<LicaoEditavel> {
  const { data, error } = await supabase
    .from('licoes')
    .select('id, modulo_id, titulo, tipo, xp_recompensa, conteudo, questoes_quiz(id, enunciado, ordem, formato, dados_extra, opcoes_quiz(id, texto, correta, ordem))')
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
          .map((o: any) => ({ id: o.id, texto: o.texto, correta: !!o.correta, ordem: o.ordem })),
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
export type PassoEditavel = { id: string | null; ordem: number; titulo: string; descricao: string };
export type ReceitaEditavel = {
  id: string;
  titulo: string;
  modoPreparo: string;
  tempoPreparoMin: number | null;
  porcoes: number | null;
  dificuldade: string;
  alimentoResultanteId: string;
  passos: PassoEditavel[];
};

export async function buscarReceitaEditavel(id: string): Promise<ReceitaEditavel> {
  const { data, error } = await supabase
    .from('receitas')
    .select('id, titulo, modo_preparo, tempo_preparo_min, porcoes, dificuldade, alimento_resultante_id, receita_passos(id, ordem, titulo, descricao)')
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
    passos: [...(r.receita_passos ?? [])]
      .sort((a: any, b: any) => a.ordem - b.ordem)
      .map((p: any) => ({ id: p.id, ordem: p.ordem, titulo: p.titulo, descricao: p.descricao })),
  };
}

export async function listarPratos(busca: string): Promise<{ id: string; nome: string }[]> {
  let q = supabase.from('alimentos').select('id, nome').eq('eh_prato_composto', true).order('nome').limit(30);
  if (busca.trim()) q = q.ilike('nome', `%${busca.trim()}%`);
  const { data, error } = await q;
  falha(error);
  return (data ?? []) as { id: string; nome: string }[];
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
