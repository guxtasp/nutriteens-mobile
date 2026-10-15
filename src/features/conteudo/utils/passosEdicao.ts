// src/features/conteudo/utils/passosEdicao.ts
// Modelo de edição dos passos de uma lição (lógica pura, sem React nem Supabase).
// As estruturas seguem EXATAMENTE as do seed (seed_trilha_completa.sql) e as convenções
// documentadas em trilhaService.ts / prato.ts:
//   completar   -> enunciado com o token {lacuna}; opções = banco de palavras (1 correta)
//   ordene      -> opções na ORDEM CORRETA (todas correta=true; a ordem é o gabarito)
//   associe     -> dados_extra.pares [{id, esquerda, direita}]
//   memoria     -> dados_extra.pares (+ feedback opcional)
//   classifique -> dados_extra.categorias + opcoes[].categoria (todas correta=true)
//   cartao      -> enunciado = título; dados_extra.texto = corpo
//   enquete/meta-> opções sem certo/errado (correta=false) + dados_extra.feedback
//   prato       -> dados_extra.alimentos/criterios/capacidade/minimoItens/feedback; sem opções
// O banco valida de novo (conteudo_salvar_licao); aqui é para avisar antes de gravar.

export type FormatoPasso =
  | 'cartao'
  | 'enquete'
  | 'meta'
  | 'multipla_escolha'
  | 'verdadeiro_falso'
  | 'completar'
  | 'ordene'
  | 'associe'
  | 'classifique'
  | 'memoria'
  | 'prato';

export const FORMATOS_PASSO: FormatoPasso[] = [
  'cartao',
  'multipla_escolha',
  'verdadeiro_falso',
  'completar',
  'ordene',
  'associe',
  'classifique',
  'memoria',
  'prato',
  'enquete',
  'meta',
];

export type TipoLicaoEdicao = 'conteudo' | 'quiz' | 'atividade_rastreavel';

export const ROTULO_TIPO_LICAO: Record<TipoLicaoEdicao, string> = {
  conteudo: 'Leitura',
  quiz: 'Quiz',
  atividade_rastreavel: 'Prática real (hábito)',
};

/** Valores usados no seed para licoes.tipo_habito. */
export const HABITOS = ['alimentacao', 'agua', 'atividade_fisica'] as const;
export type Habito = (typeof HABITOS)[number];
export const ROTULO_HABITO: Record<Habito, string> = {
  alimentacao: 'Alimentação',
  agua: 'Água',
  atividade_fisica: 'Atividade física',
};

/** Ícones que o seed já usa em licoes.icone. */
export const ICONES_SUGERIDOS = ['leaf-outline', 'reader-outline', 'restaurant-outline', 'water-outline', 'walk-outline'];

export const LIMITES = {
  titulo: 120,
  xpMax: 500,
  passosMax: 30,
  opcoesMax: 6,
  ordeneMax: 8,
  paresMax: 8,
  categoriasMax: 4,
  janelaMin: 1,
  janelaMax: 168,
  janelaPadrao: 24,
  capacidadeMin: 3,
  capacidadeMax: 7,
  capacidadePadrao: 6,
  minimoItensPadrao: 3,
} as const;

export type OpcaoPasso = { texto: string; correta: boolean; categoria?: string | null };

export type PassoEdicao = {
  /** chave local (só para a lista na tela; não vai para o banco) */
  chave: string;
  formato: FormatoPasso;
  enunciado: string;
  opcoes: OpcaoPasso[];
  dadosExtra: Record<string, any>;
};

export type PassoPayload = {
  enunciado: string;
  formato: FormatoPasso;
  dados_extra: Record<string, any>;
  opcoes: { texto: string; correta: boolean; categoria: string | null }[];
};

let contador = 0;
export function novaChave(): string {
  contador += 1;
  return `p${Date.now().toString(36)}${contador}`;
}

function opcoesVazias(n: number, correta = false): OpcaoPasso[] {
  return Array.from({ length: n }, () => ({ texto: '', correta }));
}

