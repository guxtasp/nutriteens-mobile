// Regras puras do Scanner (prova de conceito). Sem I/O, para testar.
// Tom: neutro e acolhedor. Sem caloria, sem culpa, sem julgamento.
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import type { CategoriaTroca } from '../../trocas/utils/trocas';

/** Dados do rótulo (a cada 100 g/ml) vindos da Open Food Facts. Sem calorias, de propósito. */
export type DetalhesProduto = {
  imagemUrl?: string | null;
  acucarG?: number | null;
  salG?: number | null;
  gorduraSatG?: number | null;
  fibraG?: number | null;
  proteinaG?: number | null;
  aditivos?: number | null;
  ingredientes?: string[];      // os primeiros, na ordem do rótulo (do que tem mais para o que tem menos)
};

export type ProdutoScanner = {
  detalhes?: DetalhesProduto | null;
  codigoBarras: string;
  nome: string;
  marca: string | null;
  classificacaoNova: ClassificacaoNova | null;
  categoriaTroca: CategoriaTroca | null;
  fonte: 'OPEN_FOOD_FACTS' | 'USUARIO' | 'EQUIPE';
};

// ---------- código de barras ----------

/** Só dígitos, sem espaços. */
export function soDigitos(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

/** Dígito verificador GS1 (vale para EAN-8, UPC-A/12, EAN-13 e 14). */
export function checksumGs1Ok(codigo: string): boolean {
  if (!/^\d+$/.test(codigo) || ![8, 12, 13, 14].includes(codigo.length)) return false;
  const digitos = codigo.split('').map(Number);
  const verificador = digitos.pop() as number;
  // pesos 3,1,3,1... a partir do dígito mais próximo do verificador
  const soma = digitos.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (soma % 10)) % 10 === verificador;
}

/** Código limpo e válido, ou null (leitura torta da câmera não vai ao banco nem à rede). */
export function normalizarCodigo(raw: string): string | null {
  const c = soDigitos(raw);
  return checksumGs1Ok(c) ? c : null;
}

/**
 * Códigos equivalentes do MESMO produto (GTIN com zeros à esquerda): UPC-A (12) = EAN-13 com "0" na frente,
 * e GTIN-14 com "0" na frente = EAN-13. O primeiro item é sempre o código lido. EAN-8 não tem equivalente
 * seguro (ele não é um GTIN-13 com zeros), então fica sozinho. Só devolve variantes com dígito verificador válido.
 */
export function variantesCodigo(codigo: string): string[] {
  if (!checksumGs1Ok(codigo)) return [];
  const saida = [codigo];
  const add = (c: string) => { if (!saida.includes(c) && checksumGs1Ok(c)) saida.push(c); };
  if (codigo.length === 12) add(`0${codigo}`);
  if (codigo.length === 13 && codigo.startsWith('0')) add(codigo.slice(1));
  if (codigo.length === 14 && codigo.startsWith('0')) {
    add(codigo.slice(1));
    if (codigo[1] === '0') add(codigo.slice(2));
  }
  return saida;
}

// ---------- Open Food Facts ----------

export function novaDoOpenFoodFacts(n: unknown): ClassificacaoNova | null {
  const v = typeof n === 'string' ? Number(n) : n;
  switch (v) {
    case 1: return 'IN_NATURA';
    case 2: return 'INGREDIENTE_CULINARIO';
    case 3: return 'PROCESSADO';
    case 4: return 'ULTRAPROCESSADO';
    default: return null;
  }
}

// Ordem importa: do mais específico para o mais geral (ex.: biscoito de chocolate é BISCOITO).
const REGRAS_CATEGORIA: { categoria: CategoriaTroca; padrao: RegExp }[] = [
  { categoria: 'REFRIGERANTE_BEBIDA', padrao: /soda|carbonated|sweetened-beverage|energy-drink|juice-drink|nectar|powdered-drink|instant-beverage|chocolate-powder|cocoa-powder|refrigerante|achocolatado/ },
  { categoria: 'BISCOITO', padrao: /biscuit|cookie|biscoito|bolacha/ },
  { categoria: 'SALGADINHO', padrao: /salty-snack|savory-snack|chips|crisps|puffed|extruded|salgadinho/ },
  { categoria: 'EMBUTIDO', padrao: /sausage|\bham\b|hams|cold-cut|mortadella|salami|charcuterie|hot-dog|salsicha|presunto|linguica/ },
  { categoria: 'DOCE', padrao: /chocolate|candy|candies|confectioner|sweet-snack|bonbon|chewing-gum|ice-cream|lollipop|bala\b|doce/ },
  { categoria: 'REFRIGERANTE_BEBIDA', padrao: /beverage|drink|juice|bebida|suco/ },
];

