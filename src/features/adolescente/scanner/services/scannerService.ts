// Scanner (prova de conceito): produto por código de barras.
// Ordem: produtos_scanner (nosso) -> Open Food Facts -> "não encontrado".
// Falha de rede/OFF NUNCA quebra a tela: vira { status: 'nao_encontrado' }.
import { supabase } from '../../../../lib/supabase';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import type { CategoriaTroca } from '../../trocas/utils/trocas';
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import { DetalhesProduto, mapearOpenFoodFacts, normalizarCodigo, ProdutoScanner } from '../utils/scanner';

export type ResultadoBusca =
  | { status: 'encontrado'; produto: ProdutoScanner; origem: 'proprio' | 'open_food_facts' }
  | { status: 'nao_encontrado'; codigo: string };

type Linha = {
  codigo_barras: string; nome: string; marca: string | null;
  classificacao_nova: ClassificacaoNova | null; categoria_troca: CategoriaTroca | null;
  fonte: ProdutoScanner['fonte']; detalhes: DetalhesProduto | null;
};

const paraProduto = (l: Linha): ProdutoScanner => ({
  codigoBarras: l.codigo_barras, nome: l.nome, marca: l.marca,
  classificacaoNova: l.classificacao_nova, categoriaTroca: l.categoria_troca, fonte: l.fonte,
  detalhes: l.detalhes ?? null,
});

const OFF_URL = 'https://world.openfoodfacts.org/api/v2/product';
const OFF_CAMPOS = 'product_name,product_name_pt,generic_name,generic_name_pt,brands,nova_group,categories_tags,nutriments,additives_n,ingredients_text_pt,ingredients_text,image_front_small_url';
const OFF_TIMEOUT_MS = 6000;

async function buscarNaTabela(codigo: string): Promise<ProdutoScanner | null> {
  try {
    const { data, error } = await supabase.from('produtos_scanner').select('*').eq('codigo_barras', codigo).maybeSingle();
    if (error) throw error;
    return data ? paraProduto(data as Linha) : null;
  } catch (e) {
    console.error('Scanner: tabela indisponível (tentando Open Food Facts):', e);
    return null;
  }
}

async function buscarNaOpenFoodFacts(codigo: string): Promise<ProdutoScanner | null> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), OFF_TIMEOUT_MS);
  try {
    const res = await fetch(`${OFF_URL}/${codigo}.json?fields=${OFF_CAMPOS}`, {
      signal: controle.signal,
      headers: { 'User-Agent': 'NutriTeens/1.0 (app educativo)' }, // a OFF pede identificação do app
    });
    if (!res.ok) return null;
    return mapearOpenFoodFacts(await res.json(), codigo);
  } catch (e) {
    console.error('Scanner: Open Food Facts indisponível:', e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Guarda o resultado para as próximas leituras. Falhar aqui não atrapalha quem está escaneando. */
async function guardarProduto(p: ProdutoScanner, fonte: 'OPEN_FOOD_FACTS' | 'USUARIO'): Promise<void> {
  const { error } = await supabase.rpc('scanner_salvar_produto', {
    p_codigo: p.codigoBarras, p_nome: p.nome, p_marca: p.marca,
    p_nova: p.classificacaoNova, p_categoria: p.categoriaTroca, p_fonte: fonte, p_detalhes: p.detalhes ?? null,
  });
  if (error) throw error;
}

export async function buscarProduto(codigoLido: string): Promise<ResultadoBusca> {
  const codigo = normalizarCodigo(codigoLido);
  if (!codigo) return { status: 'nao_encontrado', codigo: codigoLido };

  const proprio = await buscarNaTabela(codigo);
  if (proprio) return { status: 'encontrado', produto: proprio, origem: 'proprio' };

  const off = await buscarNaOpenFoodFacts(codigo);
  if (off) {
    // só guarda se a OFF trouxe o nível de processamento: o registro nunca é sobrescrito,
    // então guardar "sem classificação" deixaria o produto sem resposta para sempre.
    if (off.classificacaoNova) guardarProduto(off, 'OPEN_FOOD_FACTS').catch((e) => console.error('Scanner: não guardou o produto:', e));
    return { status: 'encontrado', produto: off, origem: 'open_food_facts' };
  }
  return { status: 'nao_encontrado', codigo };
}

export type NovoProduto = {
  codigo: string; nome: string; marca?: string;
  classificacaoNova: ClassificacaoNova | null; categoriaTroca: CategoriaTroca | null;
};

/** "Cadastrar este produto" (teste). Lança erro: o formulário mostra a mensagem. */
export async function cadastrarProduto(n: NovoProduto): Promise<ProdutoScanner> {
  const codigo = normalizarCodigo(n.codigo);
  if (!codigo) throw new Error('Código de barras inválido.');
  const produto: ProdutoScanner = {
    codigoBarras: codigo, nome: n.nome.trim(), marca: n.marca?.trim() || null,
    classificacaoNova: n.classificacaoNova, categoriaTroca: n.categoriaTroca, fonte: 'USUARIO',
  };
  await guardarProduto(produto, 'USUARIO');
  return produto;
}

/** Evento de uso (só códigos curtos; sem texto livre). */
export function registrarLeitura(resultado: 'encontrado' | 'nao_encontrado', produto?: ProdutoScanner): void {
  registrarEvento('scanner_lido', {
    resultado,
    ...(produto ? { codigo: produto.codigoBarras, fonte: produto.fonte, nova: produto.classificacaoNova ?? 'NA', categoria: produto.categoriaTroca ?? 'NA' } : {}),
  });
}