/** Passo novo, com o esqueleto de cada formato. */
export function passoVazio(formato: FormatoPasso): PassoEdicao {
  const base = { chave: novaChave(), formato, enunciado: '' };
  switch (formato) {
    case 'cartao':
      return { ...base, opcoes: [], dadosExtra: { texto: '' } };
    case 'multipla_escolha':
      return { ...base, opcoes: opcoesVazias(3), dadosExtra: { explicacao: '' } };
    case 'verdadeiro_falso':
      return {
        ...base,
        opcoes: [
          { texto: 'Verdadeiro', correta: false },
          { texto: 'Falso', correta: false },
        ],
        dadosExtra: { explicacao: '' },
      };
    case 'completar':
      return { ...base, enunciado: '{lacuna}', opcoes: opcoesVazias(3), dadosExtra: { explicacao: '' } };
    case 'ordene':
      return { ...base, opcoes: opcoesVazias(3, true), dadosExtra: { explicacao: '' } };
    case 'associe':
      return { ...base, opcoes: [], dadosExtra: { pares: parVazios(2), explicacao: '' } };
    case 'memoria':
      return { ...base, opcoes: [], dadosExtra: { pares: parVazios(3), feedback: '' } };
    case 'classifique':
      return {
        ...base,
        opcoes: [
          { texto: '', correta: true, categoria: null },
          { texto: '', correta: true, categoria: null },
          { texto: '', correta: true, categoria: null },
          { texto: '', correta: true, categoria: null },
        ],
        dadosExtra: { categorias: ['', ''], explicacao: '' },
      };
    case 'enquete':
    case 'meta':
      return { ...base, opcoes: opcoesVazias(3), dadosExtra: { feedback: '' } };
    case 'prato':
      return {
        ...base,
        opcoes: [],
        dadosExtra: {
          alimentos: [],
          criterios: [],
          capacidade: LIMITES.capacidadePadrao,
          minimoItens: LIMITES.minimoItensPadrao,
          feedback: '',
        },
      };
  }
}

export function parVazios(n: number): { id: string; esquerda: string; direita: string }[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, esquerda: '', direita: '' }));
}

const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Mantém o id que o item já tem (para não mudar o que já está no banco); só cria se faltar ou repetir. */
function idUnico(existente: unknown, gerar: () => string, usados: Set<string>): string {
  const atual = txt(existente);
  if (atual && !usados.has(atual)) {
    usados.add(atual);
    return atual;
  }
  let id = gerar();
  let n = 2;
  const base = id;
  while (usados.has(id)) id = `${base}_${n++}`;
  usados.add(id);
  return id;
}

/** Ids estáveis para um id de alimento do prato (ex.: "Feijão" -> "feijao"). */
export function idDoAlimento(nome: string, usados: Set<string>): string {
  const base =
    nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'item';
  let id = base;
  let n = 2;
  while (usados.has(id)) id = `${base}_${n++}`;
  usados.add(id);
  return id;
}

// ------------------------------------------------------------------ validação

function inteiroOuNulo(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
}

