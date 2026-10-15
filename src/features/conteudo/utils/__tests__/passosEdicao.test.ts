import * as fs from 'fs';
import * as path from 'path';
import {
  assinaturaLicao,
  deQuestao,
  FORMATOS_PASSO,
  idDoAlimento,
  mover,
  paraPayloadLicao,
  paraPayloadPasso,
  passoVazio,
  validarLicaoEdicao,
  validarPasso,
  type FormatoPasso,
  type LicaoEmEdicao,
  type PassoEdicao,
} from '../passosEdicao';

const passo = (formato: FormatoPasso, patch: Partial<PassoEdicao>): PassoEdicao => ({ ...passoVazio(formato), ...patch });

const licaoBase = (patch: Partial<LicaoEmEdicao> = {}): LicaoEmEdicao => ({
  tipo: 'quiz',
  titulo: 'Treino',
  xp: '20',
  icone: '',
  texto: '',
  objetivo: '',
  habito: 'agua',
  janelaHoras: '24',
  passos: [passo('multipla_escolha', { enunciado: 'Qual é in natura?', opcoes: [{ texto: 'Laranja', correta: true }, { texto: 'Refri', correta: false }] })],
  ...patch,
});

describe('passoVazio / validarPasso', () => {
  it('todo formato nasce inválido (nada de lição vazia gravada por engano)', () => {
    for (const f of FORMATOS_PASSO) expect(validarPasso(passoVazio(f)).length).toBeGreaterThan(0);
  });
  it('múltipla escolha exige exatamente uma correta', () => {
    const base = { enunciado: 'P?', opcoes: [{ texto: 'a', correta: false }, { texto: 'b', correta: false }] };
    expect(validarPasso(passo('multipla_escolha', base))).toContain('Marque a alternativa correta.');
    const duas = { ...base, opcoes: [{ texto: 'a', correta: true }, { texto: 'b', correta: true }] };
    expect(validarPasso(passo('multipla_escolha', duas))).toContain('Só uma alternativa pode ser a correta.');
    const ok = { ...base, opcoes: [{ texto: 'a', correta: true }, { texto: 'b', correta: false }] };
    expect(validarPasso(passo('multipla_escolha', ok))).toEqual([]);
  });
  it('completar exige o token {lacuna} uma vez', () => {
    const ops = [{ texto: 'x', correta: true }, { texto: 'y', correta: false }];
    expect(validarPasso(passo('completar', { enunciado: 'sem lacuna', opcoes: ops }))).toContain('Use {lacuna} exatamente uma vez no enunciado.');
    expect(validarPasso(passo('completar', { enunciado: '{lacuna} e {lacuna}', opcoes: ops }))).toContain('Use {lacuna} exatamente uma vez no enunciado.');
    expect(validarPasso(passo('completar', { enunciado: 'A base é {lacuna}.', opcoes: ops }))).toEqual([]);
  });
  it('classifique exige colunas distintas e item com coluna válida', () => {
    const p = passo('classifique', {
      enunciado: 'Classifique',
      dadosExtra: { categorias: ['A', 'B'] },
      opcoes: [{ texto: 'i1', correta: true, categoria: 'A' }, { texto: 'i2', correta: true, categoria: 'C' }],
    });
    expect(validarPasso(p)).toContain('Escolha a coluna certa de cada item.');
    const igual = passo('classifique', { enunciado: 'x', dadosExtra: { categorias: ['A', 'a'] }, opcoes: p.opcoes });
    expect(validarPasso(igual)).toContain('Há colunas com o mesmo nome.');
  });
  it('associe/memória exigem 2 pares completos', () => {
    const p = passo('associe', { enunciado: 'Ligue', dadosExtra: { pares: [{ id: 'p1', esquerda: 'a', direita: '' }] } });
    expect(validarPasso(p)).toEqual(expect.arrayContaining(['Coloque pelo menos 2 pares.', 'Há par com um lado em branco.']));
  });
  it('prato valida bandeja, capacidade e critérios', () => {
    const alimentos = [
      { nome: 'Arroz', emoji: '🍚', grupo: 'cereal' },
      { nome: 'Feijão', emoji: '🍲', grupo: 'leguminosa' },
      { nome: 'Alface', emoji: '🥬', grupo: 'vegetal' },
    ];
    const ok = passo('prato', {
      enunciado: 'Monte',
      dadosExtra: { alimentos, criterios: [{ texto: 'Energia', grupos: ['cereal'], minimo: '1', maximo: '' }], capacidade: '6', minimoItens: '3' },
    });
    expect(validarPasso(ok)).toEqual([]);
    const ruim = passo('prato', { enunciado: 'Monte', dadosExtra: { alimentos, criterios: [{ texto: 'X', grupos: ['fruta'], minimo: '2', maximo: '1' }], capacidade: '9', minimoItens: '3' } });
    const erros = validarPasso(ruim);
    expect(erros).toContain('Nenhum dos grupos de um critério existe na bandeja.');
    expect(erros).toContain('O máximo de um critério não pode ser menor que o mínimo.');
    expect(erros.join(' ')).toMatch(/capacidade do prato vai de 3 a 7/);
  });
});