/** Infere a categoria de troca pelas `categories_tags` da OFF (ex.: "en:sodas"). Sem match: null. */
export function categoriaPorTags(tags: unknown): CategoriaTroca | null {
  if (!Array.isArray(tags)) return null;
  const limpas = tags.filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase().replace(/^[a-z]{2}:/, ''));
  for (const regra of REGRAS_CATEGORIA) {
    if (limpas.some((t) => regra.padrao.test(t))) return regra.categoria;
  }
  return null;
}

const limpo = (s: unknown): string | null => (typeof s === 'string' && s.trim() ? s.trim() : null);

function numero(v: unknown): number | null {
  const x = typeof v === 'string' ? Number(v) : v;
  return typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.round(x * 100) / 100 : null;
}

/** Primeiros `n` ingredientes (separa por vírgula/ponto e vírgula fora de parênteses). */
export function ingredientesPrincipais(texto: unknown, n = 3): string[] {
  const t = limpo(texto)?.replace(/^ingredientes?\s*:\s*/i, '').replace(/_/g, '');
  if (!t) return [];
  const partes: string[] = [];
  let atual = '';
  let prof = 0;
  for (const ch of t) {
    if (ch === '(' || ch === '[') prof++;
    else if (ch === ')' || ch === ']') prof = Math.max(0, prof - 1);
    if ((ch === ',' || ch === ';') && prof === 0) { partes.push(atual); atual = ''; } else atual += ch;
  }
  partes.push(atual);
  return partes
    .map((x) => x.trim().replace(/\.$/, ''))
    .filter((x) => x.length > 0)
    .slice(0, n)
    .map((x) => (x.length > 40 ? `${x.slice(0, 37)}...` : x))
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1));
}

/** Resposta da OFF (api v2) -> produto nosso. Sem nome utilizável = null ("não encontrado"). */
export function mapearOpenFoodFacts(json: any, codigo: string): ProdutoScanner | null {
  if (!json || json.status !== 1 || !json.product) return null;
  const p = json.product;
  const nome = limpo(p.product_name_pt) ?? limpo(p.product_name) ?? limpo(p.generic_name_pt) ?? limpo(p.generic_name);
  if (!nome) return null;
  const marca = limpo(typeof p.brands === 'string' ? p.brands.split(',')[0] : null);
  return {
    codigoBarras: codigo,
    nome: nome.slice(0, 200),
    marca: marca ? marca.slice(0, 120) : null,
    classificacaoNova: novaDoOpenFoodFacts(p.nova_group),
    categoriaTroca: categoriaPorTags(p.categories_tags),
    fonte: 'OPEN_FOOD_FACTS',
    detalhes: detalhesDaOff(p),
  };
}

export type AvaliacaoOff =
  | { tipo: 'inexistente' }                                // a OFF respondeu e não tem esse código
  | { tipo: 'sem_nome'; classificacaoNova: ClassificacaoNova | null } // existe, mas a ficha não tem nome utilizável
  | { tipo: 'ok'; produto: ProdutoScanner };               // pode vir sem nível de processamento

/** Separa "não existe" de "existe com ficha incompleta" (a falha de rede é tratada fora, no serviço). */
export function avaliarOpenFoodFacts(json: any, codigo: string): AvaliacaoOff {
  if (!json || json.status !== 1 || !json.product) return { tipo: 'inexistente' };
  const produto = mapearOpenFoodFacts(json, codigo);
  if (produto) return { tipo: 'ok', produto };
  return { tipo: 'sem_nome', classificacaoNova: novaDoOpenFoodFacts(json.product.nova_group) };
}

function detalhesDaOff(p: any): DetalhesProduto {
  const n = p.nutriments ?? {};
  const img = limpo(p.image_front_small_url);
  return {
    imagemUrl: img && img.startsWith('https://') ? img : null,
    acucarG: numero(n.sugars_100g),
    salG: numero(n.salt_100g),
    gorduraSatG: numero(n['saturated-fat_100g']),
    fibraG: numero(n.fiber_100g),
    proteinaG: numero(n.proteins_100g),
    aditivos: numero(p.additives_n),
    ingredientes: ingredientesPrincipais(p.ingredients_text_pt ?? p.ingredients_text),
  };
}

// ---------- texto da tela de resultado ----------

