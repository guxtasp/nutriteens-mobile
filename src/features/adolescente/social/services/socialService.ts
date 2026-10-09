// src/features/adolescente/social/services/socialService.ts
//
// Camada fina sobre as funções social_* do banco (ver
// data/migration_social_amizades.sql). As tabelas sociais não são acessíveis
// direto: tudo passa por `supabase.rpc`, e o banco filtra por quem está logado.
import { supabase } from '../../../../lib/supabase';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import { mapearPerfilAmigo, type LinhaPerfilAmigo, type PerfilAmigo } from '../utils/perfilAmigo';

export type { PerfilAmigo };

export type PerfilSocial = { apelido: string | null; avatar: string | null };

export type CodigoAmizade = { codigo: string; expiraEm: Date };

export type StatusConsulta = 'ok' | 'invalido' | 'proprio' | 'limite';
export type ResultadoConsulta = { status: StatusConsulta; apelido: string | null; avatar: string | null };

export type StatusSolicitacao =
  | 'enviada'
  | 'aceita'
  | 'ja_amigos'
  | 'invalido'
  | 'proprio'
  | 'limite'
  | 'limite_pendentes'
  | 'sem_apelido';

export type SolicitacaoSocial = {
  amizadeId: string;
  direcao: 'recebida' | 'enviada';
  apelido: string;
  avatar: string | null;
  criadoEm: Date;
};

export type AmigoSocial = { amizadeId: string; apelido: string; avatar: string | null; desde: Date | null };

/** O código de amizade só pode ser gerado depois de escolher um apelido. */
export class ApelidoObrigatorioError extends Error {
  constructor() {
    super('Escolha um apelido antes de gerar o código de amizade.');
    this.name = 'ApelidoObrigatorioError';
  }
}

export async function buscarPerfilSocial(): Promise<PerfilSocial> {
  const { data, error } = await supabase.rpc('social_meu_perfil');
  if (error) throw error;
  const linha = (data as { apelido: string | null; avatar: string | null }[] | null)?.[0];
  return { apelido: linha?.apelido ?? null, avatar: linha?.avatar ?? null };
}

/** Salva apelido e avatar. O apelido já deve ter passado por `validarApelido`. */
export async function definirPerfilSocial(
  apelido: string,
  avatar: string
): Promise<'ok' | 'apelido_invalido' | 'avatar_invalido'> {
  const { data, error } = await supabase.rpc('social_definir_perfil', { p_apelido: apelido, p_avatar: avatar });
  if (error) throw error;
  return data as 'ok' | 'apelido_invalido' | 'avatar_invalido';
}

/** Código atual (gera um se não houver ou se expirou). `renovar` troca por um novo. */
export async function obterCodigoAmizade(renovar = false): Promise<CodigoAmizade> {
  const { data, error } = await supabase.rpc('social_obter_ou_gerar_codigo', { p_renovar: renovar });
  if (error) {
    if (error.message === 'apelido_obrigatorio') throw new ApelidoObrigatorioError();
    throw error;
  }
  const linha = (data as { codigo: string; expira_em: string }[])[0];
  return { codigo: linha.codigo, expiraEm: new Date(linha.expira_em) };
}

/** Pré-visualização depois de digitar o código: só apelido e avatar de quem é o dono. */
export async function consultarCodigo(codigo: string): Promise<ResultadoConsulta> {
  const { data, error } = await supabase.rpc('social_consultar_codigo', { p_codigo: codigo });
  if (error) throw error;
  const linha = (data as { status: StatusConsulta; apelido: string | null; avatar: string | null }[])[0];
  return { status: linha.status, apelido: linha.apelido, avatar: linha.avatar };
}

export async function solicitarAmizadePorCodigo(codigo: string): Promise<StatusSolicitacao> {
  const { data, error } = await supabase.rpc('social_solicitar_por_codigo', { p_codigo: codigo });
  if (error) throw error;
  if (data === 'enviada' || data === 'aceita') registrarEvento('amizade_solicitada');
  if (data === 'aceita') registrarEvento('amizade_aceita');
  return data as StatusSolicitacao;
}

export async function listarSolicitacoes(): Promise<SolicitacaoSocial[]> {
  const { data, error } = await supabase.rpc('social_listar_solicitacoes');
  if (error) throw error;
  return ((data ?? []) as any[]).map((l) => ({
    amizadeId: l.amizade_id,
    direcao: l.direcao,
    apelido: l.apelido,
    avatar: l.avatar,
    criadoEm: new Date(l.criado_em),
  }));
}

export async function listarAmigos(): Promise<AmigoSocial[]> {
  const { data, error } = await supabase.rpc('social_listar_amigos');
  if (error) throw error;
  return ((data ?? []) as any[]).map((l) => ({
    amizadeId: l.amizade_id,
    apelido: l.apelido,
    avatar: l.avatar,
    desde: l.desde ? new Date(l.desde) : null,
  }));
}

/**
 * Perfil de um amigo (ver data/migration_social_perfil_amigo.sql). Devolve
 * `null` quando a amizade não existe mais, não foi aceita ou há bloqueio: o
 * banco responde igual nos três casos, sem revelar o motivo.
 */
export async function buscarPerfilAmigo(amizadeId: string): Promise<PerfilAmigo | null> {
  const { data, error } = await supabase.rpc('social_perfil_amigo', { p_amizade_id: amizadeId });
  if (error) throw error;
  const linha = (data as LinhaPerfilAmigo[] | null)?.[0];
  return linha ? mapearPerfilAmigo(linha) : null;
}

/** Só quem recebeu o pedido responde. Devolve false se o pedido não existe mais. */
export async function responderSolicitacao(amizadeId: string, aceitar: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('social_responder_solicitacao', {
    p_amizade_id: amizadeId,
    p_aceitar: aceitar,
  });
  if (error) throw error;
  if (aceitar && data === 'ok') registrarEvento('amizade_aceita');
  return data === 'ok';
}

/** Desfaz amizade ou cancela um pedido enviado. */
export async function removerAmizade(amizadeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('social_remover_amizade', { p_amizade_id: amizadeId });
  if (error) throw error;
  return data === true;
}

export async function bloquearUsuario(amizadeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('social_bloquear', { p_amizade_id: amizadeId });
  if (error) throw error;
  return data === true;
}

export async function denunciarUsuario(amizadeId: string, motivo: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('social_denunciar', { p_amizade_id: amizadeId, p_motivo: motivo });
  if (error) throw error;
  return data === true;
}

/** Mensagem pronta pra mostrar a quem digitou um código (consulta ou pedido). */
export function mensagemParaStatus(status: StatusConsulta | StatusSolicitacao): string {
  switch (status) {
    case 'invalido':
      return 'Código inválido ou expirado. Confira com a pessoa e tente de novo.';
    case 'proprio':
      return 'Esse é o seu próprio código. Compartilhe com quem você quer adicionar.';
    case 'limite':
      return 'Muitas tentativas seguidas. Espere um pouco e tente de novo.';
    case 'limite_pendentes':
      return 'Você já tem muitos pedidos esperando resposta. Espere alguns serem respondidos.';
    case 'sem_apelido':
      return 'Escolha um apelido antes de pedir amizade.';
    case 'ja_amigos':
      return 'Vocês já são amigos.';
    case 'aceita':
      return 'Vocês agora são amigos!';
    case 'enviada':
      return 'Pedido enviado! Quando a pessoa aceitar, ela aparece na sua lista.';
    default:
      return '';
  }
}
