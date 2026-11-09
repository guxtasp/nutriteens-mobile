// src/features/adolescente/alimentacao/utils/categoriasAlimento.ts
//
// Regras e textos do cadastro de alimento pelo adolescente. Fica sem nenhuma
// dependência de React/React Native para poder ser testado com jest.
//
// REGRA DOS GRUPOS (decisão de produto, ver NovoAlimentoFormScreen):
//   - Natural ........... exatamente 1 grupo (uma banana é só fruta).
//   - Preparado em casa . 1 grupo ou mais, sem limite (um por ingrediente principal).
//   - Industrializado ... 1 grupo ou mais, sem limite (os do rótulo).
// Cada prato é de um jeito (arroz com feijão tem 2, uma feijoada tem vários), então não há teto:
// o único mínimo é 1 grupo.
// O banco já guarda vários (`alimentos.grupos_alimentares` é array) e o feedback da
// refeição já conta grupos únicos de todos os itens (regraFeedbackRefeicao.ts).

export type OrigemAlimento = 'PREPARADO_EM_CASA' | 'INDUSTRIALIZADO' | 'NATURAL';

export type CategoriaAlimento = {
  /** valor do enum no banco (alimentos.grupos_alimentares) */
  valor: string;
  rotulo: string;
  /** exemplos curtos para aparecer dentro do botão da categoria */
  exemplo: string;
};

export const CATEGORIAS: CategoriaAlimento[] = [
  { valor: 'CEREAIS_E_TUBERCULOS', rotulo: 'Cereais e Tubérculos', exemplo: 'arroz, pão, farinha, batata' },
  { valor: 'LEGUMES_E_VERDURAS', rotulo: 'Legumes e Verduras', exemplo: 'cenoura, alface, tomate' },
  { valor: 'FRUTAS', rotulo: 'Frutas', exemplo: 'banana, maçã, laranja' },
  { valor: 'LEITE_E_DERIVADOS', rotulo: 'Leite e Derivados', exemplo: 'leite, queijo, iogurte' },
  { valor: 'CARNES_E_OVOS', rotulo: 'Carnes e Ovos', exemplo: 'carne, frango, peixe, ovo' },
  { valor: 'LEGUMINOSAS', rotulo: 'Leguminosas', exemplo: 'feijão, lentilha, grão-de-bico' },
  { valor: 'OLEAGINOSAS_E_SEMENTES', rotulo: 'Oleaginosas e Sementes', exemplo: 'castanha, amendoim, chia' },
  { valor: 'OLEOS_E_GORDURAS', rotulo: 'Óleos e Gorduras', exemplo: 'óleo, manteiga, azeite' },
  { valor: 'ACUCARES_E_DOCES', rotulo: 'Açúcares e Doces', exemplo: 'açúcar, mel, chocolate' },
  { valor: 'BEBIDAS', rotulo: 'Bebidas', exemplo: 'suco, refrigerante, chá' },
];

const VALORES_CATEGORIA = new Set(CATEGORIAS.map((c) => c.valor));

export function rotuloCategoria(valor: string): string {
  return CATEGORIAS.find((c) => c.valor === valor)?.rotulo ?? valor;
}

export type RegraGrupos = { multiplo: boolean };

export function regraGrupos(origem: OrigemAlimento): RegraGrupos {
  return { multiplo: origem !== 'NATURAL' };
}

/** Toque em uma categoria: no natural troca a escolha; nos outros marca/desmarca, sem limite. */
export function alternarGrupo(atuais: string[], valor: string, origem: OrigemAlimento): string[] {
  if (!VALORES_CATEGORIA.has(valor)) return atuais;
  if (!regraGrupos(origem).multiplo) return [valor];
  return atuais.includes(valor) ? atuais.filter((g) => g !== valor) : [...atuais, valor];
}

