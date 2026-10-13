// Scanner (prova de conceito): produto por código de barras.
// Ordem: produtos_scanner (nosso) -> Open Food Facts -> "não encontrado" (com pedido de cadastro à equipe).
// Falha de rede/OFF NUNCA quebra a tela e NUNCA vira "não existe": é { status: 'indisponivel' }.
import { supabase } from '../../../../lib/supabase';
import { registrarEvento } from '../../../../shared/analytics/analytics';
import type { CategoriaTroca } from '../../trocas/utils/trocas';
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import { avaliarOpenFoodFacts, Candidato, DetalhesProduto, normalizarCodigo, rankearCandidatos, variantesCodigo, ProdutoScanner } from '../utils/scanner';

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
const OFF_BUSCA_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const OFF_CAMPOS = 'product_name,product_name_pt,generic_name,generic_name_pt,brands,nova_group,categories_tags,nutriments,additives_n,ingredients_text_pt,ingredients_text,image_front_small_url';
const OFF_TIMEOUT_MS = 6000;
const CACHE_NEGATIVO_MS = 10 * 60 * 1000; // "a OFF respondeu que não existe": não pergunta de novo por 10 min

export type MotivoSolicitacao = 'NAO_ENCONTRADO' | 'FICHA_INCOMPLETA';

export type ResultadoBusca =
  | { status: 'encontrado'; produto: ProdutoScanner; origem: 'proprio' | 'open_food_facts' }
  | { status: 'nao_encontrado'; codigo: string; motivo: MotivoSolicitacao }
  | { status: 'indisponivel'; codigo: string }   // rede/OFF fora do ar: não prova que o produto não existe
  | { status: 'invalido'; codigo: string };      // leitura torta (dígito verificador errado etc.)

// ---- tabela própria ----
async function buscarNaTabela(variantes: string[]): Promise<ProdutoScanner | null> {
  try {
    const { data, error } = await supabase.from('produtos_scanner').select('*').in('codigo_barras', variantes);
    if (error) throw error;
    const linhas = (data ?? []) as Linha[];
    // a revisão da equipe vale mais que o cache; depois, a ordem das variantes (código lido primeiro)
    const escolhida = [...linhas].sort((a, b) =>
      Number(b.fonte === 'EQUIPE') - Number(a.fonte === 'EQUIPE') || variantes.indexOf(a.codigo_barras) - variantes.indexOf(b.codigo_barras))[0];
    return escolhida ? paraProduto(escolhida) : null;
  } catch (e) {
    console.error('Scanner: tabela indisponível (tentando Open Food Facts):', e);
    return null;
  }
}

// ---- Open Food Facts ----
type RespostaOff =
  | { tipo: 'falha' }
  | { tipo: 'inexistente' }
  | { tipo: 'sem_nome' }
  | { tipo: 'ok'; produto: ProdutoScanner };

async function buscarNaOpenFoodFacts(codigo: string): Promise<RespostaOff> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), OFF_TIMEOUT_MS);
  try {
    const res = await fetch(`${OFF_URL}/${codigo}.json?fields=${OFF_CAMPOS}`, {
      signal: controle.signal,
      headers: { 'User-Agent': 'NutriTeens/1.0 (app educativo)' }, // a OFF pede identificação do app
    });
    if (res.status === 404) return { tipo: 'inexistente' };
    if (!res.ok) return { tipo: 'falha' };   // 429/5xx: não sabemos, não é "não existe"
    const a = avaliarOpenFoodFacts(await res.json(), codigo);
    return a.tipo === 'ok' ? { tipo: 'ok', produto: a.produto } : { tipo: a.tipo };
  } catch (e) {
    console.error('Scanner: Open Food Facts indisponível:', e);
    return { tipo: 'falha' };
  } finally {
    clearTimeout(timer);
  }
}