/** Problemas objetivos de UM passo (mensagens curtas, sem o prefixo "Passo N"). */
export function validarPasso(p: PassoEdicao): string[] {
  const erros: string[] = [];
  const enun = txt(p.enunciado);
  const extra = p.dadosExtra ?? {};
  const opcoes = p.opcoes ?? [];
  const corretas = opcoes.filter((o) => o.correta).length;
  const opcaoVazia = opcoes.some((o) => txt(o.texto) === '');

  if (!enun) erros.push(p.formato === 'cartao' ? 'O cartão precisa de um título.' : 'O enunciado está vazio.');

  switch (p.formato) {
    case 'cartao':
      if (!txt(extra.texto)) erros.push('O cartão precisa de texto.');
      break;

    case 'multipla_escolha':
      if (opcoes.length < 2) erros.push('Coloque pelo menos 2 alternativas.');
      if (opcoes.length > LIMITES.opcoesMax) erros.push(`No máximo ${LIMITES.opcoesMax} alternativas.`);
      if (opcaoVazia) erros.push('Há alternativa em branco.');
      if (corretas !== 1) erros.push(corretas === 0 ? 'Marque a alternativa correta.' : 'Só uma alternativa pode ser a correta.');
      break;

    case 'verdadeiro_falso':
      if (opcoes.length !== 2) erros.push('Verdadeiro ou falso tem exatamente 2 opções.');
      if (corretas !== 1) erros.push('Marque se a afirmação é verdadeira ou falsa.');
      break;

    case 'completar': {
      const lacunas = enun.split('{lacuna}').length - 1;
      if (lacunas !== 1) erros.push('Use {lacuna} exatamente uma vez no enunciado.');
      if (opcoes.length < 2) erros.push('Coloque pelo menos 2 palavras no banco.');
      if (opcoes.length > LIMITES.opcoesMax) erros.push(`No máximo ${LIMITES.opcoesMax} palavras no banco.`);
      if (opcaoVazia) erros.push('Há palavra em branco no banco.');
      if (corretas !== 1) erros.push(corretas === 0 ? 'Marque a palavra correta.' : 'Só uma palavra pode ser a correta.');
      break;
    }

    case 'ordene':
      if (opcoes.length < 2) erros.push('Coloque pelo menos 2 itens para ordenar.');
      if (opcoes.length > LIMITES.ordeneMax) erros.push(`No máximo ${LIMITES.ordeneMax} itens.`);
      if (opcaoVazia) erros.push('Há item em branco.');
      break;

    case 'enquete':
    case 'meta':
      if (opcoes.length < 2) erros.push('Coloque pelo menos 2 opções.');
      if (opcoes.length > LIMITES.opcoesMax) erros.push(`No máximo ${LIMITES.opcoesMax} opções.`);
      if (opcaoVazia) erros.push('Há opção em branco.');
      break;

    case 'associe':
    case 'memoria': {
      const pares: any[] = Array.isArray(extra.pares) ? extra.pares : [];
      if (pares.length < 2) erros.push('Coloque pelo menos 2 pares.');
      if (pares.length > LIMITES.paresMax) erros.push(`No máximo ${LIMITES.paresMax} pares.`);
      if (pares.some((x) => !txt(x?.esquerda) || !txt(x?.direita))) erros.push('Há par com um lado em branco.');
      break;
    }

    case 'classifique': {
      const categorias: string[] = (Array.isArray(extra.categorias) ? extra.categorias : []).map(txt);
      if (categorias.length < 2) erros.push('Coloque pelo menos 2 colunas.');
      if (categorias.length > LIMITES.categoriasMax) erros.push(`No máximo ${LIMITES.categoriasMax} colunas.`);
      if (categorias.some((c) => c === '')) erros.push('Há coluna sem nome.');
      if (new Set(categorias.map((c) => c.toLowerCase())).size !== categorias.length) erros.push('Há colunas com o mesmo nome.');
      if (opcoes.length < 2) erros.push('Coloque pelo menos 2 itens para classificar.');
      if (opcoes.length > LIMITES.opcoesMax * 2) erros.push(`No máximo ${LIMITES.opcoesMax * 2} itens.`);
      if (opcaoVazia) erros.push('Há item em branco.');
      if (opcoes.some((o) => !o.categoria || !categorias.includes(txt(o.categoria)))) erros.push('Escolha a coluna certa de cada item.');
      break;
    }

    case 'prato':
      erros.push(...validarPrato(extra));
      break;
  }
  return erros;
}

function validarPrato(extra: Record<string, any>): string[] {
  const erros: string[] = [];
  const alimentos: any[] = Array.isArray(extra.alimentos) ? extra.alimentos : [];
  const criterios: any[] = Array.isArray(extra.criterios) ? extra.criterios : [];
  const capacidade = inteiroOuNulo(extra.capacidade);
  const minimoItens = inteiroOuNulo(extra.minimoItens);

  if (alimentos.length < LIMITES.minimoItensPadrao) erros.push(`Coloque pelo menos ${LIMITES.minimoItensPadrao} alimentos na bandeja.`);
  if (alimentos.some((a) => !txt(a?.nome) || !txt(a?.grupo))) erros.push('Todo alimento precisa de nome e grupo.');

  if (capacidade === null || Number.isNaN(capacidade) || capacidade < LIMITES.capacidadeMin || capacidade > LIMITES.capacidadeMax) {
    erros.push(`A capacidade do prato vai de ${LIMITES.capacidadeMin} a ${LIMITES.capacidadeMax}.`);
  }
  if (minimoItens === null || Number.isNaN(minimoItens) || minimoItens < 1) {
    erros.push('Informe o mínimo de alimentos para concluir (pelo menos 1).');
  } else {
    if (capacidade !== null && !Number.isNaN(capacidade) && minimoItens > capacidade) erros.push('O mínimo de alimentos não pode passar da capacidade do prato.');
    if (minimoItens > alimentos.length) erros.push('O mínimo de alimentos não pode passar do total na bandeja.');
  }

  const gruposExistentes = new Set(alimentos.map((a) => txt(a?.grupo)).filter(Boolean));
  for (const c of criterios) {
    if (!txt(c?.texto)) erros.push('Todo critério precisa de um texto.');
    const grupos: string[] = Array.isArray(c?.grupos) ? c.grupos : [];
    if (grupos.length === 0) erros.push('Todo critério precisa de pelo menos 1 grupo.');
    else if (grupos.every((g) => !gruposExistentes.has(g))) erros.push('Nenhum dos grupos de um critério existe na bandeja.');
    const min = inteiroOuNulo(c?.minimo);
    const max = inteiroOuNulo(c?.maximo);
    if (Number.isNaN(min) || Number.isNaN(max) || (min !== null && min < 0) || (max !== null && max < 0)) erros.push('Mínimo e máximo do critério devem ser números inteiros (0 ou mais).');
    else if (min === null && max === null) erros.push('Todo critério precisa de um mínimo ou de um máximo.');
    else if (min !== null && max !== null && max < min) erros.push('O máximo de um critério não pode ser menor que o mínimo.');
  }
  return [...new Set(erros)];
}

