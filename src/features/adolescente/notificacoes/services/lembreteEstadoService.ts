// src/features/adolescente/notificacoes/services/lembreteEstadoService.ts
//
// Descobre o que AINDA FALTA fazer hoje, pra o lembrete de hoje só citar algo
// pendente ("beba água" depois de bater a meta seria justamente o spam que a
// gente quer evitar). Só leitura: nada aqui cria ou altera registros.
//
// Se uma consulta falhar (sem rede, por exemplo), aquele tipo é tratado como
// pendente — o pior caso é um lembrete a mais, nunca um lembrete a menos que
// o usuário ia querer receber.
import { supabase } from '../../../../lib/supabase';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import { formatarDataISO } from '../../../../shared/utils/data';
import { buscarConsumoAguaHoje } from '../../agua/services/aguaService';
import { avaliarMissaoDoDia, mapearMissao } from '../../home/services/missaoService';
import { PendentesHoje } from '../utils/escolherLembrete';

// mesma meta padrão que useAguaHoje usa enquanto o peso não foi cadastrado
const META_AGUA_PADRAO_ML = 2000;
// com menos refeições que isso registradas hoje, vale perguntar do prato
const REFEICOES_MINIMAS_NO_DIA = 2;

async function aguaPendente(userId: string, hoje: string): Promise<boolean> {
  const { data: perfil } = await supabase.from('profiles').select('peso_kg').eq('id', userId).single();
  const meta = perfil?.peso_kg ? calcularMetaAguaMl(perfil.peso_kg) : META_AGUA_PADRAO_ML;
  const totalMl = await buscarConsumoAguaHoje(userId, hoje);
  return totalMl < meta;
}

async function contarRegistrosDoDia(
  tabela: 'registros_atividade_fisica' | 'refeicoes',
  userId: string,
  hoje: string
): Promise<number> {
  const { count, error } = await supabase
    .from(tabela)
    .select('id, registros_diarios!inner(user_id, data)', { count: 'exact', head: true })
    .eq('registros_diarios.user_id', userId)
    .eq('registros_diarios.data', hoje);
  if (error) throw error;
  return count ?? 0;
}

async function missaoPendente(userId: string, hoje: string): Promise<boolean> {
  // Não usa obterOuAtribuirMissaoDoDia de propósito: isso CRIARIA a missão do
  // dia em segundo plano. Aqui só olhamos se ela já existe e se foi cumprida.
  const { data, error } = await supabase
    .from('missoes_diarias')
    .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio, pontos_recompensa)')
    .eq('user_id', userId)
    .eq('data', hoje)
    .maybeSingle();
  if (error) throw error;
  if (!data) return true; // missão de hoje ainda nem foi aberta: está pendente

  const concluida = await avaliarMissaoDoDia(userId, hoje, mapearMissao(data));
  return !concluida;
}

export async function buscarPendentesHoje(userId: string, agora: Date = new Date()): Promise<PendentesHoje> {
  const hoje = formatarDataISO(agora);

  const [agua, atividade, refeicoes, missao] = await Promise.allSettled([
    aguaPendente(userId, hoje),
    contarRegistrosDoDia('registros_atividade_fisica', userId, hoje),
    contarRegistrosDoDia('refeicoes', userId, hoje),
    missaoPendente(userId, hoje),
  ]);

  return {
    agua: agua.status === 'fulfilled' ? agua.value : true,
    atividade: atividade.status === 'fulfilled' ? atividade.value === 0 : true,
    alimentacao: refeicoes.status === 'fulfilled' ? refeicoes.value < REFEICOES_MINIMAS_NO_DIA : true,
    missao: missao.status === 'fulfilled' ? missao.value : true,
    // progresso_licao não guarda a data da conclusão, então não dá pra saber
    // se a trilha já foi feita HOJE: ela sempre pode ser lembrada (o rodízio
    // por "lembrado há mais tempo" evita que vire repetição).
    trilha: true,
  };
}
