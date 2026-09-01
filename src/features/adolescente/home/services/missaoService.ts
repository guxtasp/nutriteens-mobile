// src/features/adolescente/services/missaoService.ts
import { supabase } from '../../../../lib/supabase';
import { detectarLacunaNutriente, META_SEMANAL } from '../../alimentacao/services/nutrienteService';
import { detectarLacunaAtividade } from '../../atividade-fisica/services/atividadeService';
import { detectarLacunaAgua } from '../../agua/services/aguaService';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';

export type MissaoDoDia = {
  id: string; // id da linha em missoes_diarias
  tipo: string;
  titulo: string;
  descricao: string;
  icone: string | null;
  criterio: Record<string, number>;
  parametros: Record<string, string>;
};

// A Home busca a missão de hoje uma única vez via useHomeData (que reaproveita
// o resultado pro card, pra sequência e pro status da semana — ver comentário
// em useHomeData.ts). Esse cache de "em voo" continua existindo como rede de
// segurança pra qualquer outro chamador que dispare obterOuAtribuirMissaoDoDia
// em paralelo pro mesmo dia (ex: useMissaoDoDia/useSequencia, mantidos no
// projeto mas não usados pela Home hoje) — evita criar duas missões diferentes
// se duas chamadas caírem no mesmo instante antes de qualquer uma resolver.
const emVoo = new Map<string, Promise<MissaoDoDia>>();

// pega a missão já atribuída hoje, ou monta uma nova
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

// ---------------------------------------------------------------------
// Escolha do tipo de missão do dia: NÃO é mais um sorteio cego entre o
// catálogo. A gente olha pra o que já é real sobre essa semana do
// adolescente — nutriente com poucos dias de boa fonte, dias sem
// atividade física suficiente, dias sem bater a meta de água — e prioriza
// o que estiver pior, igual um profissional de saúde olharia primeiro pro
// que está mais descoberto. Só quando NADA está descoberto (adolescente
// em dia com tudo que a gente consegue medir) é que sorteamos entre as
// missões restantes do catálogo, como reforço positivo/variedade — não
// como plano B disfarçado de plano A.
//
// Ordem de prioridade (por que essa ordem, não outra):
//   1. Nutriente — é o sinal mais específico e "acionável" que temos
//      (sabemos exatamente qual nutriente e qual alimento sugerir).
//   2. Atividade física — recomendação de atividade diária pra
//      adolescente é uma das mais consistentes na literatura (OMS), e o
//      app já tem o dado real de dias sem bater a meta.
//   3. Água — mesma lógica, meta já é personalizada por peso
//      (calcularMetaAguaMl), não um número genérico de catálogo.
// Se nenhuma lacuna for detectada, cai pro sorteio entre as demais
// missões ativas (ALIMENTO_NATURAL_QTD, REFEICAO_SEM_ULTRAPROCESSADO, e
// também ATIVIDADE_MIN/AGUA_ML — não faz mal repetir o tipo se o
// adolescente gosta, o dia só não veio de uma lacuna real).
async function escolherTipoMissao(userId: string): Promise<{ tipo: string; parametros: Record<string, string> }> {
  const lacunaNutriente = await detectarLacunaNutriente(userId);
  if (lacunaNutriente) {
    return { tipo: 'NUTRIENTE_LACUNA', parametros: { nutriente: lacunaNutriente.nutriente } };
  }

  const lacunaAtividade = await detectarLacunaAtividade(userId);
  if (lacunaAtividade) {
    return {
      tipo: 'ATIVIDADE_MIN',
      parametros: {
        origem: 'LACUNA_SEMANA',
        diasComAtividade: String(lacunaAtividade.diasComAtividade),
        minimoDias: String(lacunaAtividade.minimoDias),
      },
    };
  }

  const lacunaAgua = await detectarLacunaAgua(userId);
  if (lacunaAgua) {
    return {
      tipo: 'AGUA_ML',
      parametros: {
        origem: 'LACUNA_SEMANA',
        diasComAguaSuficiente: String(lacunaAgua.diasComAguaSuficiente),
        minimoDias: String(lacunaAgua.minimoDias),
      },
    };
  }

  // nada descoberto essa semana — sorteia entre o que resta do catálogo,
  // como reforço positivo, não como fallback de lacuna
  const { data: catalogo, error: erroCatalogo } = await supabase
    .from('missoes_catalogo')
    .select('tipo')
    .eq('ativa', true)
    .neq('tipo', 'NUTRIENTE_LACUNA');

  if (erroCatalogo) throw erroCatalogo;
  if (!catalogo || catalogo.length === 0) {
    throw new Error('Nenhuma missão ativa cadastrada em missoes_catalogo.');
  }

  const tipoSorteado = catalogo[Math.floor(Math.random() * catalogo.length)].tipo;
  return { tipo: tipoSorteado, parametros: {} };
}

async function buscarOuCriarMissaoDoDia(userId: string, data: string): Promise<MissaoDoDia> {
  const { data: existente } = await supabase
    .from('missoes_diarias')
    .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio)')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (existente) return mapearMissao(existente);

  const { tipo: tipoEscolhido, parametros } = await escolherTipoMissao(userId);

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

export function mapearMissao(row: any): MissaoDoDia {
  const base = {
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

  // ATIVIDADE_MIN/AGUA_ML sorteadas por LACUNA_SEMANA (ver escolherTipoMissao)
  // ganham uma descrição personalizada com o número real de dias — só
  // quando vieram de uma lacuna de verdade, não quando caíram no sorteio
  // de reforço positivo (aí usa o texto padrão do catálogo mesmo)
  if (base.tipo === 'ATIVIDADE_MIN' && base.parametros.origem === 'LACUNA_SEMANA') {
    const dias = base.parametros.diasComAtividade;
    const minimo = base.parametros.minimoDias;
    return {
      ...base,
      titulo: row.missoes_catalogo.titulo,
      descricao: `Nos últimos 7 dias você se mexeu o suficiente em ${dias} deles (a ideia é bater pelo menos ${minimo}). Hoje é um bom dia pra somar mais um!`,
    };
  }

  if (base.tipo === 'AGUA_ML' && base.parametros.origem === 'LACUNA_SEMANA') {
    const dias = base.parametros.diasComAguaSuficiente;
    const minimo = base.parametros.minimoDias;
    return {
      ...base,
      titulo: row.missoes_catalogo.titulo,
      descricao: `Nos últimos 7 dias você bateu sua meta de água em ${dias} deles (a ideia é pelo menos ${minimo}). Bora se hidratar hoje?`,
    };
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

      // meta PERSONALIZADA por peso (a mesma de useAguaHoje/ConsumoAguaScreen),
      // não o alvo_ml genérico do catálogo — assim a missão bate com o que a
      // tela de água já mostra pro adolescente. Sem peso cadastrado, cai pro
      // valor do catálogo como aproximação (mesmo caso de detectarLacunaAgua,
      // que aí nem chega a sortear essa missão por lacuna real).
      const { data: perfil } = await supabase.from('profiles').select('peso_kg').eq('id', userId).single();
      const alvoMl = perfil?.peso_kg ? calcularMetaAguaMl(perfil.peso_kg) : missao.criterio.alvo_ml;
      return total >= alvoMl;
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
        const nivel = i.alimentos?.alimento_nutrientes?.[coluna];
        return nivel === 'FONTE' || nivel === 'ALTO_TEOR';
      });
    }

    default:
      return false;
  }
}
