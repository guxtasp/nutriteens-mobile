// src/features/adolescente/perfil/services/excluirContaService.ts
//
// "Apagar meus dados": o app só pede; quem apaga é a Edge Function excluir-conta (precisa da
// service_role, que nunca entra no app). Exclusão nunca entra na fila offline.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../../lib/supabase';
import { limparCacheLocal } from '../../../../shared/offline/cacheLocal';
import { useRecompensasStore } from '../../recompensas/store/recompensasStore';
import { chavesLocaisDaConta } from '../utils/exclusaoConta';

export type ResultadoExclusao = {
  /** código curto do registro anônimo da exclusão (null se a conta já estava sem dados) */
  codigo: string | null;
};

export async function excluirMinhaConta(): Promise<ResultadoExclusao> {
  const { data, error } = await supabase.functions.invoke<{ codigo?: string | null }>('excluir-conta', {
    method: 'POST',
  });
  if (error) throw error;
  return { codigo: typeof data?.codigo === 'string' ? data.codigo : null };
}

/**
 * Logo depois de apagar: tira do aparelho a fila offline, o cache e as marcas locais da conta,
 * e zera o estado em memória. Melhor-esforço: falhar aqui não pode travar a tela de "pronto".
 */
export async function limparDadosLocaisDaConta(userId: string): Promise<void> {
  try {
    const chaves = await AsyncStorage.getAllKeys();
    const daConta = chavesLocaisDaConta(chaves, userId);
    if (daConta.length > 0) await AsyncStorage.multiRemove(daConta);
  } catch {
    // segue: o cache tem a sua própria limpeza abaixo
  }
  await limparCacheLocal();
  useRecompensasStore.setState({ fila: [], vistas: [], pausas: [] });
}

/**
 * Encerra a sessão só no aparelho: o login já não existe no servidor, então o signOut global
 * falharia. O SIGNED_OUT faz o RootNavigator voltar ao Onboarding e cancela os lembretes.
 */
export async function encerrarSessaoLocal(userId: string | null): Promise<void> {
  if (userId) await limparDadosLocaisDaConta(userId);
  await supabase.auth.signOut({ scope: 'local' });
}