export type LicaoEmEdicao = {
  tipo: TipoLicaoEdicao;
  titulo: string;
  xp: string | number;
  icone: string;
  texto: string;
  objetivo: string;
  habito: string;
  janelaHoras: string | number;
  passos: PassoEdicao[];
};

/** Todos os problemas da lição (inclui "Passo N: ..."). Lista vazia = pode gravar. */
export function validarLicaoEdicao(l: LicaoEmEdicao): string[] {
  const erros: string[] = [];
  const xp = Number(l.xp);
  if (txt(l.titulo).length < 2) erros.push('Dê um título à lição (mínimo de 2 letras).');
  if (txt(l.titulo).length > LIMITES.titulo) erros.push(`O título passa de ${LIMITES.titulo} letras.`);
  if (!Number.isInteger(xp) || xp < 0 || xp > LIMITES.xpMax) erros.push(`XP deve ser um número inteiro entre 0 e ${LIMITES.xpMax}.`);

  if (l.tipo === 'atividade_rastreavel') {
    if (!(HABITOS as readonly string[]).includes(l.habito)) erros.push('Escolha o hábito que será registrado.');
    if (txt(l.texto).length < 10) erros.push('Escreva o desafio do dia (mínimo de 10 letras).');
    const janela = Number(l.janelaHoras);
    if (!Number.isInteger(janela) || janela < LIMITES.janelaMin || janela > LIMITES.janelaMax) {
      erros.push(`A janela do hábito vai de ${LIMITES.janelaMin} a ${LIMITES.janelaMax} horas.`);
    }
    if (l.passos.length > 0) erros.push('Lição de prática real não tem passos.');
    return erros;
  }

  if (l.passos.length > LIMITES.passosMax) erros.push(`No máximo ${LIMITES.passosMax} passos por lição.`);
  if (l.tipo === 'quiz' && l.passos.length === 0) erros.push('Um quiz precisa de pelo menos 1 passo.');
  if (l.tipo === 'conteudo' && l.passos.length === 0 && txt(l.texto).length < 10) {
    erros.push('Escreva o texto da lição (mínimo de 10 letras) ou adicione passos.');
  }
  l.passos.forEach((p, i) => {
    for (const e of validarPasso(p)) erros.push(`Passo ${i + 1}: ${e}`);
  });
  return erros;
}

// ------------------------------------------------------------------ payload

function listaTexto(v: unknown): string[] {
  return (Array.isArray(v) ? v : []).map(txt);
}

/** dados_extra limpo, no formato que o app do adolescente lê (sem chaves vazias). */
export function dadosExtraLimpo(p: PassoEdicao): Record<string, any> {
  const e = p.dadosExtra ?? {};
  const out: Record<string, any> = {};
  const opcional = (k: string) => {
    const v = txt(e[k]);
    if (v) out[k] = v;
  };
  switch (p.formato) {
    case 'cartao':
      out.texto = txt(e.texto);
      break;
    case 'enquete':
    case 'meta':
      opcional('feedback');
      break;
    case 'memoria':
    case 'associe':
      const idsPares = new Set<string>();
      out.pares = (Array.isArray(e.pares) ? e.pares : []).map((x: any, i: number) => ({
        id: idUnico(x?.id, () => `p${i + 1}`, idsPares),
        esquerda: txt(x?.esquerda),
        direita: txt(x?.direita),
      }));
      opcional(p.formato === 'memoria' ? 'feedback' : 'explicacao');
      break;
    case 'classifique':
      out.categorias = listaTexto(e.categorias);
      opcional('explicacao');
      break;
    case 'prato': {
      const usados = new Set<string>();
      const alimentos = (Array.isArray(e.alimentos) ? e.alimentos : []).map((a: any) => ({
        id: idUnico(a?.id, () => idDoAlimento(txt(a?.nome), new Set()), usados),
        nome: txt(a?.nome),
        emoji: txt(a?.emoji) || '🍽️',
        grupo: txt(a?.grupo),
      }));
      out.alimentos = alimentos;
      const idsCriterios = new Set<string>();
      out.criterios = (Array.isArray(e.criterios) ? e.criterios : []).map((c: any, i: number) => {
        const crit: Record<string, any> = { id: idUnico(c?.id, () => `c${i + 1}`, idsCriterios), texto: txt(c?.texto), grupos: listaTexto(c?.grupos) };
        const min = inteiroOuNulo(c?.minimo);
        const max = inteiroOuNulo(c?.maximo);
        if (min !== null && !Number.isNaN(min)) crit.minimo = min;
        if (max !== null && !Number.isNaN(max)) crit.maximo = max;
        return crit;
      });
      out.capacidade = Number(e.capacidade);
      out.minimoItens = Number(e.minimoItens);
      opcional('feedback');
      break;
    }
    default:
      // multipla_escolha, verdadeiro_falso, completar, ordene
      opcional('explicacao');
  }
  return out;
}

