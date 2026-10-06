import {
  podeAprovar,
  podeEditarConteudo,
  statusAoCriar,
  statusAposEdicao,
  validarComentarioDevolucao,
  seloDaTrilha,
  resumoTamanho,
} from '../regrasAprovacao';
import { descreverQuestao, problemasDaQuestao } from '../descreverQuestao';

describe('regras de aprovação', () => {
  it('só a nutricionista aprova', () => {
    expect(podeAprovar('NUTRICIONISTA')).toBe(true);
    expect(podeAprovar('ADMINISTRADOR')).toBe(false);
    expect(podeAprovar('ADOLESCENTE')).toBe(false);
    expect(podeAprovar(null)).toBe(false);
  });
  it('nutricionista e admin editam; adolescente não', () => {
    expect(podeEditarConteudo('NUTRICIONISTA')).toBe(true);
    expect(podeEditarConteudo('ADMINISTRADOR')).toBe(true);
    expect(podeEditarConteudo('ADOLESCENTE')).toBe(false);
  });
  it('conteúdo da nutricionista nasce aprovado; do admin, rascunho', () => {
    expect(statusAoCriar('NUTRICIONISTA')).toBe('aprovada');
    expect(statusAoCriar('ADMINISTRADOR')).toBe('rascunho');
  });
  it('admin editando conteúdo aprovado volta pra revisão; nutricionista mantém', () => {
    expect(statusAposEdicao('ADMINISTRADOR', 'aprovada')).toBe('rascunho');
    expect(statusAposEdicao('NUTRICIONISTA', 'aprovada')).toBe('aprovada');
    expect(statusAposEdicao('NUTRICIONISTA', 'rascunho')).toBe('rascunho');
  });
  it('devolução exige comentário', () => {
    expect(validarComentarioDevolucao('   ')).not.toBeNull();
    expect(validarComentarioDevolucao('Corrigir a lição 3')).toBeNull();
    expect(validarComentarioDevolucao('x'.repeat(2001))).not.toBeNull();
  });
  it('selo da lista', () => {
    expect(seloDaTrilha('aprovada', 'DEVOLVIDA').tom).toBe('ok');
    expect(seloDaTrilha('rascunho', 'DEVOLVIDA').tom).toBe('devolvida');
    expect(seloDaTrilha('rascunho', null).tom).toBe('pendente');
  });
  it('resumo no singular e plural', () => {
    expect(resumoTamanho(1, 1)).toBe('1 módulo · 1 lição');
    expect(resumoTamanho(3, 15)).toBe('3 módulos · 15 lições');
  });
});

const opc = (texto: string, correta = false, ordem = 0, categoria: string | null = null) => ({ texto, correta, ordem, categoria });

describe('descreverQuestao / problemasDaQuestao', () => {
  it('múltipla escolha mostra gabarito', () => {
    const q = { enunciado: 'Qual é in natura?', formato: 'multipla_escolha', dadosExtra: {}, opcoes: [opc('Maçã', true, 1), opc('Bolacha', false, 2)] };
    expect(descreverQuestao(q).linhas).toEqual(['✓ Maçã', '○ Bolacha']);
    expect(problemasDaQuestao(q)).toEqual([]);
  });
  it('detecta zero ou várias corretas', () => {
    const base = { enunciado: 'x', formato: 'multipla_escolha', dadosExtra: {} };
    expect(problemasDaQuestao({ ...base, opcoes: [opc('a'), opc('b')] })).toContain('Nenhuma opção marcada como correta.');
    expect(problemasDaQuestao({ ...base, opcoes: [opc('a', true), opc('b', true)] })).toContain('Mais de uma opção correta.');
    expect(problemasDaQuestao({ ...base, opcoes: [opc('a', true)] })).toContain('Menos de 2 opções.');
  });
  it('completar sem {lacuna}', () => {
    const q = { enunciado: 'Frase sem lacuna', formato: 'completar', dadosExtra: {}, opcoes: [opc('a', true), opc('b')] };
    expect(problemasDaQuestao(q)).toContain('Falta o token {lacuna} no enunciado.');
  });
  it('classifique valida categorias', () => {
    const q = { enunciado: 'x', formato: 'classifique', dadosExtra: { categorias: ['A', 'B'] }, opcoes: [opc('i1', false, 1, 'A'), opc('i2', false, 2, 'Z')] };
    expect(problemasDaQuestao(q)).toContain('Há item sem categoria válida.');
    expect(descreverQuestao(q).linhas[0]).toBe('Colunas: A | B');
  });
  it('associe lista pares e cartão mostra texto', () => {
    const a = { enunciado: 'x', formato: 'associe', dadosExtra: { pares: [{ id: '1', esquerda: 'Feijão', direita: 'Leguminosa' }, { id: '2', esquerda: 'Maçã', direita: 'Fruta' }] }, opcoes: [] };
    expect(descreverQuestao(a).linhas).toEqual(['Feijão  ↔  Leguminosa', 'Maçã  ↔  Fruta']);
    const c = { enunciado: 'Título', formato: 'cartao', dadosExtra: { texto: 'Corpo', explicacao: 'Por quê' }, opcoes: [] };
    expect(descreverQuestao(c).linhas).toEqual(['Corpo', 'Explicação: Por quê']);
    expect(problemasDaQuestao({ ...c, dadosExtra: {} })).toContain('Cartão sem texto.');
  });
});
