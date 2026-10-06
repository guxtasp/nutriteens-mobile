// src/features/adolescente/services/missaoService.ts
import { supabase } from '../../../../lib/supabase';
import { detectarLacunaNutriente, META_SEMANAL } from '../../alimentacao/services/nutrienteService';
import { detectarLacunaAtividade } from '../../atividade-fisica/services/atividadeService';
import { detectarLacunaAgua } from '../../agua/services/aguaService';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import { concederXp } from '../../../../shared/services/xpService';
import { criarProgresso, Progresso, UNIDADES } from '../../missoes/utils/progresso';
import { alimentoEBoaFonte, type NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';
import { formatarDataISO } from '../../../../shared/utils/data';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import {
  obterVariante,
  sortearVariante,
  calcularProgressoAlimentar,
  metaAguaDaVariante,
  progressoAtividadePassos,
  type VarianteMissao,
} from '../../missoes/utils/variantesMissao';

export type MissaoDoDia = {
  id: string; // id da linha em missoes_diarias
  tipo: string;
  titulo: string;
  descricao: string;
  icone: string | null;
  criterio: Record<string, number>;
  parametros: Record<string, string>;
  pontosRecompensa: number;
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
//
// VARIEDADE (biblioteca em missoes/utils/variantesMissao.ts): cada tipo do
// catálogo é só um "portador"; a missão concreta (texto, meta, regra) é uma
// VARIANTE gravada em parametros.variante. Assim há dezenas de missões sem
// mexer no enum do banco.
//   - lacuna de nutriente: continua NUTRIENTE_LACUNA (um nutriente por vez);
//   - lacuna de atividade/água: sorteia uma variante da mesma área;
//   - "desafio livre" (~1 dia em 3) ou nada descoberto: sorteia entre TODAS.
//
// Anti-repetição: a lacuna da semana é a mesma de um dia pro outro (ex.:
// proteína continua a pior até comer boas fontes), então sem isso a missão
// era SEMPRE igual. A missão de ontem (tipo + nutriente) é pulada, e as
// variantes dos últimos 7 dias são evitadas enquanto houver outras.
type HistoricoMissao = { data: string; tipo: string; nutriente?: string; variante?: string };

async function obterHistoricoMissoes(userId: string, data: string): Promise<HistoricoMissao[]> {
  const base = new Date(`${data}T12:00:00`);
  const inicio = new Date(base);
  inicio.setDate(base.getDate() - 7);

  const { data: rows } = await supabase
    .from('missoes_diarias')
    .select('data, parametros, missoes_catalogo(tipo)')
    .eq('user_id', userId)
    .gte('data', formatarDataISO(inicio))
    .lt('data', data);

  return (rows ?? [])
    .map((r: any) => ({
      data: r.data as string,
      tipo: r.missoes_catalogo?.tipo as string,
      nutriente: r.parametros?.nutriente as string | undefined,
      variante: r.parametros?.variante as string | undefined,
    }))
    .filter((h) => !!h.tipo);
}

function paramsDaVariante(v: VarianteMissao, extra: Record<string, string> = {}): { tipo: string; parametros: Record<string, string> } {
  return { tipo: v.tipoBase, parametros: { ...extra, variante: v.codigo } };
}

async function escolherTipoMissao(userId: string, data: string): Promise<{ tipo: string; parametros: Record<string, string> }> {
  const historico = await obterHistoricoMissoes(userId, data);
  const ontemISO = (() => {
    const d = new Date(`${data}T12:00:00`);
    d.setDate(d.getDate() - 1);
    return formatarDataISO(d);
  })();
  const ontem = historico.find((h) => h.data === ontemISO);
  const variantesRecentes = historico.map((h) => h.variante).filter((v): v is string => !!v);

  // ~1 dia em 3 é "desafio livre": qualquer área, independente de lacuna
  if (Math.random() < 1 / 3) {
    return paramsDaVariante(sortearVariante({ evitar: variantesRecentes }));
  }

  const lacunaNutriente = await detectarLacunaNutriente(
    userId,
    ontem?.tipo === 'NUTRIENTE_LACUNA' && ontem.nutriente ? [ontem.nutriente] : []
  );
  if (lacunaNutriente) {
    return { tipo: 'NUTRIENTE_LACUNA', parametros: { nutriente: lacunaNutriente.nutriente } };
  }

  const lacunaAtividade = ontem?.tipo === 'ATIVIDADE_MIN' ? null : await detectarLacunaAtividade(userId);
  if (lacunaAtividade) {
    return paramsDaVariante(sortearVariante({ areas: ['ATIVIDADE'], evitar: variantesRecentes }), {
      origem: 'LACUNA_SEMANA',
      diasComAtividade: String(lacunaAtividade.diasComAtividade),
      minimoDias: String(lacunaAtividade.minimoDias),
    });
  }

  const lacunaAgua = ontem?.tipo === 'AGUA_ML' ? null : await detectarLacunaAgua(userId);
  if (lacunaAgua) {
    return paramsDaVariante(sortearVariante({ areas: ['AGUA'], evitar: variantesRecentes }), {
      origem: 'LACUNA_SEMANA',
      diasComAguaSuficiente: String(lacunaAgua.diasComAguaSuficiente),
      minimoDias: String(lacunaAgua.minimoDias),
    });
  }

  // nada descoberto essa semana — reforço positivo, qualquer variante
  return paramsDaVariante(sortearVariante({ evitar: variantesRecentes }));
}

async function buscarOuCriarMissaoDoDia(userId: string, data: string): Promise<MissaoDoDia> {
  const { data: existente } = await supabase
    .from('missoes_diarias')
    .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio, pontos_recompensa)')
    .eq('user_id', userId)
    .eq('data', data)
    .maybeSingle();

  if (existente) return mapearMissao(existente);

  const { tipo: tipoEscolhido, parametros } = await escolherTipoMissao(userId, data);

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
    .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio, pontos_recompensa)')
    .single();

  if (!error && nova) registrarEvento('desafio_iniciado', undefined, { userId });

  // duas chamadas simultâneas (ex.: render duplo) tentam criar a mesma missão do dia:
  // a perdedora bate na unique (user_id, data) -> só relê a que a outra criou
  if (error?.code === '23505') {
    const { data: criada, error: erroRelida } = await supabase
      .from('missoes_diarias')
      .select('id, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio, pontos_recompensa)')
      .eq('user_id', userId)
      .eq('data', data)
      .single();
    if (erroRelida) throw erroRelida;
    return mapearMissao(criada);
  }
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
    pontosRecompensa: row.missoes_catalogo.pontos_recompensa,
  };

  // Variante (biblioteca de missões): texto/ícone vêm dela. Quando nasceu de
  // uma lacuna da semana, acrescenta o contexto real em número de dias.
  const variante = obterVariante(base.parametros.variante);
  if (variante) {
    let contexto = '';
    if (base.parametros.origem === 'LACUNA_SEMANA') {
      if (base.tipo === 'ATIVIDADE_MIN') {
        contexto = ` Nos últimos 7 dias você se mexeu o suficiente em ${base.parametros.diasComAtividade} deles (a ideia é pelo menos ${base.parametros.minimoDias}).`;
      } else if (base.tipo === 'AGUA_ML') {
        contexto = ` Nos últimos 7 dias você bateu sua meta de água em ${base.parametros.diasComAguaSuficiente} deles (a ideia é pelo menos ${base.parametros.minimoDias}).`;
      }
    }
    return { ...base, icone: variante.icone, titulo: variante.titulo, descricao: variante.descricao + contexto };
  }

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