/** Tenta o código lido e depois as variantes equivalentes (UPC-A <-> EAN-13), parando no primeiro que existir. */
async function consultarOff(variantes: string[]): Promise<RespostaOff> {
  let falhou = false;
  let semNome = false;
  for (const v of variantes) {
    const r = await buscarNaOpenFoodFacts(v);
    if (r.tipo === 'ok') return r;
    if (r.tipo === 'sem_nome') semNome = true;
    if (r.tipo === 'falha') falhou = true;
  }
  if (semNome) return { tipo: 'sem_nome' };
  return { tipo: falhou ? 'falha' : 'inexistente' };
}

// cache negativo só em memória e só para "a OFF respondeu que não existe" (nunca para falha)
const cacheNegativo = new Map<string, { motivo: MotivoSolicitacao; ate: number }>();
export function limparCacheNegativo(): void { cacheNegativo.clear(); }

/** Guarda o resultado da OFF para as próximas leituras. Falhar aqui não atrapalha quem está escaneando. */
async function guardarProduto(p: ProdutoScanner): Promise<void> {
  const { error } = await supabase.rpc('scanner_salvar_produto', {
    p_codigo: p.codigoBarras, p_nome: p.nome, p_marca: p.marca,
    p_nova: p.classificacaoNova, p_categoria: p.categoriaTroca, p_fonte: 'OPEN_FOOD_FACTS', p_detalhes: p.detalhes ?? null,
  });
  if (error) throw error;
}

export async function buscarProduto(codigoLido: string, opcoes: { ignorarCacheNegativo?: boolean } = {}): Promise<ResultadoBusca> {
  const codigo = normalizarCodigo(codigoLido);
  if (!codigo) return { status: 'invalido', codigo: codigoLido };
  const variantes = variantesCodigo(codigo);

  const proprio = await buscarNaTabela(variantes);
  if (proprio) return { status: 'encontrado', produto: proprio, origem: 'proprio' };

  const neg = cacheNegativo.get(codigo);
  if (neg && neg.ate > Date.now() && !opcoes.ignorarCacheNegativo) return { status: 'nao_encontrado', codigo, motivo: neg.motivo };

  const off = await consultarOff(variantes);
  if (off.tipo === 'ok') {
    const produto = { ...off.produto, codigoBarras: codigo }; // fica guardado sob o código que foi lido
    // só guarda se a OFF trouxe o nível de processamento: o registro nunca é sobrescrito pelo app,
    // então guardar "sem classificação" deixaria o produto sem resposta (só a equipe corrige).
    if (produto.classificacaoNova) guardarProduto(produto).catch((e) => console.error('Scanner: não guardou o produto:', e));
    return { status: 'encontrado', produto, origem: 'open_food_facts' };
  }
  if (off.tipo === 'falha') return { status: 'indisponivel', codigo };

  const motivo: MotivoSolicitacao = off.tipo === 'sem_nome' ? 'FICHA_INCOMPLETA' : 'NAO_ENCONTRADO';
  cacheNegativo.set(codigo, { motivo, ate: Date.now() + CACHE_NEGATIVO_MS });
  return { status: 'nao_encontrado', codigo, motivo };
}

// ---- candidatos por nome e marca (nunca confirmam nada) ----
const soTermo = (t: string) => t.replace(/[^\p{L}\p{N}]+/gu, '');

async function candidatosNaTabela(nome: string): Promise<{ codigoBarras: string; nome: string; marca: string | null; origem: 'proprio' }[]> {
  const termo = nome.split(/\s+/).map(soTermo).sort((a, b) => b.length - a.length)[0];
  if (!termo || termo.length < 3) return [];
  try {
    const { data, error } = await supabase.from('produtos_scanner').select('codigo_barras, nome, marca').ilike('nome', `%${termo}%`).limit(30);
    if (error) throw error;
    return (data ?? []).map((l: any) => ({ codigoBarras: l.codigo_barras, nome: l.nome, marca: l.marca, origem: 'proprio' as const }));
  } catch (e) {
    console.error('Scanner: busca por nome na tabela falhou:', e);
    return [];
  }
}

