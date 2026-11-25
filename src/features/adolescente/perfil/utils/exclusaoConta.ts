// src/features/adolescente/perfil/utils/exclusaoConta.ts
//
// Regras puras do "Apagar meus dados": que erro mostrar e quais cópias locais apagar depois.
import { ehErroDeRede } from '../../../../shared/offline/erroRede';

export type TipoErroExclusao = 'rede' | 'outro';

/**
 * O supabase.functions.invoke embrulha a falha de rede num FunctionsFetchError ("Failed to send a
 * request to the Edge Function"), cuja mensagem não bate com os padrões de ehErroDeRede; a causa
 * original fica em `context`. Exclusão nunca vai para a fila offline: sem rede, só avisamos.
 */
export function classificarErroExclusao(erro: unknown): TipoErroExclusao {
  if (!erro || typeof erro !== 'object') return ehErroDeRede(erro) ? 'rede' : 'outro';
  const e = erro as { name?: unknown; context?: unknown };
  if (e.name === 'FunctionsFetchError') return 'rede';
  if (ehErroDeRede(erro) || ehErroDeRede(e.context)) return 'rede';
  return 'outro';
}

/** Prefixos de cópias locais que não levam o id no nome, mas são do usuário logado. */
const PREFIXOS_DO_USUARIO = ['nt:cache:'];

/**
 * Chaves do AsyncStorage para apagar depois da exclusão: as que levam o id do usuário (fila
 * offline, lembretes, marcas de "já vi", despensa...) e o cache local. Preferências do aparelho
 * (som, acessibilidade) e a sessão do Supabase ficam: a sessão sai pelo signOut.
 */
export function chavesLocaisDaConta(chaves: readonly string[], userId: string): string[] {
  if (!userId) return [];
  return chaves.filter((c) => c.includes(userId) || PREFIXOS_DO_USUARIO.some((p) => c.startsWith(p)));
}