describe('validarLicaoEdicao', () => {
  it('lição válida não tem problemas', () => {
    expect(validarLicaoEdicao(licaoBase())).toEqual([]);
  });
  it('título, XP e quiz sem passos', () => {
    const erros = validarLicaoEdicao(licaoBase({ titulo: ' ', xp: '900', passos: [] }));
    expect(erros).toEqual(expect.arrayContaining([
      'Dê um título à lição (mínimo de 2 letras).',
      'XP deve ser um número inteiro entre 0 e 500.',
      'Um quiz precisa de pelo menos 1 passo.',
    ]));
  });
  it('leitura: texto OU passos', () => {
    expect(validarLicaoEdicao(licaoBase({ tipo: 'conteudo', passos: [], texto: 'curto' }))).toContain('Escreva o texto da lição (mínimo de 10 letras) ou adicione passos.');
    expect(validarLicaoEdicao(licaoBase({ tipo: 'conteudo', passos: [], texto: 'Um texto de leitura bem longo.' }))).toEqual([]);
  });
  it('erros de passo vêm com o número do passo', () => {
    const l = licaoBase({ passos: [licaoBase().passos[0], passo('cartao', {})] });
    const erros = validarLicaoEdicao(l);
    expect(erros).toContain('Passo 2: O cartão precisa de um título.');
    expect(erros).toContain('Passo 2: O cartão precisa de texto.');
  });
  it('prática real: hábito válido, desafio, janela e sem passos', () => {
    const l = licaoBase({ tipo: 'atividade_rastreavel', habito: 'bicicleta', texto: 'curto', janelaHoras: '500' });
    expect(validarLicaoEdicao(l)).toEqual(expect.arrayContaining([
      'Escolha o hábito que será registrado.',
      'Escreva o desafio do dia (mínimo de 10 letras).',
      'A janela do hábito vai de 1 a 168 horas.',
      'Lição de prática real não tem passos.',
    ]));
    const ok = licaoBase({ tipo: 'atividade_rastreavel', habito: 'agua', texto: 'Registre a água que beber hoje.', passos: [] });
    expect(validarLicaoEdicao(ok)).toEqual([]);
  });
});

