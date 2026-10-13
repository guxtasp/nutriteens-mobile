// Fila da equipe (nutricionista/admin): pedidos de cadastro do scanner.
// Tudo por RPC: o banco confere o papel (42501 para quem não é da equipe). Nunca devolve quem pediu.
import { supabase } from '../../../../lib/supabase';
import type { CategoriaTroca } from '../../trocas/utils/trocas';
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import type { MotivoSolicitacao } from './scannerService';

export type SolicitacaoScanner = {
  id: string;
  codigoBarras: string;
  motivo: MotivoSolicitacao;
  nomeInformado: string | null;
  marcaInformada: string | null;
  candidatoCodigo: string | null;
  candidatoNome: string | null;
  pedidos: number;
  criadoEm: string;
  produtoAtualNome: string | null;
  produtoAtualFonte: string | null;
};

export async function listarSolicitacoes(): Promise<SolicitacaoScanner[]> {
  const { data, error } = await supabase.rpc('scanner_listar_solicitacoes', { p_status: 'PENDENTE' });
  if (error) throw error;
  return ((data ?? []) as any[]).map((l) => ({
    id: l.id, codigoBarras: l.codigo_barras, motivo: l.motivo,
    nomeInformado: l.nome_informado, marcaInformada: l.marca_informada,
    candidatoCodigo: l.candidato_codigo, candidatoNome: l.candidato_nome,
    pedidos: l.pedidos, criadoEm: l.criado_em,
    produtoAtualNome: l.produto_atual_nome, produtoAtualFonte: l.produto_atual_fonte,
  }));
}

export async function contarSolicitacoes(): Promise<number> {
  const { data, error } = await supabase.rpc('scanner_contar_solicitacoes');
  if (error) throw error;
  return Number(data ?? 0);
}

export type DecisaoSolicitacao =
  | { acao: 'APROVAR'; nome: string; marca?: string; nova: ClassificacaoNova | null; categoria: CategoriaTroca | null; nota?: string }
  | { acao: 'REJEITAR'; nota?: string };

export async function resolverSolicitacao(id: string, d: DecisaoSolicitacao): Promise<void> {
  const base = { p_id: id, p_acao: d.acao, p_nota: d.nota?.trim() || null };
  const { error } = await supabase.rpc('scanner_resolver_solicitacao', d.acao === 'APROVAR'
    ? { ...base, p_nome: d.nome.trim(), p_marca: d.marca?.trim() || null, p_nova: d.nova, p_categoria: d.categoria }
    : base);
  if (error) throw error;
}