// Progresso REAL da missão de hoje (quanto já foi feito, a meta e quanto falta),
// sempre calculado a partir dos registros do dia — nunca um flag manual.
// `avaliarMissaoDoDia` (usada pela Home) é só "o progresso bateu a meta?", então
// há UMA regra de cumprimento só, e a tela de Missões mostra exatamente o mesmo.
export async function calcularProgressoMissaoDoDia(userId: string, data: string, missao: MissaoDoDia): Promise<Progresso> {
  const variante = obterVariante(missao.parametros.variante);
  if (variante) return calcularProgressoVariante(userId, data, variante, missao);

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
      // valor do catálogo como aproximação.
      const { data: perfil } = await supabase.from('profiles').select('peso_kg').eq('id', userId).single();
      const alvoMl = perfil?.peso_kg ? calcularMetaAguaMl(perfil.peso_kg) : missao.criterio.alvo_ml;
      return criarProgresso(total, alvoMl, UNIDADES.ml);
    }

    case 'ATIVIDADE_MIN': {
      const { data: registros } = await supabase
        .from('registros_atividade_fisica')
        .select('duracao_minutos, registros_diarios!inner(user_id, data)')
        .eq('registros_diarios.user_id', userId)
        .eq('registros_diarios.data', data);
      const total = (registros ?? []).reduce((soma, r: any) => soma + r.duracao_minutos, 0);
      return criarProgresso(total, missao.criterio.alvo_min, UNIDADES.min);
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
      return criarProgresso(qtd, missao.criterio.alvo_qtd, UNIDADES.porcao);
    }

    case 'REFEICAO_SEM_ULTRAPROCESSADO': {
      const { data: refeicoesDoDia } = await supabase
        .from('refeicoes')
        .select('id, refeicao_alimentos(alimentos(classificacao_nova)), registros_diarios!inner(user_id, data)')
        .eq('registros_diarios.user_id', userId)
        .eq('registros_diarios.data', data);
      const boas = (refeicoesDoDia ?? []).filter((r: any) =>
        r.refeicao_alimentos.length > 0 &&
        r.refeicao_alimentos.every((i: any) => i.alimentos.classificacao_nova !== 'ULTRAPROCESSADO')
      ).length;
      return criarProgresso(boas, 1, UNIDADES.refeicao);
    }

    case 'NUTRIENTE_LACUNA': {
      const meta = META_SEMANAL[missao.parametros.nutriente as keyof typeof META_SEMANAL];
      if (!meta) return criarProgresso(0, 1, UNIDADES.porcao);
      const { data: itens } = await supabase
        .from('refeicao_alimentos')
        .select(`alimentos(grupos_alimentares, alimento_nutrientes(${meta.coluna})), refeicoes!inner(registros_diarios!inner(user_id, data))`)
        .eq('refeicoes.registros_diarios.user_id', userId)
        .eq('refeicoes.registros_diarios.data', data);
      // alimentoEBoaFonte cai pra inferência por grupo quando o alimento não
      // tem linha em alimento_nutrientes (ex.: cadastrado pelo adolescente)
      const fontes = (itens ?? []).filter((i: any) => alimentoEBoaFonte(i.alimentos, meta.coluna as NutrienteChave)).length;
      // o banco guarda NÍVEL (fonte / alto teor), não gramas — então o que dá para
      // medir com honestidade é "alimentos que são boa fonte desse nutriente".
      return criarProgresso(fontes, 1, {
        singular: `alimento fonte de ${meta.rotulo}`,
        plural: `alimentos fonte de ${meta.rotulo}`,
      });
    }

    default:
      return criarProgresso(0, 1, UNIDADES.missao);
  }
}

