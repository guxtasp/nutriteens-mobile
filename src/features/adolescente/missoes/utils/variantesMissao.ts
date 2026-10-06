// Biblioteca de VARIANTES de missão diária.
//
// Por que existe: missoes_catalogo tem uma linha por `tipo` (enum, UNIQUE) e
// só cinco tipos — por isso a missão do dia era sempre uma das mesmas.
// Em vez de criar centenas de valores de enum, cada variante usa um dos
// tipos existentes como "portador" (`tipoBase`, que é o que vai em
// missoes_diarias.missao_id) e grava o código dela em
// missoes_diarias.parametros.variante (jsonb que já existe) — sem migração.
//
// Texto, ícone e regra de cumprimento vêm DAQUI; pontos continuam os do
// catálogo. Lógica pura (sem Supabase): o serviço busca os dados do dia e
// entrega pra cá. Testada em __tests__/variantesMissao.test.ts.
import { alimentoEBoaFonte, type NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';
import { criarProgresso, UNIDADES, type Progresso, type Unidade } from './progresso';

export type TipoBase = 'AGUA_ML' | 'ATIVIDADE_MIN' | 'ALIMENTO_NATURAL_QTD' | 'REFEICAO_SEM_ULTRAPROCESSADO';
export type AreaVariante = 'AGUA' | 'ATIVIDADE' | 'ALIMENTACAO';

export type RegraVariante =
  | { regra: 'AGUA_PCT_META'; pct: number } // % da meta de água personalizada
  | { regra: 'ATIVIDADE_MIN'; min: number }
  | { regra: 'ATIVIDADE_PASSOS'; passos: number }
  | { regra: 'NATURAIS_QTD'; qtd: number } // porções in natura / ingrediente culinário
  | { regra: 'SEM_ULTRA'; refeicoes: number } // refeições sem nenhum ultraprocessado
  | { regra: 'REFEICOES_QTD'; qtd: number } // refeições registradas
  | { regra: 'REFEICAO_TIPO'; tipo: string } // registrar uma refeição específica
  | { regra: 'VARIEDADE_GRUPOS'; grupos: number } // grupos alimentares diferentes
  | { regra: 'GRUPO'; grupo: string; qtd: number } // itens de um grupo alimentar
  | { regra: 'FONTE_NUTRIENTE'; nutriente: NutrienteChave; qtd: number; rotulo: string };

export type VarianteMissao = {
  codigo: string;
  area: AreaVariante;
  tipoBase: TipoBase;
  titulo: string;
  descricao: string;
  icone: string;
  regra: RegraVariante;
};

// ---------------------------------------------------------------------
// Montagem do catálogo
// ---------------------------------------------------------------------
const lista: VarianteMissao[] = [];
const add = (v: VarianteMissao) => lista.push(v);

// --- Água (% da meta personalizada por peso) ---
for (const [pct, titulo, descricao] of [
  [50, 'Metade do caminho', 'Chegue à metade da sua meta de água hoje.'],
  [70, 'Cheio de gás', 'Beba pelo menos 70% da sua meta de água hoje.'],
  [90, 'Quase lá na água', 'Chegue a 90% da sua meta de água hoje.'],
  [100, 'Meta de água batida', 'Bata 100% da sua meta de água hoje.'],
  [120, 'Hidratação extra', 'Passe um pouquinho da meta: 120% da sua água de hoje (sem exagero, combinado?).'],
] as [number, string, string][]) {
  add({ codigo: `agua_pct_${pct}`, area: 'AGUA', tipoBase: 'AGUA_ML', titulo, descricao, icone: '💧', regra: { regra: 'AGUA_PCT_META', pct } });
}

// --- Atividade física: minutos ---
for (const [min, titulo, descricao] of [
  [15, 'Pique rápido', 'Se mexa por 15 minutos hoje: dançar, andar, o que você curtir.'],
  [20, 'Aquecimento do dia', 'Some 20 minutos de atividade física hoje.'],
  [30, 'Meia hora em movimento', 'Faça 30 minutos de atividade física hoje.'],
  [45, 'Dia ativo', 'Chegue a 45 minutos de atividade física hoje.'],
  [60, 'Hora de ouro', 'Um dia com 60 minutos de movimento — o que a OMS recomenda pra sua idade!'],
] as [number, string, string][]) {
  add({ codigo: `ativ_min_${min}`, area: 'ATIVIDADE', tipoBase: 'ATIVIDADE_MIN', titulo, descricao, icone: '🏃', regra: { regra: 'ATIVIDADE_MIN', min } });
}

// --- Atividade física: passos ---
for (const [passos, titulo, descricao] of [
  [3000, 'Primeiros passos', 'Dê 3.000 passos hoje.'],
  [5000, 'Caminhada animada', 'Chegue a 5.000 passos hoje.'],
  [7000, 'Explorador', 'Dê 7.000 passos hoje — passeie, suba escadas, vá a pé.'],
  [10000, 'Dez mil passos', 'Desafio clássico: 10.000 passos hoje!'],
] as [number, string, string][]) {
  add({ codigo: `ativ_passos_${passos}`, area: 'ATIVIDADE', tipoBase: 'ATIVIDADE_MIN', titulo, descricao, icone: '👟', regra: { regra: 'ATIVIDADE_PASSOS', passos } });
}

// --- Comida de verdade (in natura / ingrediente culinário) ---
for (const [qtd, titulo, descricao] of [
  [2, 'Comida de verdade', 'Registre 2 porções de alimentos naturais (frutas, legumes, arroz, feijão, ovos…).'],
  [3, 'Prato colorido', 'Registre 3 porções de alimentos naturais hoje.'],
  [4, 'Feira no prato', 'Chegue a 4 porções de alimentos naturais hoje.'],
  [5, 'Mestre do natural', 'Desafio: 5 porções de alimentos naturais hoje!'],
] as [number, string, string][]) {
  add({ codigo: `nat_${qtd}`, area: 'ALIMENTACAO', tipoBase: 'ALIMENTO_NATURAL_QTD', titulo, descricao, icone: '🥗', regra: { regra: 'NATURAIS_QTD', qtd } });
}

// --- Refeições sem ultraprocessado ---
for (const [refeicoes, titulo, descricao] of [
  [1, 'Uma refeição raiz', 'Faça 1 refeição sem nenhum ultraprocessado hoje.'],
  [2, 'Dupla sem ultra', 'Faça 2 refeições sem ultraprocessados hoje.'],
  [3, 'Dia sem ultra', 'Desafio: 3 refeições sem nenhum ultraprocessado hoje!'],
] as [number, string, string][]) {
  add({ codigo: `ultra_${refeicoes}`, area: 'ALIMENTACAO', tipoBase: 'REFEICAO_SEM_ULTRAPROCESSADO', titulo, descricao, icone: '🍽️', regra: { regra: 'SEM_ULTRA', refeicoes } });
}

// --- Quantas refeições registrar ---
for (const [qtd, titulo, descricao] of [
  [3, 'Diário em dia', 'Registre 3 refeições hoje.'],
  [4, 'Não esqueça de nada', 'Registre 4 refeições hoje, incluindo os lanchinhos.'],
  [5, 'Registro completo', 'Desafio: registre 5 refeições hoje!'],
] as [number, string, string][]) {
  add({ codigo: `refs_${qtd}`, area: 'ALIMENTACAO', tipoBase: 'ALIMENTO_NATURAL_QTD', titulo, descricao, icone: '📝', regra: { regra: 'REFEICOES_QTD', qtd } });
}

// --- Registrar uma refeição específica ---
for (const [tipo, titulo, descricao, icone] of [
  ['CAFE_DA_MANHA', 'Café da manhã de campeão', 'Registre o seu café da manhã hoje.', '🌅'],
  ['LANCHE_MANHA', 'Lanche da manhã', 'Registre o seu lanche da manhã hoje.', '🍎'],
  ['ALMOCO', 'Hora do almoço', 'Registre o seu almoço hoje.', '🍛'],
  ['LANCHE_TARDE', 'Lanche da tarde', 'Registre o seu lanche da tarde hoje.', '🥪'],
  ['JANTAR', 'Jantar em foco', 'Registre o seu jantar hoje.', '🌙'],
  ['CEIA', 'Ceia leve', 'Registre a sua ceia (lanchinho da noite) hoje.', '🥛'],
] as [string, string, string, string][]) {
  add({ codigo: `ref_${tipo}`, area: 'ALIMENTACAO', tipoBase: 'ALIMENTO_NATURAL_QTD', titulo, descricao, icone, regra: { regra: 'REFEICAO_TIPO', tipo } });
}

// --- Variedade de grupos alimentares ---
for (const [grupos, titulo, descricao] of [
  [3, 'Mix de grupos', 'Registre alimentos de 3 grupos alimentares diferentes hoje.'],
  [4, 'Prato variado', 'Registre alimentos de 4 grupos alimentares diferentes hoje.'],
  [5, 'Arco-íris alimentar', 'Desafio: alimentos de 5 grupos alimentares diferentes hoje!'],
] as [number, string, string][]) {
  add({ codigo: `var_${grupos}`, area: 'ALIMENTACAO', tipoBase: 'ALIMENTO_NATURAL_QTD', titulo, descricao, icone: '🌈', regra: { regra: 'VARIEDADE_GRUPOS', grupos } });
}

// --- Um grupo alimentar específico ---
const GRUPOS: { grupo: string; icone: string; nome: string; exemplos: string; qtds: number[] }[] = [
  { grupo: 'FRUTAS', icone: '🍌', nome: 'fruta', exemplos: 'banana, laranja, mamão, manga…', qtds: [1, 2, 3] },
  { grupo: 'LEGUMES_E_VERDURAS', icone: '🥕', nome: 'legume ou verdura', exemplos: 'cenoura, couve, tomate, abobrinha…', qtds: [1, 2, 3] },
  { grupo: 'LEGUMINOSAS', icone: '🫘', nome: 'leguminosa', exemplos: 'feijão, lentilha, grão-de-bico…', qtds: [1, 2] },
  { grupo: 'CARNES_E_OVOS', icone: '🥚', nome: 'carne ou ovo', exemplos: 'frango, peixe, carne, ovo…', qtds: [1, 2] },
  { grupo: 'LEITE_E_DERIVADOS', icone: '🥛', nome: 'leite ou derivado', exemplos: 'leite, iogurte, queijo…', qtds: [1, 2] },
  { grupo: 'CEREAIS_E_TUBERCULOS', icone: '🍚', nome: 'cereal ou tubérculo', exemplos: 'arroz, milho, batata, mandioca…', qtds: [1, 2] },
  { grupo: 'OLEAGINOSAS_E_SEMENTES', icone: '🥜', nome: 'oleaginosa ou semente', exemplos: 'castanha, amendoim, chia, linhaça…', qtds: [1] },
];
for (const g of GRUPOS) {
  for (const qtd of g.qtds) {
    add({
      codigo: `grupo_${g.grupo}_${qtd}`,
      area: 'ALIMENTACAO',
      tipoBase: 'ALIMENTO_NATURAL_QTD',
      titulo: qtd === 1 ? `Dia de ${g.nome}` : `${qtd} x ${g.nome}`,
      descricao: `Registre ${qtd === 1 ? '1 item' : `${qtd} itens`} de ${g.nome} hoje (${g.exemplos}).`,
      icone: g.icone,
      regra: { regra: 'GRUPO', grupo: g.grupo, qtd },
    });
  }
}

// --- Nutrientes (mesma lista de META_SEMANAL em nutrienteService.ts) ---
const NUTRIENTES: { chave: NutrienteChave; rotulo: string; icone: string; sugestao: string }[] = [
  { chave: 'vitamina_a', rotulo: 'vitamina A', icone: '🥕', sugestao: 'cenoura, manga ou folhas verde-escuras' },
  { chave: 'vitamina_c', rotulo: 'vitamina C', icone: '🍊', sugestao: 'laranja, acerola ou goiaba' },
  { chave: 'vitamina_d', rotulo: 'vitamina D', icone: '🐟', sugestao: 'ovo ou peixe' },
  { chave: 'calcio', rotulo: 'cálcio', icone: '🥛', sugestao: 'leite, iogurte ou queijo' },
  { chave: 'ferro', rotulo: 'ferro', icone: '🥩', sugestao: 'feijão, carne ou folhas verde-escuras' },
  { chave: 'zinco', rotulo: 'zinco', icone: '🌰', sugestao: 'carnes, ovos ou castanhas' },
  { chave: 'magnesio', rotulo: 'magnésio', icone: '🥜', sugestao: 'castanhas, sementes ou feijão' },
  { chave: 'proteina', rotulo: 'proteína', icone: '🍗', sugestao: 'carne, ovo, feijão ou leite' },
  { chave: 'fibra', rotulo: 'fibra', icone: '🥦', sugestao: 'frutas com casca, feijão ou verduras' },
];
for (const n of NUTRIENTES) {
  add({
    codigo: `nut_${n.chave}_1`,
    area: 'ALIMENTACAO',
    tipoBase: 'ALIMENTO_NATURAL_QTD',
    titulo: `Um toque de ${n.rotulo}`,
    descricao: `Registre 1 alimento rico em ${n.rotulo} hoje: ${n.sugestao}.`,
    icone: n.icone,
    regra: { regra: 'FONTE_NUTRIENTE', nutriente: n.chave, qtd: 1, rotulo: n.rotulo },
  });
  add({
    codigo: `nut_${n.chave}_2`,
    area: 'ALIMENTACAO',
    tipoBase: 'ALIMENTO_NATURAL_QTD',
    titulo: `Dose dupla de ${n.rotulo}`,
    descricao: `Registre 2 alimentos ricos em ${n.rotulo} hoje: ${n.sugestao}.`,
    icone: n.icone,
    regra: { regra: 'FONTE_NUTRIENTE', nutriente: n.chave, qtd: 2, rotulo: n.rotulo },
  });
}

export const VARIANTES_MISSAO: readonly VarianteMissao[] = lista;

const POR_CODIGO = new Map(lista.map((v) => [v.codigo, v]));

export function obterVariante(codigo: string | undefined | null): VarianteMissao | null {
  return codigo ? (POR_CODIGO.get(codigo) ?? null) : null;
}

/**
 * Sorteia uma variante, evitando as de `evitar` (ex.: as dos últimos dias).
 * Se não sobrar nenhuma (biblioteca pequena demais pro filtro), ignora `evitar`.
 */
export function sortearVariante(opcoes: {
  areas?: AreaVariante[];
  evitar?: string[];
  aleatorio?: () => number;
} = {}): VarianteMissao {
  const { areas, evitar = [], aleatorio = Math.random } = opcoes;
  const daArea = areas ? lista.filter((v) => areas.includes(v.area)) : lista;
  const semRepetidas = daArea.filter((v) => !evitar.includes(v.codigo));
  const pool = semRepetidas.length > 0 ? semRepetidas : daArea;
  return pool[Math.min(Math.floor(aleatorio() * pool.length), pool.length - 1)];
}

// ---------------------------------------------------------------------
// Progresso
// ---------------------------------------------------------------------
const UN_PASSO: Unidade = { singular: 'passo', plural: 'passos' };
const UN_ITEM: Unidade = { singular: 'item', plural: 'itens' };
const UN_GRUPO: Unidade = { singular: 'grupo', plural: 'grupos' };

/** Item de refeição do dia, como vem de refeicao_alimentos (com joins). */
export type ItemDoDia = {
  refeicao_id: string;
  quantidade?: number;
  alimentos?: any; // { classificacao_nova, grupos_alimentares, alimento_nutrientes }
  refeicoes?: { tipo?: string } | null;
};

/** Meta em ml da variante de água, a partir da meta personalizada. */
export function metaAguaDaVariante(regra: Extract<RegraVariante, { regra: 'AGUA_PCT_META' }>, metaMl: number): number {
  return Math.round((metaMl * regra.pct) / 100);
}

/** Progresso das variantes que dependem só dos itens de comida do dia. */
export function calcularProgressoAlimentar(regra: RegraVariante, itens: ItemDoDia[]): Progresso | null {
  switch (regra.regra) {
    case 'NATURAIS_QTD': {
      const qtd = itens
        .filter((i) => ['IN_NATURA', 'INGREDIENTE_CULINARIO'].includes(i.alimentos?.classificacao_nova))
        .reduce((s, i) => s + (i.quantidade ?? 1), 0);
      return criarProgresso(qtd, regra.qtd, UNIDADES.porcao);
    }
    case 'SEM_ULTRA': {
      const porRefeicao = new Map<string, boolean>(); // refeição -> sem ultraprocessado até agora
      for (const i of itens) {
        const ok = i.alimentos?.classificacao_nova !== 'ULTRAPROCESSADO';
        porRefeicao.set(i.refeicao_id, (porRefeicao.get(i.refeicao_id) ?? true) && ok);
      }
      const boas = [...porRefeicao.values()].filter(Boolean).length;
      return criarProgresso(boas, regra.refeicoes, UNIDADES.refeicao);
    }
    case 'REFEICOES_QTD':
      return criarProgresso(new Set(itens.map((i) => i.refeicao_id)).size, regra.qtd, UNIDADES.refeicao);
    case 'REFEICAO_TIPO': {
      const teve = itens.some((i) => i.refeicoes?.tipo === regra.tipo);
      return criarProgresso(teve ? 1 : 0, 1, UNIDADES.refeicao);
    }
    case 'VARIEDADE_GRUPOS': {
      const grupos = new Set<string>();
      for (const i of itens) for (const g of i.alimentos?.grupos_alimentares ?? []) grupos.add(g);
      return criarProgresso(grupos.size, regra.grupos, UN_GRUPO);
    }
    case 'GRUPO': {
      const qtd = itens.filter((i) => (i.alimentos?.grupos_alimentares ?? []).includes(regra.grupo)).length;
      return criarProgresso(qtd, regra.qtd, UN_ITEM);
    }
    case 'FONTE_NUTRIENTE': {
      const qtd = itens.filter((i) => alimentoEBoaFonte(i.alimentos, regra.nutriente)).length;
      return criarProgresso(qtd, regra.qtd, {
        singular: `alimento fonte de ${regra.rotulo}`,
        plural: `alimentos fonte de ${regra.rotulo}`,
      });
    }
    default:
      return null; // água/atividade: precisam de outros dados (ver missaoService)
  }
}

export function progressoAtividadePassos(passosTotal: number, alvo: number): Progresso {
  return criarProgresso(passosTotal, alvo, UN_PASSO);
}