/** Tira valores que não existem e repetidos, mantendo a ordem em que a pessoa marcou. */
export function normalizarGrupos(grupos: string[]): string[] {
  const vistos = new Set<string>();
  const saida: string[] = [];
  for (const g of grupos) {
    if (!VALORES_CATEGORIA.has(g) || vistos.has(g)) continue;
    vistos.add(g);
    saida.push(g);
  }
  return saida;
}

/** Grupos de uma lista de ingredientes (união, sem repetir, na ordem em que os ingredientes foram adicionados). */
export function gruposDosIngredientes(ingredientes: { grupos_alimentares?: string[] | null }[]): string[] {
  return normalizarGrupos(ingredientes.flatMap((i) => i.grupos_alimentares ?? []));
}

/** Mensagem para mostrar à pessoa, ou null se a lista serve. Espera a lista já normalizada. */
export function validarGrupos(grupos: string[]): string | null {
  if (grupos.length === 0) return 'Marque pelo menos 1 grupo alimentar.';
  return null;
}

// ---------------------------------------------------------------------------
// Textos do guia "Como preencher?" e das telas de cadastro
// ---------------------------------------------------------------------------

export type ExemploGuia = {
  nome: string;
  /** cada ingrediente (ou item do rótulo) e o grupo em que ele entra */
  itens: { ingrediente: string; grupo: string }[];
  /** observação curta opcional, mostrada embaixo do exemplo */
  nota?: string;
};

export type GuiaOrigem = {
  rotuloCurto: string;
  placeholderNome: string;
  tituloGrupos: string;
  subtituloGrupos: string;
  regra: string;
  /** uma linha para o cartão de ajuda dentro do formulário */
  resumoExemplo: string;
  exemplos: ExemploGuia[];
  dicas: string[];
};

