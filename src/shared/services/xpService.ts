// src/shared/services/xpService.ts
import { supabase } from '../../lib/supabase';

/**
 * Ações que dão XP. O app só informa QUAL ação aconteceu; quanto ela vale e se
 * ela é válida é decidido pelo banco (função `conceder_xp`), nunca por este código.
 *
 *   licao             referência = id da lição
 *   bonus_modulo      referência = id do módulo
 *   bonus_trilha      referência = id da trilha
 *   missao_diaria     referência = id de `missoes_diarias`
 *   missao_periodica  referência = `<codigo>|<AAAA-MM-DD do início do período>`
 *   marco_sequencia   referência = data de hoje (AAAA-MM-DD)
 */
export type OrigemXp =
  | 'licao'
  | 'bonus_modulo'
  | 'bonus_trilha'
  | 'missao_diaria'
  | 'missao_periodica'
  | 'marco_sequencia';

/**
 * Pede ao servidor para conceder o XP de uma ação. Devolve o XP concedido agora
 * (0 quando já tinha sido concedido antes ou quando não há XP nessa ação).
 * Lança erro se o servidor recusar a ação.
 */
export async function concederXp(origem: OrigemXp, referencia: string): Promise<number> {
  const { data, error } = await supabase.rpc('conceder_xp', {
    p_origem: origem,
    p_referencia: referencia,
  });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}