async function candidatosNaOff(nome: string, marca: string): Promise<{ codigoBarras: string; nome: string; marca: string | null; origem: 'open_food_facts' }[]> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), OFF_TIMEOUT_MS);
  try {
    const termos = encodeURIComponent(`${nome} ${marca}`.trim());
    // a OFF limita a busca a 10/min por usuário: só roda por ação explícita da pessoa, nunca "ao digitar"
    const url = `${OFF_BUSCA_URL}?search_terms=${termos}&search_simple=1&action=process&json=1&page_size=15&fields=code,product_name,product_name_pt,brands`
      + '&tagtype_0=countries&tag_contains_0=contains&tag_0=brazil';
    const res = await fetch(url, { signal: controle.signal, headers: { 'User-Agent': 'NutriTeens/1.0 (app educativo)' } });
    if (!res.ok) return [];
    const json = await res.json();
    const lista: any[] = Array.isArray(json?.products) ? json.products : [];
    return lista.flatMap((p) => {
      const cod = typeof p?.code === 'string' ? p.code.replace(/\D/g, '') : '';
      const n = (p?.product_name_pt || p?.product_name || '').toString().trim();
      if (!/^[0-9]{8,14}$/.test(cod) || !n) return [];
      const m = typeof p?.brands === 'string' ? p.brands.split(',')[0].trim() : '';
      return [{ codigoBarras: cod, nome: n.slice(0, 200), marca: m || null, origem: 'open_food_facts' as const }];
    });
  } catch (e) {
    console.error('Scanner: busca por nome na OFF falhou:', e);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Produtos PARECIDOS (até 3, "provável" antes de "possível"). Não é o mesmo código: serve só de pista para a equipe. */
export async function buscarCandidatos(nome: string, marca?: string): Promise<Candidato[]> {
  const n = nome.trim();
  if (n.length < 3) return [];
  const [a, b] = await Promise.all([candidatosNaTabela(n), candidatosNaOff(n, marca?.trim() ?? '')]);
  return rankearCandidatos({ nome: n, marca }, [...a, ...b]);
}

// ---- pedido de cadastro para a equipe ----
export type PedidoCadastro = {
  codigo: string; motivo: MotivoSolicitacao; nome?: string; marca?: string;
  candidato?: { codigoBarras: string; nome: string } | null;
};
export type RespostaPedido = { produtoExiste: boolean; jaExistia: boolean };

/** Lança erro com mensagem amigável (o formulário mostra). Falha de rede nunca é engolida aqui. */
export async function solicitarCadastro(p: PedidoCadastro): Promise<RespostaPedido> {
  const codigo = normalizarCodigo(p.codigo);
  if (!codigo) throw new Error('Código de barras inválido.');
  const { data, error } = await supabase.rpc('scanner_solicitar_cadastro', {
    p_codigo: codigo, p_motivo: p.motivo, p_nome: p.nome?.trim() || null, p_marca: p.marca?.trim() || null,
    p_candidato_codigo: p.candidato?.codigoBarras ?? null, p_candidato_nome: p.candidato?.nome ?? null,
  });
  if (error) {
    if ((error as any).code === 'P0001') throw new Error('Você já enviou vários pedidos hoje. Tente de novo amanhã.');
    throw error;
  }
  cacheNegativo.delete(codigo);
  return { produtoExiste: !!data?.produto_existe, jaExistia: !!data?.ja_existia };
}

/** Evento de uso (só códigos curtos; sem texto livre). */
export function registrarLeitura(resultado: ResultadoBusca['status'], produto?: ProdutoScanner): void {
  registrarEvento('scanner_lido', {
    resultado,
    ...(produto ? { codigo: produto.codigoBarras, fonte: produto.fonte, nova: produto.classificacaoNova ?? 'NA', categoria: produto.categoriaTroca ?? 'NA' } : {}),
  });
}