describe('payload (o que vai para o banco)', () => {
  it('ordene: todas correta=true, na ordem; classifique: categoria; enquete: correta=false', () => {
    const ord = paraPayloadPasso(passo('ordene', { enunciado: 'Ordene', opcoes: [{ texto: ' a ', correta: false }, { texto: 'b', correta: false }] }));
    expect(ord.opcoes).toEqual([{ texto: 'a', correta: true, categoria: null }, { texto: 'b', correta: true, categoria: null }]);
    const enq = paraPayloadPasso(passo('enquete', { enunciado: 'E?', opcoes: [{ texto: 'x', correta: true }] }));
    expect(enq.opcoes[0].correta).toBe(false);
    const cla = paraPayloadPasso(passo('classifique', { enunciado: 'C', dadosExtra: { categorias: [' A ', 'B'] }, opcoes: [{ texto: 'i', correta: false, categoria: 'A' }] }));
    expect(cla.dados_extra.categorias).toEqual(['A', 'B']);
  });
  it('formatos sem opções não mandam opções; chaves vazias somem do dados_extra', () => {
    const car = paraPayloadPasso(passo('cartao', { enunciado: 'T', dadosExtra: { texto: ' corpo ', explicacao: '' } }));
    expect(car).toEqual({ enunciado: 'T', formato: 'cartao', dados_extra: { texto: 'corpo' }, opcoes: [] });
    const mc = paraPayloadPasso(passo('multipla_escolha', { enunciado: 'P', opcoes: [{ texto: 'a', correta: true }], dadosExtra: { explicacao: '   ' } }));
    expect(mc.dados_extra).toEqual({});
  });
  it('ids existentes são mantidos; só faltantes ou repetidos ganham id novo', () => {
    const par = paraPayloadPasso(passo('associe', { enunciado: 'L', dadosExtra: { pares: [{ id: 'x', esquerda: 'a', direita: 'b' }, { id: 'x', esquerda: 'c', direita: 'd' }, { esquerda: 'e', direita: 'f' }] } }));
    expect(par.dados_extra.pares.map((x: any) => x.id)).toEqual(['x', 'p2', 'p3']);
    const prato = paraPayloadPasso(passo('prato', { enunciado: 'M', dadosExtra: { alimentos: [{ id: 'refri', nome: 'Refrigerante', grupo: 'g' }, { nome: 'Feijão', grupo: 'g' }], criterios: [], capacidade: 6, minimoItens: 3 } }));
    expect(prato.dados_extra.alimentos.map((a: any) => a.id)).toEqual(['refri', 'feijao']);
    expect(idDoAlimento('Feijão', new Set())).toBe('feijao');
    const usados = new Set<string>();
    expect(idDoAlimento('Ovo', usados)).toBe('ovo');
    expect(idDoAlimento('Ovo', usados)).toBe('ovo_2');
  });
  it('lição de hábito não manda passos; leitura/quiz mandam janela nula', () => {
    const h = paraPayloadLicao(licaoBase({ tipo: 'atividade_rastreavel', habito: 'agua', texto: 'Registre a água hoje.', passos: [] }));
    expect(h.passos).toEqual([]);
    expect(h.licao).toMatchObject({ tipo: 'atividade_rastreavel', habito: 'agua', janela_horas: 24 });
    expect(paraPayloadLicao(licaoBase()).licao).toMatchObject({ habito: null, janela_horas: null });
  });
  it('assinatura muda só quando o conteúdo muda', () => {
    const a = licaoBase();
    expect(assinaturaLicao(a)).toBe(assinaturaLicao({ ...a, titulo: '  Treino ' }));
    expect(assinaturaLicao(a)).not.toBe(assinaturaLicao({ ...a, titulo: 'Outro' }));
  });
  it('mover troca posições e respeita as bordas', () => {
    expect(mover([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(mover([1, 2, 3], 0, -1)).toEqual([1, 2, 3]);
    expect(mover([1, 2, 3], 2, 1)).toEqual([1, 2, 3]);
  });
});

// Regressão contra a trilha de demonstração: o que o editor gera tem de ser igual ao que o seed
// grava e o app do adolescente lê, para os 11 formatos.
describe('estrutura do editor == estrutura do seed', () => {
  const sql = fs.readFileSync(path.resolve(__dirname, '../../../adolescente/trilha/data/seed_trilha_completa.sql'), 'utf8');
  const ini = sql.indexOf('$seed$') + '$seed$'.length;
  const fim = sql.indexOf('}$seed$', ini);
  const seed = JSON.parse(sql.slice(ini, fim + 1));
  const passosSeed: any[] = seed.modulos.flatMap((m: any) => m.licoes.flatMap((l: any) => l.passos ?? []));

  it('o seed usa os 11 formatos', () => {
    expect(new Set(passosSeed.map((p) => p.formato))).toEqual(new Set(FORMATOS_PASSO));
  });
  it('todo passo do seed é válido no editor e volta idêntico ao gravar', () => {
    for (const s of passosSeed) {
      const carregado = deQuestao({
        enunciado: s.enunciado,
        formato: s.formato,
        dadosExtra: s.dados_extra ?? {},
        opcoes: (s.opcoes ?? []).map((o: any, i: number) => ({ texto: o.texto, correta: !!o.correta, ordem: i + 1, categoria: o.categoria ?? null })),
      });
      expect({ formato: s.formato, enunciado: s.enunciado, erros: validarPasso(carregado) }).toEqual({ formato: s.formato, enunciado: s.enunciado, erros: [] });
      const volta = paraPayloadPasso(carregado);
      expect(volta.dados_extra).toEqual(s.dados_extra ?? {});
      expect(volta.opcoes.map((o) => ({ texto: o.texto, correta: o.correta, categoria: o.categoria }))).toEqual(
        (s.opcoes ?? []).map((o: any) => ({ texto: o.texto, correta: !!o.correta, categoria: o.categoria ?? null }))
      );
    }
  });
});