export const ROTULO_PROCESSAMENTO: Record<ClassificacaoNova, string> = {
  IN_NATURA: 'Natural ou quase natural',
  INGREDIENTE_CULINARIO: 'Ingrediente de cozinha',
  PROCESSADO: 'Com algum preparo',
  ULTRAPROCESSADO: 'Bem industrializado',
};

// Conteúdo educativo: a nutricionista deve revisar os textos.
export const EXPLICACAO_PROCESSAMENTO: Record<ClassificacaoNova, string> = {
  IN_NATURA: 'É um alimento natural ou com pouquíssima transformação. Combina com o dia a dia!',
  INGREDIENTE_CULINARIO: 'É um ingrediente de cozinha, desses que ajudam a temperar e a preparar receitas em casa.',
  PROCESSADO: 'É um alimento com algum preparo, como conservas, queijos e pães. Pode fazer parte da sua rotina.',
  ULTRAPROCESSADO: 'É um produto bem industrializado, feito com vários ingredientes e aditivos. Se quiser variar, a gente tem ideias de trocas.',
};

export const TEXTO_SEM_CLASSIFICACAO = 'Ainda não sabemos o nível de processamento deste produto.';

export function ehUltraprocessado(n: ClassificacaoNova | null | undefined): boolean {
  return n === 'ULTRAPROCESSADO';
}

export type ModoResultado = 'ALTERNATIVAS' | 'POSITIVO' | 'SEM_CLASSIFICACAO' | 'SEM_CATEGORIA';

/**
 * O que a tela mostra para um produto encontrado:
 *  - ultraprocessado + categoria de troca -> alternativas
 *  - ultraprocessado sem categoria        -> só a explicação (e atalho para sugestões gerais)
 *  - sem classificação                    -> texto neutro, sem conclusão
 *  - demais                               -> mensagem positiva
 */
export function modoDoResultado(p: Pick<ProdutoScanner, 'classificacaoNova' | 'categoriaTroca'>): ModoResultado {
  if (p.classificacaoNova === null) return 'SEM_CLASSIFICACAO';
  if (!ehUltraprocessado(p.classificacaoNova)) return 'POSITIVO';
  return p.categoriaTroca ? 'ALTERNATIVAS' : 'SEM_CATEGORIA';
}

// ---------- diagnóstico visual (Raio-X do rótulo) ----------
// Faixas por 100 g (referência FSA/UK). Mostradas como "pouco / médio / bastante", sem cores de alerta.

export type NutrienteNivel = 'ACUCAR' | 'SAL' | 'GORDURA_SAT';
export type NivelNutriente = 'POUCO' | 'MEDIO' | 'BASTANTE';

const LIMITES: Record<NutrienteNivel, [number, number]> = { ACUCAR: [5, 22.5], SAL: [0.3, 1.5], GORDURA_SAT: [1.5, 5] };

export const ROTULO_NIVEL: Record<NivelNutriente, string> = { POUCO: 'pouco', MEDIO: 'médio', BASTANTE: 'bastante' };

export function nivelNutriente(tipo: NutrienteNivel, g: number | null | undefined): NivelNutriente | null {
  if (typeof g !== 'number' || !Number.isFinite(g) || g < 0) return null;
  const [baixo, alto] = LIMITES[tipo];
  return g <= baixo ? 'POUCO' : g <= alto ? 'MEDIO' : 'BASTANTE';
}

/** Açúcar em colheres de chá (4 g cada), arredondado em meias colheres. Menos de meia = null. */
export function colheresDeAcucar(g: number | null | undefined): string | null {
  if (typeof g !== 'number' || !Number.isFinite(g)) return null;
  const n = Math.round((g / 4) * 2) / 2;
  if (n < 0.5) return null;
  return n === 1 ? 'cerca de 1 colher de chá' : `cerca de ${String(n).replace('.', ',')} colheres de chá`;
}

/** Pontos de atenção positivos do rótulo: fibra (>= 3 g) e proteína (>= 7,5 g) a cada 100 g. */
export function pontosPositivos(d: DetalhesProduto | null | undefined): string[] {
  const out: string[] = [];
  if (d && typeof d.fibraG === 'number' && d.fibraG >= 3) out.push('fonte de fibras');
  if (d && typeof d.proteinaG === 'number' && d.proteinaG >= 7.5) out.push('fonte de proteína');
  return out;
}

const ROTULO_ATENCAO: Record<NutrienteNivel, string> = { ACUCAR: 'bastante açúcar', SAL: 'bastante sal', GORDURA_SAT: 'bastante gordura saturada' };

