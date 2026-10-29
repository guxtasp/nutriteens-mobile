import { passoVazio, type LicaoEmEdicao, type PassoEdicao } from '../passosEdicao';
import {
  CATEGORIA_DO_FORMATO,
  assinaturaAoVivo,
  formatosDaCategoria,
  paraPreviaAoVivo,
  posicaoDeInsercao,
  recortarDesde,
  resumoDoBloco,
  selecaoAposMover,
  selecaoAposRemover,
} from '../blocos';

const cartaoPronto = (titulo: string, texto: string): PassoEdicao => ({
  ...passoVazio('cartao'),
  enunciado: titulo,
  dadosExtra: { texto },
});

const multiplaPronta = (): PassoEdicao => ({
  ...passoVazio('multipla_escolha'),
  enunciado: 'Qual é a melhor bebida?',
  opcoes: [
    { texto: 'Água', correta: true },
    { texto: 'Refrigerante', correta: false },
  ],
});

const base = (passos: PassoEdicao[], extra: Partial<LicaoEmEdicao> = {}): LicaoEmEdicao => ({
  tipo: 'quiz',
  titulo: 'Lição',
  xp: '20',
  icone: '',
  texto: '',
  objetivo: '',
  habito: 'agua',
  janelaHoras: '24',
  passos,
  ...extra,
});

describe('blocos: categorias', () => {
  it('todo formato tem categoria e cada categoria lista seus formatos', () => {
    expect(formatosDaCategoria('conteudo')).toEqual(['cartao']);
    expect(formatosDaCategoria('semNota')).toEqual(expect.arrayContaining(['enquete', 'meta']));
    expect(CATEGORIA_DO_FORMATO.prato).toBe('jogo');
    expect(CATEGORIA_DO_FORMATO.ordene).toBe('pergunta');
  });
});

describe('blocos: resumo e seleção', () => {
  it('resumo troca {lacuna}, corta texto longo e avisa vazio', () => {
    expect(resumoDoBloco({ ...passoVazio('completar'), enunciado: 'Beba {lacuna} todo dia' })).toBe('Beba ____ todo dia');
    expect(resumoDoBloco({ ...passoVazio('cartao'), enunciado: '' })).toBe('(vazio)');
    const longo = resumoDoBloco({ ...passoVazio('cartao'), enunciado: 'a'.repeat(200) });
    expect(longo.length).toBe(80);
    expect(longo.endsWith('…')).toBe(true);
  });

  it('insere depois do selecionado, ou no fim', () => {
    expect(posicaoDeInsercao(3, null)).toBe(3);
    expect(posicaoDeInsercao(3, 0)).toBe(1);
    expect(posicaoDeInsercao(3, 2)).toBe(3);
    expect(posicaoDeInsercao(0, null)).toBe(0);
  });

  it('seleção depois de remover', () => {
    expect(selecaoAposRemover(null, 1, 2)).toBeNull();
    expect(selecaoAposRemover(1, 1, 2)).toBe(1); // o seguinte ocupa o lugar
    expect(selecaoAposRemover(1, 1, 1)).toBe(0); // era o último
    expect(selecaoAposRemover(2, 0, 2)).toBe(1); // removeu antes: desloca
    expect(selecaoAposRemover(0, 2, 2)).toBe(0);
    expect(selecaoAposRemover(0, 0, 0)).toBeNull();
  });
});

describe('blocos: mover', () => {
  it('a seleção acompanha o bloco movido e o vizinho trocado', () => {
    expect(selecaoAposMover(null, 1, 1)).toBeNull();
    expect(selecaoAposMover(1, 1, 1)).toBe(2); // o selecionado desceu
    expect(selecaoAposMover(2, 1, 1)).toBe(1); // o vizinho que estava embaixo subiu
    expect(selecaoAposMover(0, 1, 1)).toBe(0); // não mexeu
    expect(selecaoAposMover(1, 1, -1)).toBe(0);
  });
});

describe('blocos: prévia ao vivo', () => {
  it('bloco completo vira questão com ids estáveis e opções numeradas', () => {
    const { licao, incompletos } = paraPreviaAoVivo(base([multiplaPronta()]));
    expect(incompletos).toEqual([false]);
    const q = licao.questoes[0];
    expect(q.formato).toBe('multipla_escolha');
    expect(q.opcoes.map((o) => o.ordem)).toEqual([1, 2]);
    expect(q.opcoes[0]).toMatchObject({ texto: 'Água', correta: true });
    expect(q.id.startsWith('rascunho:')).toBe(true);
  });

  it('bloco incompleto vira cartão de aviso (a prévia não quebra)', () => {
    const { licao, incompletos } = paraPreviaAoVivo(base([passoVazio('multipla_escolha')]));
    expect(incompletos).toEqual([true]);
    expect(licao.questoes[0]).toMatchObject({ formato: 'cartao', enunciado: 'Bloco 1 incompleto' });
    expect(String(licao.questoes[0].dadosExtra.texto).length).toBeGreaterThan(0);
  });

  it('prática real não leva passos e usa o hábito e a janela', () => {
    const { licao } = paraPreviaAoVivo(base([cartaoPronto('a', 'b')], { tipo: 'atividade_rastreavel', habito: 'agua', janelaHoras: '12', texto: ' Beba ' }));
    expect(licao.questoes).toEqual([]);
    expect(licao.tipoHabito).toBe('agua');
    expect(licao.janelaHoras).toBe(12);
    expect(licao.conteudo?.texto).toBe('Beba');
  });

  it('título vazio e XP inválido não quebram', () => {
    const { licao } = paraPreviaAoVivo(base([], { titulo: '  ', xp: '' }));
    expect(licao.titulo).toBe('Sem título');
    expect(licao.xp).toBe(0);
  });

  it('recorta a partir do bloco selecionado', () => {
    const { licao } = paraPreviaAoVivo(base([cartaoPronto('1', 'a'), cartaoPronto('2', 'b'), cartaoPronto('3', 'c')]));
    expect(recortarDesde(licao, null).questoes).toHaveLength(3);
    expect(recortarDesde(licao, 1).questoes.map((q) => q.enunciado)).toEqual(['2', '3']);
    expect(recortarDesde(licao, 99).questoes.map((q) => q.enunciado)).toEqual(['3']);
    expect(recortarDesde(licao, 0)).toBe(licao);
  });

  it('assinatura muda quando o conteúdo muda e é igual quando não muda', () => {
    const a = paraPreviaAoVivo(base([cartaoPronto('1', 'a')])).licao;
    const b = paraPreviaAoVivo(base([{ ...cartaoPronto('1', 'a'), chave: a.questoes[0].id.replace('rascunho:', '') }])).licao;
    const c = paraPreviaAoVivo(base([{ ...cartaoPronto('1', 'a!'), chave: a.questoes[0].id.replace('rascunho:', '') }])).licao;
    expect(assinaturaAoVivo(a)).toBe(assinaturaAoVivo(b));
    expect(assinaturaAoVivo(a)).not.toBe(assinaturaAoVivo(c));
  });
});
