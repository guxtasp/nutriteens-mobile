import { supabase } from '../../../../../lib/supabase';
import { avaliarRecordatorio } from '../utils/avaliacaoRecordatorio';

export interface AlimentoCatalogo {
  id: string;
  nome: string;
  // Trazidos junto pra alimentar o escore Sisvan no fechamento do dia
  // (calcularEscoreSisvan). Não são exibidos na grade — GradeDeAlimentos.tsx
  // continua "cega" a essa classificação de propósito (ver documento de
  // visão: não sinalizar julgamento em tempo real pro adolescente).
  classificacao_nova: 'IN_NATURA' | 'PROCESSADO' | 'ULTRAPROCESSADO';
  grupos_alimentares: string[];
}

// Busca do catálogo compartilhado os alimentos marcados (pelo admin, em
// AlimentoFormScreen) para aparecer naquele tipo de refeição do Recordatório.
// Substitui o antigo mapeamento fixo em alimentosPorRefeicao.ts — agora a
// associação vive no próprio cadastro do alimento (tipos_refeicao_recordatorio),
// então um alimento novo aparece automaticamente, sem editar código nem
// depender do nome bater.
export async function buscarAlimentosPorTipoRefeicao(tipoRefeicao: string): Promise<AlimentoCatalogo[]> {
  const { data, error } = await supabase
    .from('alimentos')
    .select('id, nome, classificacao_nova, grupos_alimentares')
    .contains('tipos_refeicao_recordatorio', [tipoRefeicao])
    .order('nome');

  if (error || !data) return [];
  return data;
}

// Como o Recordatório agora é a primeira etapa da triagem (antes vinha depois
// da EBIA), é ele quem abre a avaliação nutricional "em aberto" do usuário —
// não existe mais a garantia de que ela já foi criada antes.
export async function obterOuCriarAvaliacaoNutricional(userId: string): Promise<string> {
  const { data: existente } = await supabase
    .from('avaliacoes_nutricionais')
    .select('id')
    .eq('user_id', userId)
    .eq('concluida', false)
    .maybeSingle();

  if (existente) return existente.id as string;

  const { data: nova, error } = await supabase
    .from('avaliacoes_nutricionais')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error || !nova) throw error;
  return nova.id as string;
}

// Cria (ou recupera, se já existir) o recordatório de hoje/data de referência
// vinculado à avaliação nutricional em aberto do usuário.
export async function obterOuCriarRecordatorio(avaliacaoNutricionalId: string, dataReferencia: string) {
  const { data: existente } = await supabase
    .from('recordatorios_alimentares')
    .select('id')
    .eq('avaliacao_nutricional_id', avaliacaoNutricionalId)
    .eq('data_referencia', dataReferencia)
    .maybeSingle();

  if (existente) return existente.id as string;

  const { data: novo, error } = await supabase
    .from('recordatorios_alimentares')
    .insert({ avaliacao_nutricional_id: avaliacaoNutricionalId, data_referencia: dataReferencia })
    .select('id')
    .single();

  if (error || !novo) throw error;
  return novo.id as string;
}

// Salva a refeição e os alimentos marcados nela. Se a refeição para aquele
// recordatorio+tipo já existir, evita duplicar (upsert manual em 2 passos,
// já que refeicoes não tem UNIQUE(recordatorio_id, tipo) hoje).
export async function salvarRefeicao(
  recordatorioId: string,
  tipoRefeicao: string,
  alimentoIds: string[],
  realizada: boolean
) {
  const { data: existente, error: erroBusca } = await supabase
    .from('refeicoes')
    .select('id')
    .eq('recordatorio_id', recordatorioId)
    .eq('tipo', tipoRefeicao)
    .maybeSingle();
  if (erroBusca) throw erroBusca;

  let refeicaoId = existente?.id as string | undefined;
  if (!refeicaoId) {
    const { data: nova, error: erroInsert } = await supabase
      .from('refeicoes')
      .insert({ recordatorio_id: recordatorioId, tipo: tipoRefeicao, realizada })
      .select('id')
      .single();
    if (erroInsert || !nova) throw erroInsert ?? new Error('Refeição não foi criada');
    refeicaoId = nova.id as string;
  }

  // limpa seleção anterior (caso o usuário volte e edite) e regrava
  const { error: erroDelete } = await supabase.from('refeicao_alimentos').delete().eq('refeicao_id', refeicaoId);
  if (erroDelete) throw erroDelete;

  if (alimentoIds.length > 0) {
    const { error: erroItens } = await supabase.from('refeicao_alimentos').insert(
      alimentoIds.map((alimentoId) => ({ refeicao_id: refeicaoId, alimento_id: alimentoId }))
    );
    if (erroItens) throw erroItens;
  }
}

