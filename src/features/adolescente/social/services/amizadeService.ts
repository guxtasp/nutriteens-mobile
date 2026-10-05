// src/features/adolescente/social/services/amizadeService.ts
//
// Toda escrita de amizade passa por funções RPC do banco (ver
// data/migration_amizades.sql). O app nunca faz insert/update/delete direto
// na tabela `amizades` — as regras (consentimento mútuo, limite de pedidos,
// só adolescente) ficam no banco.
import { supabase } from '../../../../lib/supabase';
import {
  LinhaAmizade,
  RelacaoComPerfil,
  ResultadoPedido,
  SituacaoAmizade,
  normalizarCodigo,
} from '../utils/amizades';

export interface PerfilEncontrado {
  id: string;
  nome: string; // só o primeiro nome
  relacao: RelacaoComPerfil;
}

/** Procura alguém pelo código. Devolve null se o código for inválido ou não existir. */
export async function buscarPerfilPorCodigo(entrada: string): Promise<PerfilEncontrado | null> {
  const codigo = normalizarCodigo(entrada);
  if (!codigo) return null;

  const { data, error } = await supabase.rpc('buscar_perfil_por_codigo', { p_codigo: codigo });
  if (error) {
    console.error('Erro ao buscar perfil por código:', error.message);
    throw error;
  }

  const linha = (data as Array<{ id: string; nome: string; relacao: RelacaoComPerfil }> | null)?.[0];
  return linha ? { id: linha.id, nome: linha.nome, relacao: linha.relacao } : null;
}

/** Envia o pedido (ou fecha a amizade, se a outra pessoa já tinha convidado). */
export async function enviarPedidoAmizade(entrada: string): Promise<ResultadoPedido> {
  const codigo = normalizarCodigo(entrada);
  if (!codigo) return 'codigo_invalido';

  const { data, error } = await supabase.rpc('enviar_pedido_amizade', { p_codigo: codigo });
  if (error) {
    console.error('Erro ao enviar pedido de amizade:', error.message);
    throw error;
  }
  return data as ResultadoPedido;
}

/** Só o destinatário consegue. Aceitar vira amizade; recusar apaga o pedido. */
export async function responderPedidoAmizade(amizadeId: string, aceitar: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('responder_pedido_amizade', {
    p_amizade_id: amizadeId,
    p_aceitar: aceitar,
  });
  if (error) {
    console.error('Erro ao responder pedido de amizade:', error.message);
    throw error;
  }
  return data === true;
}

/** Desfaz amizade ou cancela pedido enviado. Qualquer um dos lados, a qualquer momento. */
export async function removerAmizade(amizadeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('remover_amizade', { p_amizade_id: amizadeId });
  if (error) {
    console.error('Erro ao remover amizade:', error.message);
    throw error;
  }
  return data === true;
}

/** Amigos + pedidos recebidos + pedidos enviados. Só id e primeiro nome do outro lado. */
export async function listarAmizades(): Promise<LinhaAmizade[]> {
  const { data, error } = await supabase.rpc('listar_amizades');
  if (error) {
    console.error('Erro ao listar amizades:', error.message);
    throw error;
  }

  return ((data ?? []) as Array<{
    amizade_id: string;
    outro_id: string;
    nome: string;
    situacao: SituacaoAmizade;
    desde: string;
  }>).map((linha) => ({
    amizadeId: linha.amizade_id,
    outroId: linha.outro_id,
    nome: linha.nome,
    situacao: linha.situacao,
    desde: linha.desde,
  }));
}
