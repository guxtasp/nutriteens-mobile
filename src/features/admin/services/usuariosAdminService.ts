// src/features/admin/services/usuariosAdminService.ts
import { supabase } from '../../../lib/supabase';

export type Papel = 'ADOLESCENTE' | 'NUTRICIONISTA' | 'ADMINISTRADOR';

export interface UsuarioAdmin {
  id: string;
  nome: string | null;
  papel: Papel;
  codigoParticipante: string | null;
  tipoInstituicao: string | null;
  instituicaoEnsino: string | null;
  criadoEm: string | null;
}

// Observação: alteração de papel/código do participante é bloqueada pra qualquer
// usuário autenticado via app (trigger no banco) — essa tela é só de consulta.
export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, papel, codigo_participante, tipo_instituicao, instituicao_ensino, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao listar usuários:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    papel: row.papel,
    codigoParticipante: row.codigo_participante,
    tipoInstituicao: row.tipo_instituicao,
    instituicaoEnsino: row.instituicao_ensino,
    criadoEm: row.created_at,
  }));
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