export function paraPayloadPasso(p: PassoEdicao): PassoPayload {
  let opcoes: PassoPayload['opcoes'] = [];
  if (['multipla_escolha', 'verdadeiro_falso', 'completar'].includes(p.formato)) {
    opcoes = p.opcoes.map((o) => ({ texto: txt(o.texto), correta: !!o.correta, categoria: null }));
  } else if (p.formato === 'ordene') {
    opcoes = p.opcoes.map((o) => ({ texto: txt(o.texto), correta: true, categoria: null }));
  } else if (p.formato === 'classifique') {
    opcoes = p.opcoes.map((o) => ({ texto: txt(o.texto), correta: true, categoria: txt(o.categoria) || null }));
  } else if (p.formato === 'enquete' || p.formato === 'meta') {
    opcoes = p.opcoes.map((o) => ({ texto: txt(o.texto), correta: false, categoria: null }));
  }
  return { enunciado: txt(p.enunciado), formato: p.formato, dados_extra: dadosExtraLimpo(p), opcoes };
}

export type LicaoPayload = {
  tipo: TipoLicaoEdicao;
  titulo: string;
  xp: number;
  icone: string | null;
  texto: string;
  objetivo: string;
  habito: string | null;
  janela_horas: number | null;
};

export function paraPayloadLicao(l: LicaoEmEdicao): { licao: LicaoPayload; passos: PassoPayload[] } {
  const habito = l.tipo === 'atividade_rastreavel';
  return {
    licao: {
      tipo: l.tipo,
      titulo: txt(l.titulo),
      xp: Number(l.xp),
      icone: txt(l.icone) || null,
      texto: txt(l.texto),
      objetivo: txt(l.objetivo),
      habito: habito ? l.habito : null,
      janela_horas: habito ? Number(l.janelaHoras) : null,
    },
    passos: habito ? [] : l.passos.map(paraPayloadPasso),
  };
}

/** Texto estável do que será gravado; igual antes e depois = nada mudou (não sobe versão). */
export function assinaturaLicao(l: LicaoEmEdicao): string {
  return JSON.stringify(paraPayloadLicao(l));
}

// ------------------------------------------------------------------ carregar

export type QuestaoCarregada = {
  enunciado: string;
  formato: string;
  dadosExtra: Record<string, any>;
  opcoes: { texto: string; correta: boolean; ordem: number; categoria?: string | null }[];
};

/** Passo vindo do banco -> modelo de edição. */
export function deQuestao(q: QuestaoCarregada): PassoEdicao {
  const formato = (FORMATOS_PASSO as string[]).includes(q.formato) ? (q.formato as FormatoPasso) : 'multipla_escolha';
  const extra = { ...(q.dadosExtra ?? {}) };
  const opcoes = [...(q.opcoes ?? [])]
    .sort((a, b) => a.ordem - b.ordem)
    .map((o) => ({ texto: o.texto, correta: !!o.correta, categoria: o.categoria ?? null }));
  if (formato === 'prato') {
    // o editor trabalha com texto: min/max viram números simples
    extra.alimentos = Array.isArray(extra.alimentos) ? extra.alimentos : [];
    extra.criterios = Array.isArray(extra.criterios) ? extra.criterios : [];
  }
  return { chave: novaChave(), formato, enunciado: q.enunciado, opcoes, dadosExtra: extra };
}

/** Move o item `i` uma posição (dir = -1 sobe, +1 desce). Devolve nova lista. */
export function mover<T>(lista: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}