// Progresso das missões que são VARIANTES (ver missoes/utils/variantesMissao.ts):
// busca só o que a regra da variante precisa e delega o cálculo à lógica pura.
async function calcularProgressoVariante(
  userId: string,
  data: string,
  variante: VarianteMissao,
  missao: MissaoDoDia
): Promise<Progresso> {
  const regra = variante.regra;

  if (regra.regra === 'AGUA_PCT_META') {
    const { data: registros } = await supabase
      .from('registros_agua')
      .select('quantidade_ml, registros_diarios!inner(user_id, data)')
      .eq('registros_diarios.user_id', userId)
      .eq('registros_diarios.data', data);
    const total = (registros ?? []).reduce((soma, r: any) => soma + r.quantidade_ml, 0);
    // mesma meta personalizada por peso da missão de água padrão
    const { data: perfil } = await supabase.from('profiles').select('peso_kg').eq('id', userId).single();
    const metaMl = perfil?.peso_kg ? calcularMetaAguaMl(perfil.peso_kg) : (missao.criterio.alvo_ml ?? 2000);
    return criarProgresso(total, metaAguaDaVariante(regra, metaMl), UNIDADES.ml);
  }

  if (regra.regra === 'ATIVIDADE_MIN' || regra.regra === 'ATIVIDADE_PASSOS') {
    const { data: registros } = await supabase
      .from('registros_atividade_fisica')
      .select('duracao_minutos, quantidade_passos, registros_diarios!inner(user_id, data)')
      .eq('registros_diarios.user_id', userId)
      .eq('registros_diarios.data', data);
    if (regra.regra === 'ATIVIDADE_MIN') {
      const total = (registros ?? []).reduce((soma, r: any) => soma + (r.duracao_minutos ?? 0), 0);
      return criarProgresso(total, regra.min, UNIDADES.min);
    }
    const passos = (registros ?? []).reduce((soma, r: any) => soma + (r.quantidade_passos ?? 0), 0);
    return progressoAtividadePassos(passos, regra.passos);
  }

  // regras de comida: itens de refeição do dia (com classificação, grupos e,
  // só se a regra for de nutriente, a coluna do nutriente)
  const colunaNutriente = regra.regra === 'FONTE_NUTRIENTE' ? `, alimento_nutrientes(${regra.nutriente})` : '';
  const { data: itens } = await supabase
    .from('refeicao_alimentos')
    .select(
      `refeicao_id, quantidade, alimentos(classificacao_nova, grupos_alimentares${colunaNutriente}), refeicoes!inner(tipo, registros_diarios!inner(user_id, data))`
    )
    .eq('refeicoes.registros_diarios.user_id', userId)
    .eq('refeicoes.registros_diarios.data', data);

  return calcularProgressoAlimentar(regra, (itens ?? []) as any[]) ?? criarProgresso(0, 1, UNIDADES.missao);
}

