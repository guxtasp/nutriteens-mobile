// src/features/adolescente/home/services/aniversarioService.ts
//
// Leitura da data de nascimento do PRÓPRIO usuário (profiles.data_nascimento), usada pela
// Central de Notificações para mostrar o item de aniversário. Falha vira null: sem a data,
// simplesmente não há item.
import { supabase } from '../../../../lib/supabase';

export async function buscarDataNascimento(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('profiles').select('data_nascimento').eq('id', userId).maybeSingle();
  if (error) {
    console.warn('Erro ao carregar data de nascimento:', error.message);
    return null;
  }
  return data?.data_nascimento ?? null;
}
