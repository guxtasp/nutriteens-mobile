import { categoriaDoAlimento, ordenarTrocas, escolherTrocasRefeicao, Troca } from '../trocas';

const t = (o: Partial<Troca> & { id: string }): Troca => ({
  categoria: 'DOCE', origemId: null, origemNome: null, destinoId: `d-${o.id}`, destinoNome: o.id,
  tiposRefeicao: [], frase: 'f', rapida: false, ordem: 0,
  destinoAcessivel: true, destinoRecente: false, respondidaRecente: false, ...o,
});
const ids = (l: Troca[]) => l.map((x) => x.id);

describe('categoriaDoAlimento', () => {
  it('valor do catálogo vence o fallback', () => {
    expect(categoriaDoAlimento({ categoriaTroca: 'SALGADINHO', classificacaoNova: 'PROCESSADO', grupos: [] })).toBe('SALGADINHO');
  });
  it('fallback por grupo só para ultraprocessados', () => {
    expect(categoriaDoAlimento({ classificacaoNova: 'ULTRAPROCESSADO', grupos: ['BEBIDAS'] })).toBe('REFRIGERANTE_BEBIDA');
    expect(categoriaDoAlimento({ classificacaoNova: 'ULTRAPROCESSADO', grupos: ['ACUCARES_E_DOCES'] })).toBe('DOCE');
    expect(categoriaDoAlimento({ classificacaoNova: 'ULTRAPROCESSADO', grupos: ['CARNES_E_OVOS'] })).toBe('EMBUTIDO');
    expect(categoriaDoAlimento({ classificacaoNova: 'IN_NATURA', grupos: ['BEBIDAS'] })).toBeNull();
    expect(categoriaDoAlimento({ classificacaoNova: 'ULTRAPROCESSADO', grupos: ['CEREAIS_E_TUBERCULOS'] })).toBeNull();
  });
});

describe('ordenarTrocas', () => {
  it('acessíveis primeiro, sem remover as demais', () => {
    const r = ordenarTrocas([t({ id: 'a', destinoAcessivel: false }), t({ id: 'b' })]);
    expect(ids(r)).toEqual(['b', 'a']);
  });
  it('específica vence genérica', () => {
    const r = ordenarTrocas([t({ id: 'a' }), t({ id: 'z', origemId: 'x' })], { origemIds: ['x'] });
    expect(ids(r)).toEqual(['z', 'a']);
  });
  it('acessibilidade pesa mais que especificidade', () => {
    const r = ordenarTrocas([t({ id: 'z', origemId: 'x', destinoAcessivel: false }), t({ id: 'a' })], { origemIds: ['x'] });
    expect(ids(r)).toEqual(['a', 'z']);
  });
  it('tipo de refeição: lista vazia vale para qualquer uma', () => {
    const r = ordenarTrocas([t({ id: 'a', tiposRefeicao: ['JANTAR'] }), t({ id: 'b', tiposRefeicao: ['ALMOCO'] }), t({ id: 'c' })], { tipoRefeicao: 'ALMOCO' });
    expect(ids(r).slice(0, 2).sort()).toEqual(['b', 'c']);
    expect(ids(r)[2]).toBe('a');
  });
  it('destino recente desempata antes de "rápido"', () => {
    const r = ordenarTrocas([t({ id: 'a', rapida: true }), t({ id: 'b', destinoRecente: true })], { tipoRefeicao: 'LANCHE_TARDE' });
    expect(ids(r)).toEqual(['b', 'a']);
  });
  it('"rápido" só conta em lanches', () => {
    const l = [t({ id: 'b' }), t({ id: 'a', rapida: false }), t({ id: 'c', rapida: true })];
    expect(ids(ordenarTrocas(l, { tipoRefeicao: 'LANCHE_MANHA' }))[0]).toBe('c');
    expect(ids(ordenarTrocas(l, { tipoRefeicao: 'ALMOCO' }))).toEqual(['a', 'b', 'c']);
  });
  it('ordem estável: nome A–Z e depois id; não altera a entrada', () => {
    const entrada = [t({ id: '2', destinoNome: 'Maçã' }), t({ id: '1', destinoNome: 'Maçã' }), t({ id: '3', destinoNome: 'Água' })];
    const copia = [...entrada];
    expect(ids(ordenarTrocas(entrada))).toEqual(['3', '1', '2']);
    expect(entrada).toEqual(copia);
  });
});

describe('escolherTrocasRefeicao', () => {
  const refri = { id: 'r1', nome: 'Refrigerante', categoria: 'REFRIGERANTE_BEBIDA' as const };
  const R = (o: Partial<Troca> & { id: string }) => t({ categoria: 'REFRIGERANTE_BEBIDA', ...o });
  it('sem item das categorias, não há troca', () => {
    expect(escolherTrocasRefeicao([t({ id: 'a' })], [{ id: 'x', nome: 'Arroz', categoria: null }], 'ALMOCO')).toBeNull();
  });
  it('devolve várias opções da categoria, usando o nome do item', () => {
    const r = escolherTrocasRefeicao([R({ id: 'a' }), R({ id: 'b' }), R({ id: 'c' })], [refri], 'ALMOCO');
    expect(r?.origemNome).toBe('Refrigerante');
    expect(r?.opcoes.length).toBe(3);
  });
  it('limita a quantidade e não repete destino', () => {
    const l = [1, 2, 3, 4, 5, 6].map((n) => R({ id: String(n) }));
    expect(escolherTrocasRefeicao(l, [refri], 'ALMOCO')?.opcoes.length).toBe(4);
    const rep = [R({ id: 'a', destinoId: 'x' }), R({ id: 'b', destinoId: 'x' })];
    expect(escolherTrocasRefeicao(rep, [refri], 'ALMOCO')?.opcoes.length).toBe(1);
  });
  it('específica do item vem primeiro', () => {
    const r = escolherTrocasRefeicao([R({ id: 'a' }), R({ id: 'z', origemId: 'r1', origemNome: 'Refrigerante' })], [refri], 'ALMOCO');
    expect(r?.opcoes[0].id).toBe('z');
  });
  it('pula as respondidas; se nada sobrar, não mostra', () => {
    const a = R({ id: 'a', respondidaRecente: true });
    expect(escolherTrocasRefeicao([a, R({ id: 'b' })], [refri], 'ALMOCO')?.opcoes.map((o) => o.id)).toEqual(['b']);
    expect(escolherTrocasRefeicao([a], [refri], 'ALMOCO')).toBeNull();
  });
  it('categorias de ideia (lanche/refeição) nunca aparecem no retorno da refeição', () => {
    expect(escolherTrocasRefeicao([t({ id: 'a', categoria: 'LANCHE' }), t({ id: 'b', categoria: 'REFEICAO' })], [refri], 'ALMOCO')).toBeNull();
  });
  it('troca específica de outro alimento não vale', () => {
    expect(escolherTrocasRefeicao([R({ id: 'a', origemId: 'outro' })], [refri], 'ALMOCO')).toBeNull();
  });
});
