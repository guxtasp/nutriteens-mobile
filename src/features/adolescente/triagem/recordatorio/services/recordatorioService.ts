import { supabase } from '../../../../../lib/supabase';

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
  const { data: existente } = await supabase
    .from('refeicoes')
    .select('id')
    .eq('recordatorio_id', recordatorioId)
    .eq('tipo', tipoRefeicao)
    .maybeSingle();

  const refeicaoId =
    existente?.id ??
    (
      await supabase
        .from('refeicoes')
        .insert({ recordatorio_id: recordatorioId, tipo: tipoRefeicao, realizada })
        .select('id')
        .single()
    ).data?.id;

  if (!refeicaoId) return;

  // limpa seleção anterior (caso o usuário volte e edite) e regrava
  await supabase.from('refeicao_alimentos').delete().eq('refeicao_id', refeicaoId);

  if (alimentoIds.length > 0) {
    await supabase.from('refeicao_alimentos').insert(
      alimentoIds.map((alimentoId) => ({ refeicao_id: refeicaoId, alimento_id: alimentoId }))
    );
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

// Busca todos os alimentos marcados em qualquer refeição do recordatório
// (todas as refeições daquele dia) e aplica os marcadores Sisvan.
async function calcularEscoreSisvanDoRecordatorio(recordatorioId: string) {
  const { data, error } = await supabase
    .from('refeicoes')
    .select('refeicao_alimentos(alimentos(classificacao_nova, grupos_alimentares))')
    .eq('recordatorio_id', recordatorioId);

  if (error || !data) return { escoreSaudavel: 0, escoreNaoSaudavel: 0 };

  const alimentosDoDia: AlimentoParaEscore[] = data.flatMap((refeicao: any) =>
    (refeicao.refeicao_alimentos ?? [])
      .map((ra: any) => ra.alimentos)
      .filter(Boolean)
  );

  const { escoreSaudavel, escoreNaoSaudavel } = calcularMarcadoresSisvan(alimentosDoDia);
  return { escoreSaudavel, escoreNaoSaudavel };
}

export async function marcarRecordatorioConcluido(recordatorioId: string) {
  const { escoreSaudavel, escoreNaoSaudavel } = await calcularEscoreSisvanDoRecordatorio(recordatorioId);

  await supabase
    .from('recordatorios_alimentares')
    .update({
      concluido: true,
      escore_saudavel: escoreSaudavel,
      escore_nao_saudavel: escoreNaoSaudavel,
    })
    .eq('id', recordatorioId);
}