export const GUIA_CADASTRO: Record<OrigemAlimento, GuiaOrigem> = {
  NATURAL: {
    rotuloCurto: 'Natural',
    placeholderNome: 'Ex.: Banana',
    tituloGrupos: 'Qual é o grupo dele?',
    subtituloGrupos: 'Escolha o grupo que mais combina. Alimento natural é uma coisa só, então vale 1 grupo.',
    regra: 'Escolha 1 grupo só: o alimento natural é uma coisa só.',
    resumoExemplo: 'Banana → Frutas',
    exemplos: [
      { nome: 'Banana', itens: [{ ingrediente: 'banana', grupo: 'FRUTAS' }] },
      { nome: 'Cenoura', itens: [{ ingrediente: 'cenoura', grupo: 'LEGUMES_E_VERDURAS' }] },
      { nome: 'Ovo cozido', itens: [{ ingrediente: 'ovo', grupo: 'CARNES_E_OVOS' }] },
    ],
    dicas: ['Pergunte: "o que é isso?". A resposta é o grupo.', 'Feijão é Leguminosa; arroz é Cereal.'],
  },
  PREPARADO_EM_CASA: {
    rotuloCurto: 'Em casa',
    placeholderNome: 'Ex.: Bolo de cenoura',
    tituloGrupos: 'O que tem nele?',
    subtituloGrupos: 'Procure os ingredientes principais e o Bróxis descobre os grupos. Não achou algum? Marque o grupo na mão.',
    regra: 'Procure cada ingrediente principal: os grupos aparecem sozinhos. Se não achar, marque o grupo na mão.',
    resumoExemplo: 'Bolo de cenoura → Legumes, Carnes e Ovos, Cereais e Açúcares',
    exemplos: [
      {
        nome: 'Bolo de cenoura',
        itens: [
          { ingrediente: 'cenoura', grupo: 'LEGUMES_E_VERDURAS' },
          { ingrediente: 'ovos', grupo: 'CARNES_E_OVOS' },
          { ingrediente: 'farinha de trigo', grupo: 'CEREAIS_E_TUBERCULOS' },
          { ingrediente: 'açúcar', grupo: 'ACUCARES_E_DOCES' },
        ],
        nota: 'Óleo, fermento e sal não precisam: marque só o que aparece bastante.',
      },
      {
        nome: 'Arroz com feijão',
        itens: [
          { ingrediente: 'arroz', grupo: 'CEREAIS_E_TUBERCULOS' },
          { ingrediente: 'feijão', grupo: 'LEGUMINOSAS' },
        ],
      },
      {
        nome: 'Vitamina de banana',
        itens: [
          { ingrediente: 'leite', grupo: 'LEITE_E_DERIVADOS' },
          { ingrediente: 'banana', grupo: 'FRUTAS' },
        ],
      },
    ],
    dicas: [
      'Pense na receita: cada ingrediente grande vira um grupo.',
      'Não lembra a receita? Marque o que dá pra ver no prato.',
      'Na dúvida, marque só o grupo que mais aparece. Já serve!',
    ],
  },
  INDUSTRIALIZADO: {
    rotuloCurto: 'Industrializado',
    placeholderNome: 'Ex.: Biscoito recheado',
    tituloGrupos: 'O que tem nele?',
    subtituloGrupos: 'Olhe o rótulo e marque o grupo dos primeiros ingredientes. Pode marcar quantos precisar.',
    regra: 'Olhe a lista de ingredientes do rótulo e marque os grupos dos primeiros.',
    resumoExemplo: 'Biscoito recheado → Cereais e Açúcares',
    exemplos: [
      {
        nome: 'Biscoito recheado',
        itens: [
          { ingrediente: 'farinha de trigo', grupo: 'CEREAIS_E_TUBERCULOS' },
          { ingrediente: 'açúcar', grupo: 'ACUCARES_E_DOCES' },
        ],
        nota: 'No rótulo, os ingredientes vêm em ordem: do que tem mais para o que tem menos.',
      },
      {
        nome: 'Nuggets de frango',
        itens: [
          { ingrediente: 'frango', grupo: 'CARNES_E_OVOS' },
          { ingrediente: 'farinha da massa', grupo: 'CEREAIS_E_TUBERCULOS' },
        ],
      },
      {
        nome: 'Refrigerante',
        itens: [{ ingrediente: 'a própria bebida', grupo: 'BEBIDAS' }],
        nota: 'Vale 1 grupo só: marcar mais de um não é obrigatório.',
      },
    ],
    dicas: [
      'Não precisa marcar corantes, conservantes e aromas.',
      'Na dúvida, marque só o grupo que mais aparece.',
    ],
  },
};

export type ClassificacaoNovaTexto = 'IN_NATURA' | 'INGREDIENTE_CULINARIO' | 'PROCESSADO' | 'ULTRAPROCESSADO';

/** Texto amigável (e sem cobrança) da classificação NOVA, usado na tela "Alimento cadastrado". */
export const TEXTO_CLASSIFICACAO: Record<ClassificacaoNovaTexto, { rotulo: string; explicacao: string }> = {
  IN_NATURA: { rotulo: 'Natural', explicacao: 'Veio direto da natureza, sem passar por fábrica.' },
  INGREDIENTE_CULINARIO: { rotulo: 'Ingrediente de cozinha', explicacao: 'Serve pra temperar e preparar outras comidas.' },
  PROCESSADO: { rotulo: 'Preparado ou processado', explicacao: 'Foi preparado ou conservado antes de chegar no seu prato.' },
  ULTRAPROCESSADO: {
    rotulo: 'Industrializado',
    explicacao: 'Vem pronto de fábrica. Sem problema: registrar de tudo ajuda o Bróxis a entender o seu dia.',
  },
};

/** Texto do botão de salvar conforme o que ainda falta preencher. */
export function textoBotaoCadastro(params: { nomeValido: boolean; qtdGrupos: number; multiplo: boolean }): string {
  if (!params.nomeValido) return 'Escreva o nome do alimento';
  if (params.qtdGrupos === 0) return params.multiplo ? 'Marque pelo menos 1 grupo' : 'Escolha um grupo';
  return 'Cadastrar alimento';
}
