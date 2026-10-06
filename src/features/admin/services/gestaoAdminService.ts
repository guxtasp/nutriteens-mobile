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
}
export interface ResumoModeracao {
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
    })),
  };
}
