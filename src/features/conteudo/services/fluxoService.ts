// src/features/conteudo/services/fluxoService.ts
// Fluxo de aprovação. Permissões garantidas no banco (conteudo_transicionar / RLS);
// aqui só chamamos as funções.
import { supabase } from '../../../lib/supabase';
import type { AcaoFluxo, StatusFluxo, TipoConteudo } from '../utils/fluxo';

export type ItemFluxo = {
  id: string;
  tipo: TipoConteudo;
  conteudoId: string;
  titulo: string;
  status: StatusFluxo;
  versao: number;
  criadorNome: string | null;
  criadoEm: string;
  revisorNome: string | null;
  revisadoEm: string | null;
  motivoRejeicao: string | null;
  publicadoEm: string | null;
  atualizadoEm: string;
};

export type RegistroAuditoria = {
  id: string;
  tipo: TipoConteudo;
  conteudoId: string;
  titulo: string | null;
  versao: number | null;
  acao: string;
  statusAnterior: string | null;
  statusNovo: string | null;
  atorNome: string | null;
  atorPapel: string | null;
  motivo: string | null;
  criadoEm: string;
};

export async function listarFluxo(tipo?: TipoConteudo, status?: StatusFluxo[]): Promise<ItemFluxo[]> {
  const { data, error } = await supabase.rpc('conteudo_listar', {
    p_tipo: tipo ?? null,
    p_status: status && status.length ? status : null,
  });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    tipo: r.tipo,
    conteudoId: r.conteudo_id,
    titulo: r.titulo,
    status: r.status,
    versao: r.versao,
    criadorNome: r.criador_nome,
    criadoEm: r.criado_em,
    revisorNome: r.revisor_nome,
    revisadoEm: r.revisado_em,
    motivoRejeicao: r.motivo_rejeicao,
    publicadoEm: r.publicado_em,
    atualizadoEm: r.atualizado_em,
  }));
}

export async function transicionar(
  tipo: TipoConteudo,
  conteudoId: string,
  acao: AcaoFluxo,
  motivo?: string
): Promise<void> {
  const { error } = await supabase.rpc('conteudo_transicionar', {
    p_tipo: tipo,
    p_id: conteudoId,
    p_acao: acao,
    p_motivo: motivo?.trim() || null,
  });
  if (error) throw error;
}

export async function listarAuditoria(limite = 100, tipo?: TipoConteudo): Promise<RegistroAuditoria[]> {
  const { data, error } = await supabase.rpc('conteudo_auditoria_listar', {
    p_limite: limite,
    p_tipo: tipo ?? null,
  });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    tipo: r.tipo,
    conteudoId: r.conteudo_id,
    titulo: r.titulo,
    versao: r.versao,
    acao: r.acao,
    statusAnterior: r.status_anterior,
    statusNovo: r.status_novo,
    atorNome: r.ator_nome,
    atorPapel: r.ator_papel,
    motivo: r.motivo,
    criadoEm: r.criado_em,
  }));
}

export type CorpoTrilha = {
  titulo: string;
  descricao: string | null;
  tema: string;
  modulos: {
    id: string;
    titulo: string;
    ordem: number;
    licoes: { id: string; titulo: string; ordem: number; tipo: string; xp: number }[];
  }[];
};
export type CorpoReceita = {
  titulo: string;
  modo_preparo: string | null;
  tempo_preparo_min: number | null;
  porcoes: number | null;
  dificuldade: string | null;
  passos: { ordem: number; titulo: string; descricao: string }[];
  ingredientes: { nome: string; proporcao: number | null }[];
};
export type EventoHistorico = {
  acao: string;
  statusAnterior: string | null;
  statusNovo: string | null;
  atorNome: string | null;
  atorPapel: string | null;
  motivo: string | null;
  versao: number | null;
  criadoEm: string;
};
export type DetalheConteudo = {
  tipo: TipoConteudo;
  conteudoId: string;
  status: StatusFluxo;
  versao: number;
  motivoRejeicao: string | null;
  criadoEm: string;
  criadorNome: string | null;
  revisorNome: string | null;
  revisadoEm: string | null;
  publicadoEm: string | null;
  atualizadoEm: string;
  corpo: CorpoTrilha | CorpoReceita;
  historico: EventoHistorico[];
};

/** Conteúdo completo, em qualquer status, para Admin e Nutricionista (leitura no banco). */
export async function buscarDetalhe(tipo: TipoConteudo, conteudoId: string): Promise<DetalheConteudo> {
  const { data, error } = await supabase.rpc('conteudo_detalhe', { p_tipo: tipo, p_id: conteudoId });
  if (error) throw error;
  const r: any = data;
  return {
    tipo: r.tipo,
    conteudoId: r.conteudo_id,
    status: r.status,
    versao: r.versao,
    motivoRejeicao: r.motivo_rejeicao,
    criadoEm: r.criado_em,
    criadorNome: r.criador_nome,
    revisorNome: r.revisor_nome,
    revisadoEm: r.revisado_em,
    publicadoEm: r.publicado_em,
    atualizadoEm: r.atualizado_em,
    corpo: r.corpo,
    historico: (r.historico ?? []).map((h: any) => ({
      acao: h.acao,
      statusAnterior: h.status_anterior,
      statusNovo: h.status_novo,
      atorNome: h.ator_nome,
      atorPapel: h.ator_papel,
      motivo: h.motivo,
      versao: h.versao,
      criadoEm: h.criado_em,
    })),
  };
}
