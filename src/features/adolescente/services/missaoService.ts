// src/features/adolescente/services/missaoService.ts
import { supabase } from '../../../lib/supabase';
import { detectarLacunaNutriente, META_SEMANAL } from './nutrienteService';

export type MissaoDoDia = {
  id: string; // id da linha em missoes_diarias
  tipo: string;
  titulo: string;
  descricao: string;
  icone: string | null;
  criterio: Record<string, number>;
  parametros: Record<string, string>;
};

// A Home chama isso de dois lugares ao mesmo tempo no primeiro foco do dia
// (useSequencia, pra fechar a sequência, e useMissaoDoDia, pra mostrar o card) —
// sem esse cache as duas chamadas corriam em paralelo achando que "ainda não
// existe missão hoje" e podiam disparar duas criações/duas rodadas de
// detectarLacunaNutriente ao mesmo tempo. Cache por userId+data, válido só
// enquanto a promise está em voo.
const emVoo = new Map<string, Promise<MissaoDoDia>>();

// pega a missão já atribuída hoje, ou sorteia uma nova (priorizando lacuna nutricional
// detectada, já que é o dado mais "acionável" que temos sobre esse usuário)
export async function obterOuAtribuirMissaoDoDia(userId: string, data: string): Promise<MissaoDoDia> {
  const chave = `${userId}:${data}`;
  const jaEmVoo = emVoo.get(chave);
  if (jaEmVoo) return jaEmVoo;

  const promise = buscarOuCriarMissaoDoDia(userId, data).finally(() => {
    if (emVoo.get(chave) === promise) emVoo.delete(chave);
  });
  emVoo.set(chave, promise);
  return promise;
}

async function buscarOuCriarMissaoDoDia(userId: string, data: string): Promise<MissaoDoDia> {
  const { data: existente } = await supabase
    .from('missoes_diarias')
    .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio)')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (existente) return mapearMissao(existente);

  const lacuna = await detectarLacunaNutriente(userId);
  let tipoEscolhido: string;
  let parametros: Record<string, string> = {};

  if (lacuna) {
    tipoEscolhido = 'NUTRIENTE_LACUNA';
    parametros = { nutriente: lacuna.nutriente };
  } else {
    const { data: catalogo, error: erroCatalogo } = await supabase
      .from('missoes_catalogo')
      .select('tipo')
      .eq('ativa', true)
      .neq('tipo', 'NUTRIENTE_LACUNA');

    if (erroCatalogo) throw erroCatalogo;
    if (!catalogo || catalogo.length === 0) {
      throw new Error('Nenhuma missão ativa cadastrada em missoes_catalogo.');
    }

    tipoEscolhido = catalogo[Math.floor(Math.random() * catalogo.length)].tipo;
  }

  // catálogo é somente-leitura pro client (mesmo padrão de `alimentos`/`atividades`) —
  // aqui só buscamos o id, nunca gravamos nele
  const { data: catalogoRow, error: erroCatalogoRow } = await supabase
    .from('missoes_catalogo')
    .select('id')
    .eq('tipo', tipoEscolhido)
    .single();
  if (erroCatalogoRow) throw erroCatalogoRow;

  const { data: nova, error } = await supabase
    .from('missoes_diarias')
    .insert({ user_id: userId, missao_id: catalogoRow.id, data, parametros })
    .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio)')
    .single();
  if (error) throw error;

  return mapearMissao(nova);
}

export function mapearMissao(row: any): MissaoDoDia {  const base = {
    id: row.id,
    tipo: row.missoes_catalogo.tipo,
    icone: row.missoes_catalogo.icone,
    criterio: row.missoes_catalogo.criterio,
    parametros: row.parametros ?? {},
  };

  // NUTRIENTE_LACUNA tem texto genérico no catálogo (somente-leitura) — o título/descrição
  // real é montado aqui a partir do nutriente sorteado, guardado em `parametros`
  if (base.tipo === 'NUTRIENTE_LACUNA' && base.parametros.nutriente) {
    const meta = META_SEMANAL[base.parametros.nutriente as keyof typeof META_SEMANAL];
    if (meta) {
      return {
        ...base,
        titulo: `Reforce ${meta.rotulo}`,
        descricao: `Registre algo com ${meta.rotulo} hoje: ${meta.sugestao}`,
      };
    }
  }

  return {
    ...base,
    titulo: row.missoes_catalogo.titulo,
    descricao: row.missoes_catalogo.descricao,
  };
}

// checa se a missão foi cumprida, olhando os registros reais do dia — nunca um flag manual
export async function avaliarMissaoDoDia(userId: string, data: string, missao: MissaoDoDia): Promise<boolean> {
  switch (missao.tipo) {
    case 'AGUA_ML': {
      const { data: registros } = await supabase
        .from('registros_agua')
        .select('quantidade_ml, registros_diarios!inner(user_id, data)')
        .eq('registros_diarios.user_id', userId)
        .eq('registros_diarios.data', data);
      const total = (registros ?? []).reduce((soma, r: any) => soma + r.quantidade_ml, 0);
      return total >= missao.criterio.alvo_ml;
    }

    case 'ATIVIDADE_MIN': {
      const { data: registros } = await supabase
        .from('registros_atividade_fisica')
        .select('duracao_minutos, registros_diarios!inner(user_id, data)')
        .eq('registros_diarios.user_id', userId)
        .eq('registros_diarios.data', data);
      const total = (registros ?? []).reduce((soma, r: any) => soma + r.duracao_minutos, 0);
      return total >= missao.criterio.alvo_min;
    }

    case 'ALIMENTO_NATURAL_QTD': {
      const { data: itens } = await supabase
        .from('refeicao_alimentos')
        .select('quantidade, alimentos(classificacao_nova), refeicoes!inner(registro_diario_id, registros_diarios!inner(user_id, data))')
        .eq('refeicoes.registros_diarios.user_id', userId)
        .eq('refeicoes.registros_diarios.data', data);
      const qtd = (itens ?? [])
        .filter((i: any) => ['IN_NATURA', 'INGREDIENTE_CULINARIO'].includes(i.alimentos.classificacao_nova))
        .reduce((soma, i: any) => soma + i.quantidade, 0);
      return qtd >= missao.criterio.alvo_qtd;
    }

    case 'REFEICAO_SEM_ULTRAPROCESSADO': {
      const { data: refeicoesDoDia } = await supabase
        .from('refeicoes')
        .select('id, refeicao_alimentos(alimentos(classificacao_nova)), registros_diarios!inner(user_id, data)')
        .eq('registros_diarios.user_id', userId)
        .eq('registros_diarios.data', data);
      return (refeicoesDoDia ?? []).some((r: any) =>
        r.refeicao_alimentos.length > 0 &&
        r.refeicao_alimentos.every((i: any) => i.alimentos.classificacao_nova !== 'ULTRAPROCESSADO')
      );
    }

    case 'NUTRIENTE_LACUNA': {
      const coluna = META_SEMANAL[missao.parametros.nutriente as keyof typeof META_SEMANAL]?.coluna;
      if (!coluna) return false;
      const { data: itens } = await supabase
        .from('refeicao_alimentos')
        .select(`alimentos(alimento_nutrientes(${coluna})), refeicoes!inner(registros_diarios!inner(user_id, data))`)
        .eq('refeicoes.registros_diarios.user_id', userId)
        .eq('refeicoes.registros_diarios.data', data);
      return (itens ?? []).some((i: any) => {
        const valor = i.alimentos?.alimento_nutrientes?.[coluna];
        return typeof valor === 'number' && valor > 0;
      });
    }

    default:
      return false;
  }
}