// src/shared/services/registroDiarioService.ts
import { supabase } from '../../lib/supabase'; // ajuste esse caminho pro do seu client Supabase real

/**
 * Retorna o id do registro_diario do usuário pra aquela data.
 * Se não existir ainda, cria e retorna o novo id.
 */
export async function obterOuCriarRegistroDiario(userId: string, data: string): Promise<string> {
  const { data: existente, error: erroBusca } = await supabase
    .from('registros_diarios')
    .select('id')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (erroBusca) throw erroBusca;
  if (existente) return existente.id;

  const { data: criado, error: erroCriar } = await supabase
    .from('registros_diarios')
    .insert({ user_id: userId, data })
    .select('id')
    .single();

  if (erroCriar) throw erroCriar;
  return criado.id;
}