// checa se a missão foi cumprida, olhando os registros reais do dia — nunca um flag manual
export async function avaliarMissaoDoDia(userId: string, data: string, missao: MissaoDoDia): Promise<boolean> {
  return (await calcularProgressoMissaoDoDia(userId, data, missao)).concluida;
}

// Concede os pontos da missão do dia — só na primeira vez que ela é
// avaliada como cumprida. `useHomeData` reavalia `avaliarMissaoDoDia` a
// cada vez que a Home ganha foco (é uma leitura, não um flag manual — ver
// comentário acima), então sem essa guarda o usuário ganharia pontos de
// novo toda vez que voltasse pra Home no mesmo dia. O UPDATE condicional
// (`.eq('xp_concedido', false)`) é o que garante isso de forma atômica: só
// quem "ganha a corrida" de marcar o flag é que efetivamente concede os
// pontos — se `data` voltar vazio, outra chamada (ou uma anterior) já
// concedeu, e essa aqui não faz nada.
export async function concederPontosMissaoSeNecessario(
  userId: string,
  missaoDiariaId: string,
  pontos: number
): Promise<void> {
  if (pontos <= 0) return;

  const { data, error } = await supabase
    .from('missoes_diarias')
    .update({ xp_concedido: true })
    .eq('id', missaoDiariaId)
    .eq('xp_concedido', false)
    .select('id');

  if (error) throw error;
  if (!data || data.length === 0) return; // já tinha sido concedido antes

  registrarEvento('desafio_concluido', undefined, { userId });

  await concederXp(userId, pontos);
}
