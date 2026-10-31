// src/features/admin/services/gestaoAdminService.ts
// Nutricionistas, moderação social e desafios. Tudo via funções do banco que checam o papel.
import { supabase } from '../../../lib/supabase';

export interface NutricionistaResumo {
  id: string;
  nome: string | null;
  apelido: string | null;
  criadoEm: string | null;
  ultimoAcesso: string | null;
  conteudosCriados: number;
  revisoesFeitas: number;
  publicados: number;
}

export async function listarNutricionistas(): Promise<NutricionistaResumo[]> {
  const { data, error } = await supabase.rpc('painel_nutricionistas_listar');
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id,
    nome: r.nome,
    apelido: r.apelido,
    criadoEm: r.criado_em,
    ultimoAcesso: r.ultimo_acesso,
    conteudosCriados: Number(r.conteudos_criados ?? 0),
    revisoesFeitas: Number(r.revisoes_feitas ?? 0),
    publicados: Number(r.publicados ?? 0),
  }));
}

export interface DenunciaSocial {
  id: string;
  criadoEm: string;
  motivo: string;
  denuncianteId: string;
  denunciante: string | null;
  denunciadoId: string;
  denunciado: string | null;
  totalDoDenunciado: number;
  status: 'ABERTA' | 'RESOLVIDA';
  decisao: DecisaoDenuncia | null;
  notaEquipe: string | null;
  resolvidoEm: string | null;
  resolvidoPor: string | null;
  /** restrição social ativa do denunciado (ISO) ou null */
  restritoAte: string | null;
}
export type DecisaoDenuncia = 'SEM_ACAO' | 'ADVERTENCIA' | 'IMPROCEDENTE';
export interface ResumoModeracao {
  denunciasAbertas: number;
  abertasAtrasadas: number;
  restricoesAtivas: number;
  totalDenuncias: number;
  denuncias30d: number;
  totalBloqueios: number;
  reincidentes: number;
  denuncias: DenunciaSocial[];
}

export async function buscarModeracao(): Promise<ResumoModeracao> {
  const { data, error } = await supabase.rpc('painel_moderacao', { p_limite: 100 });
  if (error) throw error;
  const r: any = data;
  return {
    denunciasAbertas: Number(r.denuncias_abertas ?? 0),
    abertasAtrasadas: Number(r.abertas_atrasadas ?? 0),
    restricoesAtivas: Number(r.restricoes_ativas ?? 0),
    totalDenuncias: Number(r.total_denuncias ?? 0),
    denuncias30d: Number(r.denuncias_30d ?? 0),
    totalBloqueios: Number(r.total_bloqueios ?? 0),
    reincidentes: Number(r.reincidentes ?? 0),
    denuncias: (r.denuncias ?? []).map((d: any) => ({
      id: d.id,
      criadoEm: d.criado_em,
      motivo: d.motivo,
      denuncianteId: d.denunciante_id,
      denunciante: d.denunciante,
      denunciadoId: d.denunciado_id,
      denunciado: d.denunciado,
      totalDoDenunciado: Number(d.total_do_denunciado ?? 1),
      status: d.status === 'RESOLVIDA' ? 'RESOLVIDA' : 'ABERTA',
      decisao: d.decisao ?? null,
      notaEquipe: d.nota_equipe ?? null,
      resolvidoEm: d.resolvido_em ?? null,
      resolvidoPor: d.resolvido_por ?? null,
      restritoAte: d.restrito_ate ?? null,
    })),
  };
}

/** Registra a decisão da equipe sobre uma denúncia aberta (definitiva; o banco confere o papel).
 *  `avisar`: o adolescente vê um aviso no app (só advertência). `restringirDias`: 1 a 30, só com advertência;
 *  suspende pedidos, aceites, reações, Chama Dupla e envio de receita, e já avisa o adolescente. */
export async function resolverDenuncia(
  id: string,
  decisao: DecisaoDenuncia,
  nota?: string,
  opcoes: { avisar?: boolean; restringirDias?: number | null } = {}
): Promise<void> {
  const { error } = await supabase.rpc('painel_moderacao_resolver', {
    p_id: id,
    p_decisao: decisao,
    p_nota: nota?.trim() || null,
    p_avisar: !!opcoes.avisar,
    p_restringir_dias: opcoes.restringirDias ?? null,
  });
  if (error) throw error;
}

/** Encerra antes do prazo a restrição social ativa de um usuário. */
export async function levantarRestricaoSocial(usuarioId: string): Promise<void> {
  const { error } = await supabase.rpc('painel_moderacao_levantar_restricao', { p_usuario: usuarioId });
  if (error) throw error;
}
