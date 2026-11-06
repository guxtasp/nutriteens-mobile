// src/features/adolescente/home/services/aniversarioService.ts
//
// Leitura da data de nascimento do PRÓPRIO usuário (profiles.data_nascimento), usada pela
// Central de Notificações para mostrar o item de aniversário. Falha vira null: sem a data,
// simplesmente não há item.
import { supabase } from '../../../../lib/supabase';
import { comCache } from '../../../../shared/offline/cacheLocal';

export async function buscarDataNascimento(userId: string): Promise<string | null> {
  try {
    // sem internet: a data já lida antes (a mensagem de aniversário também funciona offline)
    return await comCache<string | null>(`perfil:nascimento:${userId}`, async () => {
      const { data, error } = await supabase.from('profiles').select('data_nascimento').eq('id', userId).maybeSingle();
      if (error) throw error;
      return data?.data_nascimento ?? null;
    });
  } catch (erro) {
    console.warn('Erro ao carregar data de nascimento:', (erro as { message?: string })?.message ?? erro);
    return null;
  }
}
