import { assinaturaReceita, moverPasso, ordenarIngredientes, paraPayloadReceita, urlValida, validarReceita, type ReceitaEmEdicao } from '../receitaEdicao';

const base = (patch: Partial<ReceitaEmEdicao> = {}): ReceitaEmEdicao => ({
  titulo: 'Arroz com feijão',
  modo: 'Cozinhe o arroz e o feijão separados.',
  tempo: '40',
  porcoes: '4',
  dificuldade: 'FACIL',
  fotoUrl: '',
  ingredientes: [{ alimentoId: 'a1', nome: 'Arroz', quantidade: '2 xícaras' }],
  passos: [{ titulo: 'Lave o arroz', descricao: 'Em água corrente.', fotoUrl: '' }],
  ...patch,
});

describe('validarReceita', () => {
  it('receita válida', () => expect(validarReceita(base(), { criando: false })).toEqual([]));
  it('criar exige o prato', () => {
    expect(validarReceita(base(), { criando: true })).toContain('Escolha o prato que esta receita produz.');
    expect(validarReceita(base(), { criando: true, pratoId: 'p1' })).toEqual([]);
  });
  it('campos numéricos e dificuldade', () => {
    const erros = validarReceita(base({ titulo: 'ab', modo: 'curto', tempo: '0', porcoes: '100', dificuldade: 'X' }), { criando: false });
    expect(erros).toEqual(expect.arrayContaining([
      'Dê um título com pelo menos 3 letras.',
      'Escreva o modo de preparo (resumo, mínimo de 10 letras).',
      'O tempo vai de 1 a 1440 minutos.',
      'As porções vão de 1 a 99.',
      'Escolha a dificuldade.',
    ]));
  });
  it('tempo e porções podem ficar em branco', () => {
    expect(validarReceita(base({ tempo: '', porcoes: '' }), { criando: false })).toEqual([]);
  });
  it('ingredientes: quantidade, alimento e repetição', () => {
    const erros = validarReceita(base({ ingredientes: [
      { alimentoId: 'a1', nome: 'Arroz', quantidade: ' ' },
      { alimentoId: '', nome: '', quantidade: '1' },
      { alimentoId: 'a1', nome: 'Arroz', quantidade: '3' },
    ] }), { criando: false });
    expect(erros).toEqual(expect.arrayContaining([
      'Ingrediente 1 (Arroz): informe a quantidade.',
      'Ingrediente 2: escolha o alimento.',
      'Ingrediente 3 (Arroz): já está na lista.',
    ]));
  });
  it('passos e links de foto', () => {
    const erros = validarReceita(base({ fotoUrl: 'foto.jpg', passos: [{ titulo: '', descricao: 'x', fotoUrl: 'ftp://x' }] }), { criando: false });
    expect(erros).toEqual(expect.arrayContaining([
      'O link da foto deve começar com http:// ou https://.',
      'Passo 1: precisa de título e descrição (ou remova o passo).',
      'Passo 1: o link da foto deve começar com http:// ou https://.',
    ]));
    expect(urlValida('https://x.com/a.jpg')).toBe(true);
    expect(urlValida('http://x')).toBe(true);
    expect(urlValida('x.com/a.jpg')).toBe(false);
  });
});

describe('payload e assinatura', () => {
  it('payload limpo: nulos para vazios, números convertidos', () => {
    const p = paraPayloadReceita(base({ tempo: '', fotoUrl: '  https://x.com/a.jpg ' }));
    expect(p.receita).toEqual({ titulo: 'Arroz com feijão', modo_preparo: 'Cozinhe o arroz e o feijão separados.', tempo_preparo_min: null, porcoes: 4, dificuldade: 'FACIL', foto_url: 'https://x.com/a.jpg' });
    expect(p.ingredientes).toEqual([{ alimento_id: 'a1', quantidade_texto: '2 xícaras' }]);
    expect(p.passos[0].foto_url).toBeNull();
  });
  it('assinatura ignora espaços e a ordem dos ingredientes, mas pega mudanças reais', () => {
    const a = base({ ingredientes: [{ alimentoId: 'a1', nome: 'Arroz', quantidade: '2' }, { alimentoId: 'b2', nome: 'Feijão', quantidade: '1' }] });
    const b = base({ titulo: ' Arroz com feijão ', ingredientes: [{ alimentoId: 'b2', nome: 'Feijão', quantidade: '1' }, { alimentoId: 'a1', nome: 'Arroz', quantidade: '2' }] });
    expect(assinaturaReceita(a)).toBe(assinaturaReceita(b));
    expect(assinaturaReceita(a)).not.toBe(assinaturaReceita({ ...a, passos: [] }));
  });
  it('ordem alfabética (pt-BR) e mover passo', () => {
    expect(ordenarIngredientes([{ nome: 'Óleo' }, { nome: 'Arroz' }, { nome: 'Feijão' }]).map((x) => x.nome)).toEqual(['Arroz', 'Feijão', 'Óleo']);
    expect(moverPasso([1, 2, 3], 2, -1)).toEqual([1, 3, 2]);
    expect(moverPasso([1, 2], 0, -1)).toEqual([1, 2]);
  });
});