/** Resumo em poucas etiquetas, para bater o olho (até 4). */
export function resumoDiagnostico(p: Pick<ProdutoScanner, 'classificacaoNova' | 'detalhes'>): string[] {
  const d = p.detalhes ?? null;
  const out: string[] = [];
  if (p.classificacaoNova) out.push(ROTULO_PROCESSAMENTO[p.classificacaoNova]);
  if (d) {
    if (nivelNutriente('ACUCAR', d.acucarG) === 'BASTANTE') out.push(ROTULO_ATENCAO.ACUCAR);
    if (nivelNutriente('SAL', d.salG) === 'BASTANTE') out.push(ROTULO_ATENCAO.SAL);
    if (nivelNutriente('GORDURA_SAT', d.gorduraSatG) === 'BASTANTE') out.push(ROTULO_ATENCAO.GORDURA_SAT);
  }
  out.push(...pontosPositivos(d));
  return out.slice(0, 4);
}

export function textoAditivos(n: number | null | undefined): string | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  if (n === 0) return 'Nenhum aditivo na lista de ingredientes';
  return n === 1 ? '1 aditivo na lista de ingredientes' : `${n} aditivos na lista de ingredientes`;
}

// ---------- correspondência por nome e marca (só gera CANDIDATOS; nunca confirma) ----------

/** minúsculas, sem acento nem pontuação, espaços únicos. */
export function normalizarTexto(t: unknown): string {
  return (typeof t === 'string' ? t : '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const PALAVRAS_VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'com', 'sem', 'e', 'a', 'o', 'para', 'em', 'tipo']);

function palavras(t: unknown): string[] {
  return normalizarTexto(t).split(' ').filter((w) => w.length > 1 && !PALAVRAS_VAZIAS.has(w));
}

/** Parte das palavras do texto digitado que aparecem no candidato (0 a 1). */
export function coberturaDePalavras(consulta: unknown, candidato: unknown): number {
  const q = palavras(consulta);
  if (q.length === 0) return 0;
  const c = new Set(palavras(candidato));
  return q.filter((w) => c.has(w)).length / q.length;
}

export type ConfiancaCandidato = 'PROVAVEL' | 'POSSIVEL' | 'DESCARTADO';

/**
 * PROVAVEL: marca informada bate E ao menos 80% das palavras do nome batem.
 * POSSIVEL: ao menos 60% das palavras do nome batem (e a marca, se informada, não contradiz).
 * Sem marca informada, nunca passa de POSSIVEL. Nada aqui confirma o produto: a equipe decide.
 */
export function confiancaDoCandidato(
  busca: { nome: string; marca?: string | null },
  cand: { nome: string; marca?: string | null },
): ConfiancaCandidato {
  const nomeOk = coberturaDePalavras(busca.nome, `${cand.nome} ${cand.marca ?? ''}`);
  const marcaBusca = normalizarTexto(busca.marca);
  const marcaCand = normalizarTexto(cand.marca);
  const marcaBate = !!marcaBusca && !!marcaCand && (marcaCand.includes(marcaBusca) || marcaBusca.includes(marcaCand));
  const marcaContradiz = !!marcaBusca && !!marcaCand && !marcaBate;
  if (marcaContradiz) return 'DESCARTADO';
  if (marcaBate && nomeOk >= 0.8) return 'PROVAVEL';
  if (nomeOk >= 0.6) return 'POSSIVEL';
  return 'DESCARTADO';
}

const ORDEM_CONFIANCA: Record<ConfiancaCandidato, number> = { PROVAVEL: 0, POSSIVEL: 1, DESCARTADO: 2 };

export type Candidato = { codigoBarras: string; nome: string; marca: string | null; confianca: Exclude<ConfiancaCandidato, 'DESCARTADO'>; origem: 'proprio' | 'open_food_facts' };

/** Filtra e ordena candidatos (sem repetir código), no máximo `limite`. */
export function rankearCandidatos(
  busca: { nome: string; marca?: string | null },
  lista: { codigoBarras: string; nome: string; marca: string | null; origem: Candidato['origem'] }[],
  limite = 3,
): Candidato[] {
  const vistos = new Set<string>();
  const out: Candidato[] = [];
  for (const c of lista) {
    if (vistos.has(c.codigoBarras)) continue;
    vistos.add(c.codigoBarras);
    const confianca = confiancaDoCandidato(busca, c);
    if (confianca !== 'DESCARTADO') out.push({ ...c, confianca });
  }
  return out.sort((a, b) => ORDEM_CONFIANCA[a.confianca] - ORDEM_CONFIANCA[b.confianca]).slice(0, limite);
}
