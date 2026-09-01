// src/shared/services/xpService.ts
import { supabase } from '../../lib/supabase';

/** Soma `quantidade` de XP ao total do usuário em `xp_usuario` (cria a linha se não existir). */
export async function concederXp(usuarioId: string, quantidade: number): Promise<void> {
  if (quantidade <= 0) return;

  const { data: xpAtual, error: erroBusca } = await supabase
    .from('xp_usuario')
    .select('xp_total')
    .eq('usuario_id', usuarioId)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  const novoTotal = (xpAtual?.xp_total ?? 0) + quantidade;
  const { error: erroUpsert } = await supabase
    .from('xp_usuario')
    .upsert({ usuario_id: usuarioId, xp_total: novoTotal }, { onConflict: 'usuario_id' });
  if (erroUpsert) throw erroUpsert;
}
