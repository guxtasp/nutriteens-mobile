// src/features/adolescente/home/services/primeirosPassosService.ts
//
// Descobre quais "primeiros passos" a pessoa já cumpriu: 5 contagens leves (head + count, sem
// trazer linhas). Um passo vale se existir qualquer registro dele na conta, não só hoje.
//
// Offline: falha de rede devolve a última cópia (comCache). Como um passo cumprido nunca
// "desfaz", a cópia antiga só pode estar atrasada, nunca errada para mais.
import { supabase } from '../../../../lib/supabase';
import { comCache } from '../../../../shared/offline/cacheLocal';
import { lancarSeErroDeRede } from '../../../../shared/offline/erroRede';
import type { PassosFeitos } from '../utils/primeirosPassos';

export async function buscarPrimeirosPassosFeitos(userId: string): Promise<PassosFeitos> {
  return comCache(`primeiros-passos:${userId}`, () => buscarOnline(userId));
}

async function buscarOnline(userId: string): Promise<PassosFeitos> {
  const doRegistroDiario = (tabela: 'registros_agua' | 'registros_atividade_fisica' | 'refeicoes') =>
    supabase
      .from(tabela)
      .select('id, registros_diarios!inner(user_id)', { count: 'exact', head: true })
      .eq('registros_diarios.user_id', userId);

  const respostas = await Promise.all([
    doRegistroDiario('registros_agua'),
    doRegistroDiario('registros_atividade_fisica'),
    // refeições da triagem (recordatório) não têm registro diário e não entram aqui de propósito
    doRegistroDiario('refeicoes'),
    supabase.from('progresso_licao').select('id', { count: 'exact', head: true }).eq('usuario_id', userId),
    // pedido enviado OU amizade aceita: já conheceu a turma
    supabase
      .from('amizades')
      .select('id', { count: 'exact', head: true })
      .or(`solicitante_id.eq.${userId},destinatario_id.eq.${userId}`),
  ]);

  // falha de rede NÃO é "nenhum passo feito": sobe o erro para o comCache decidir
  respostas.forEach((r) => lancarSeErroDeRede(r));
  const [agua, atividade, refeicao, licao, amigo] = respostas.map((r) => (r.count ?? 0) > 0);
  return { agua, atividade, refeicao, licao, amigo };
}
