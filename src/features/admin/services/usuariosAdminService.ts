// src/features/admin/services/usuariosAdminService.ts
// Leitura de usuários pelo Admin. Passa por funções do banco (painel_usuarios_listar /
// painel_usuario_detalhe) que checam o papel e devolvem só dados de gestão — nunca
// peso, altura, gênero, EBIA ou alimentação.
import { supabase } from '../../../lib/supabase';

export type Papel = 'ADOLESCENTE' | 'NUTRICIONISTA' | 'ADMINISTRADOR';

export interface UsuarioAdmin {
  id: string;
  nome: string | null;
  apelido: string | null;
  papel: Papel;
  codigoParticipante: string | null;
  tipoInstituicao: string | null;
  instituicaoEnsino: string | null;
  criadoEm: string | null;
  ultimoAcesso: string | null;
  ativo: boolean;
}

export interface DetalheUsuarioAdmin extends Omit<UsuarioAdmin, 'ativo'> {
  ativo: boolean;
  etapaOnboarding: string | null;
  sequenciaAtual: number;
  maiorSequencia: number;
  xpTotal: number;
  faseAtual: string | null;
  licoesConcluidas: number;
  diasComRegistro: number;
  insignias: number;
  amigos: number;
  denunciasRecebidas: number;
  conteudosCriados: number;
  revisoesFeitas: number;
}

export type ParamsUsuarios = {
  busca?: string;
  papel?: Papel | null;
  ordem?: string;
  limite?: number;
  offset?: number;
};

export async function listarUsuarios(p: ParamsUsuarios = {}): Promise<{ itens: UsuarioAdmin[]; total: number }> {
  const { data, error } = await supabase.rpc('painel_usuarios_listar', {
    p_busca: p.busca?.trim() || null,
    p_papel: p.papel ?? null,
    p_ordem: p.ordem ?? 'recentes',
    p_limite: p.limite ?? 25,
    p_offset: p.offset ?? 0,
  });
  if (error) throw error;
  const linhas = (data ?? []) as any[];
  return {
    total: linhas.length > 0 ? Number(linhas[0].total) : 0,
    itens: linhas.map((r) => ({
      id: r.id,
      nome: r.nome,
      apelido: r.apelido,
      papel: r.papel,
      codigoParticipante: r.codigo_participante,
      tipoInstituicao: r.tipo_instituicao,
      instituicaoEnsino: r.instituicao_ensino,
      criadoEm: r.criado_em,
      ultimoAcesso: r.ultimo_acesso,
      ativo: !!r.ativo,
    })),
  };
}

export async function buscarUsuario(id: string): Promise<DetalheUsuarioAdmin> {
  const { data, error } = await supabase.rpc('painel_usuario_detalhe', { p_id: id });
  if (error) throw error;
  const r: any = data;
  return {
    id: r.id,
    nome: r.nome,
    apelido: r.apelido,
    papel: r.papel,
    codigoParticipante: r.codigo_participante,
    tipoInstituicao: r.tipo_instituicao,
    instituicaoEnsino: r.instituicao_ensino,
    criadoEm: r.criado_em,
    ultimoAcesso: r.ultimo_acesso,
    ativo: !!r.ativo,
    etapaOnboarding: r.etapa_onboarding,
    sequenciaAtual: r.sequencia_atual ?? 0,
    maiorSequencia: r.maior_sequencia ?? 0,
    xpTotal: r.xp_total ?? 0,
    faseAtual: r.fase_atual,
    licoesConcluidas: Number(r.licoes_concluidas ?? 0),
    diasComRegistro: Number(r.dias_com_registro ?? 0),
    insignias: Number(r.insignias ?? 0),
    amigos: Number(r.amigos ?? 0),
    denunciasRecebidas: Number(r.denuncias_recebidas ?? 0),
    conteudosCriados: Number(r.conteudos_criados ?? 0),
    revisoesFeitas: Number(r.revisoes_feitas ?? 0),
  };
}

export function labelPapel(papel: Papel): string {
  switch (papel) {
    case 'ADOLESCENTE':
      return 'Adolescente';
    case 'NUTRICIONISTA':
      return 'Nutricionista';
    case 'ADMINISTRADOR':
      return 'Administrador';
    default:
      return papel;
  }
}
