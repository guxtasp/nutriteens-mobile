// RF015 — acesso a dados das trocas. A EBIA é resolvida no banco (trocas_listar) e
// chega aqui só como um booleano de ordenação; nunca é exibida.
import { supabase } from '../../../../lib/supabase';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import { categoriaDoAlimento, escolherTrocasRefeicao, CategoriaTroca, OpcaoTroca, Troca } from '../utils/trocas';

export type RespostaTroca = 'TENTAR' | 'NAO_TENHO';

/** O que o retorno da refeição precisa para mostrar o cartão. */
export type TrocaSugerida = { categoria: CategoriaTroca; origemNome: string; opcoes: OpcaoTroca[] };

type Linha = {
  id: string; categoria: CategoriaTroca; origem_id: string | null; origem_nome: string | null;
  destino_id: string; destino_nome: string; tipos_refeicao: string[] | null; frase: string; rapida: boolean; ordem: number;
  destino_acessivel: boolean; destino_recente: boolean; respondida_recente: boolean;
  dica?: string | null; destino_nutrientes?: string[] | null; // vêm de migration_trocas_justificativas.sql
};

const paraTroca = (l: Linha): Troca => ({
  id: l.id, categoria: l.categoria, origemId: l.origem_id, origemNome: l.origem_nome,
  destinoId: l.destino_id, destinoNome: l.destino_nome, tiposRefeicao: l.tipos_refeicao ?? [],
  frase: l.frase, rapida: l.rapida, ordem: l.ordem,
  destinoAcessivel: l.destino_acessivel, destinoRecente: l.destino_recente, respondidaRecente: l.respondida_recente,
  dica: l.dica ?? null, nutrientes: l.destino_nutrientes ?? [],
});

/** Só trocas PUBLICADAS (o banco filtra). Lança erro: a tela decide como mostrar. */
export async function listarTrocas(categoria?: CategoriaTroca): Promise<Troca[]> {
  const { data, error } = await supabase.rpc('trocas_listar', { p_categoria: categoria ?? null });
  if (error) throw error;
  return ((data ?? []) as Linha[]).map(paraTroca);
}

/**
 * Troca única do retorno da refeição. Falha em silêncio: qualquer erro vira null
 * e o registro da refeição segue com o texto atual.
 */
export async function buscarTrocaDaRefeicao(params: {
  tipo: string;
  itens: { alimento: { id: string; nome: string; classificacao_nova: any; grupos_alimentares: string[] } }[];
}): Promise<TrocaSugerida | null> {
  try {
    const ids = params.itens.map((i) => i.alimento.id);
    const { data, error } = await supabase.from('alimentos').select('id, categoria_troca').in('id', ids);
    if (error) throw error;
    const catalogo = new Map((data ?? []).map((r: any) => [r.id as string, r.categoria_troca as CategoriaTroca | null]));

    const itens = params.itens.map(({ alimento: a }) => ({
      id: a.id,
      nome: a.nome,
      categoria: categoriaDoAlimento({ categoriaTroca: catalogo.get(a.id), classificacaoNova: a.classificacao_nova, grupos: a.grupos_alimentares ?? [] }),
    }));
    if (!itens.some((i) => i.categoria)) return null; // nada a trocar: nem consulta as trocas

    return escolherTrocasRefeicao(await listarTrocas(), itens, params.tipo);
  } catch (erro) {
    console.error('Trocas indisponíveis (seguindo sem sugestão):', erro);
    return null;
  }
}

export async function responderTroca(trocaId: string, resposta: RespostaTroca, origem: 'refeicao' | 'aba'): Promise<void> {
  const { error } = await supabase.from('troca_respostas').insert({ troca_id: trocaId, resposta });
  if (error) throw error;
  registrarEvento(resposta === 'TENTAR' ? 'troca_aceita' : 'troca_recusada', { troca_id: trocaId, origem });
}

export function registrarTrocaSugerida(trocaId: string, origem: 'refeicao' | 'aba'): void {
  registrarEvento('troca_sugerida', { troca_id: trocaId, origem });
}
