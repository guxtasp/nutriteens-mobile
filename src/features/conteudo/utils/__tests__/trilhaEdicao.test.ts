import {
  avisoOrdemTrilha,
  idsAposMover,
  lerXpBonus,
  proximaOrdemTrilha,
  textoConfirmaExclusao,
  trilhaVisivelAoAdolescente,
  validarModulo,
  validarTrilha,
} from '../trilhaEdicao';

const ok = { titulo: 'Alimentação', descricao: '', tema: 'ALIMENTACAO', ordem: '2', xpBonus: '' };

describe('lerXpBonus', () => {
  it('vazio = padrão (null); número inteiro; resto inválido', () => {
    expect(lerXpBonus('')).toBeNull();
    expect(lerXpBonus('  ')).toBeNull();
    expect(lerXpBonus(undefined)).toBeNull();
    expect(lerXpBonus('150')).toBe(150);
    expect(lerXpBonus('0')).toBe(0);
    expect(lerXpBonus('-5')).toBeNaN();
    expect(lerXpBonus('1,5')).toBeNaN();
  });
});

describe('validarTrilha / validarModulo', () => {
  it('trilha válida', () => expect(validarTrilha(ok)).toEqual([]));
  it('título, tema, ordem e XP', () => {
    const erros = validarTrilha({ titulo: 'ab', descricao: 'x'.repeat(501), tema: '', ordem: '0', xpBonus: '5000' });
    expect(erros).toEqual(expect.arrayContaining([
      'Dê um título com pelo menos 3 letras.',
      'A descrição passa de 500 letras.',
      'Escolha o tema da trilha.',
      'A ordem da trilha deve ser um número inteiro entre 1 e 999.',
    ]));
    expect(erros.join(' ')).toMatch(/XP bônus da trilha/);
  });
  it('ordem em branco é inválida', () => {
    expect(validarTrilha({ ...ok, ordem: '' })).toContain('A ordem da trilha deve ser um número inteiro entre 1 e 999.');
  });
  it('módulo', () => {
    expect(validarModulo({ titulo: 'Base', xpBonus: '' })).toEqual([]);
    expect(validarModulo({ titulo: ' ', xpBonus: 'abc' })).toHaveLength(2);
  });
});

describe('ordem da trilha e visibilidade', () => {
  const t = (id: string, ordem: number, status: string, criadoEm = '2026-01-01') => ({ id, titulo: id, ordem, status, criadoEm });

  it('proximaOrdemTrilha vai para o fim', () => {
    expect(proximaOrdemTrilha([])).toBe(1);
    expect(proximaOrdemTrilha([1, 3, 2])).toBe(4);
  });
  it('o adolescente vê a publicada de menor ordem; empate = mais antiga; rascunho nunca', () => {
    const lista = [t('rasc', 0, 'rascunho'), t('b', 2, 'aprovada'), t('a', 2, 'aprovada', '2025-01-01'), t('c', 5, 'aprovada')];
    expect(trilhaVisivelAoAdolescente(lista)?.id).toBe('a');
    expect(trilhaVisivelAoAdolescente([t('x', 1, 'rascunho')])).toBeNull();
  });
  it('avisa quando a ordem escolhida passa na frente da trilha publicada', () => {
    const lista = [t('seed', 1, 'aprovada')];
    expect(avisoOrdemTrilha(lista, { ordem: 1 })).toBeNull();
    expect(avisoOrdemTrilha(lista, { ordem: 2 })).toBeNull();
    expect(avisoOrdemTrilha(lista, { ordem: 0 })).toMatch(/passa na frente de "seed"/);
    expect(avisoOrdemTrilha([t('seed', 1, 'aprovada')], { id: 'seed', ordem: 0 })).toBeNull();
  });
});

describe('idsAposMover / textoConfirmaExclusao', () => {
  it('troca vizinhos e respeita as bordas', () => {
    expect(idsAposMover(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(idsAposMover(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(idsAposMover(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(idsAposMover(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
  it('mensagens de exclusão', () => {
    expect(textoConfirmaExclusao('LICAO', 'Treino')).toMatch(/lição "Treino"/);
    expect(textoConfirmaExclusao('MODULO', 'Base', 3)).toMatch(/3 lição/);
    expect(textoConfirmaExclusao('MODULO', 'Vazio')).not.toMatch(/lição\(ões\)/);
  });
});