// Marcadores Sisvan (Ministério da Saúde / POF 2017-2018), derivados sem
// campo novo no catálogo: grupo_alimentar para os 3 marcadores saudáveis,
// grupo_alimentar + classificacao_nova === 'ULTRAPROCESSADO' para os 4
// marcadores não saudáveis. Cada marcador conta uma vez por dia (presença),
// não por quantidade de itens — por isso o escore satura em 3 e em 4.
// Ver documento de visão (avaliação do recordatório) pra tabela completa.
interface AlimentoParaEscore {
  classificacao_nova: 'IN_NATURA' | 'PROCESSADO' | 'ULTRAPROCESSADO';
  grupos_alimentares: string[];
}

export function calcularMarcadoresSisvan(alimentos: AlimentoParaEscore[]) {
  const marcadores = {
    feijao: false,
    frutas: false,
    verduras: false,
    embutidos: false,
    bebidaAcucarada: false,
    salgadinhoOuInstantaneo: false,
    doceOuBiscoito: false,
  };

  for (const alimento of alimentos) {
    const grupos = alimento.grupos_alimentares ?? [];
    const ultraprocessado = alimento.classificacao_nova === 'ULTRAPROCESSADO';

    if (grupos.includes('LEGUMINOSAS')) marcadores.feijao = true;
    if (grupos.includes('FRUTAS')) marcadores.frutas = true;
    if (grupos.includes('LEGUMES_E_VERDURAS')) marcadores.verduras = true;

    if (ultraprocessado && grupos.includes('CARNES_E_OVOS')) marcadores.embutidos = true;
    if (ultraprocessado && grupos.includes('BEBIDAS')) marcadores.bebidaAcucarada = true;
    if (ultraprocessado && grupos.includes('CEREAIS_E_TUBERCULOS')) marcadores.salgadinhoOuInstantaneo = true;
    if (ultraprocessado && grupos.includes('ACUCARES_E_DOCES')) marcadores.doceOuBiscoito = true;
  }

  const escoreSaudavel = [marcadores.feijao, marcadores.frutas, marcadores.verduras].filter(Boolean).length;
  const escoreNaoSaudavel = [
    marcadores.embutidos,
    marcadores.bebidaAcucarada,
    marcadores.salgadinhoOuInstantaneo,
    marcadores.doceOuBiscoito,
  ].filter(Boolean).length;

  return { escoreSaudavel, escoreNaoSaudavel, marcadores };
}

// Busca tudo que o adolescente marcou no dia e calcula, de uma vez, os escores
// Sisvan e a avaliação (ultraprocessados + Sisvan). Lança erro se a leitura
// falhar — o chamador não pode seguir como se tivesse dado certo.
async function calcularFechamentoDoRecordatorio(recordatorioId: string) {
  const { data, error } = await supabase
    .from('refeicoes')
    .select('realizada, refeicao_alimentos ( alimentos ( classificacao_nova, grupos_alimentares ) )')
    .eq('recordatorio_id', recordatorioId);

  if (error || !data) throw error ?? new Error('Não foi possível ler o recordatório');

  const alimentosDoDia: AlimentoParaEscore[] = [];
  for (const refeicao of data as any[]) {
    for (const ra of refeicao.refeicao_alimentos ?? []) {
      if (ra.alimentos) alimentosDoDia.push(ra.alimentos);
    }
  }
  const refeicoesRealizadas = (data as any[]).filter((r) => r.realizada).length;

  const { escoreSaudavel, escoreNaoSaudavel, marcadores } = calcularMarcadoresSisvan(alimentosDoDia);
  const avaliacao = {
    ...avaliarRecordatorio(alimentosDoDia, refeicoesRealizadas),
    sisvan: { escore_saudavel: escoreSaudavel, escore_nao_saudavel: escoreNaoSaudavel, marcadores },
  };
  return { escoreSaudavel, escoreNaoSaudavel, avaliacao };
}

export async function marcarRecordatorioConcluido(recordatorioId: string) {
  const { escoreSaudavel, escoreNaoSaudavel, avaliacao } = await calcularFechamentoDoRecordatorio(recordatorioId);

  const base = { concluido: true, escore_saudavel: escoreSaudavel, escore_nao_saudavel: escoreNaoSaudavel };
  let { error } = await supabase.from('recordatorios_alimentares').update({ ...base, avaliacao }).eq('id', recordatorioId);

  // Coluna `avaliacao` ainda não criada (migration_avaliacao_recordatorio.sql
  // não rodou): não trava a triagem de todo mundo — grava só o que já existia
  // e avisa no console. 42703 = Postgres; PGRST204 = cache de schema do PostgREST.
  if (error && (error.code === '42703' || error.code === 'PGRST204')) {
    console.warn('Coluna recordatorios_alimentares.avaliacao não existe — rode a migration. Salvando sem a avaliação.');
    ({ error } = await supabase.from('recordatorios_alimentares').update(base).eq('id', recordatorioId));
  }
  if (error) throw error;
}
