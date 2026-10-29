import { celulaCsv, montarCsv } from '../utils/csv';
import { CONJUNTOS, csvDicionario, nomeArquivo } from '../services/exportacaoService';

jest.mock('../../../lib/supabase', () => ({ supabase: {} }));

describe('celulaCsv', () => {
  it('escapa separador, aspas e quebra de linha', () => {
    expect(celulaCsv('a;b', ';')).toBe('"a;b"');
    expect(celulaCsv('diz "oi"', ';')).toBe('"diz ""oi"""');
    expect(celulaCsv('l1\nl2', ';')).toBe('"l1\nl2"');
    expect(celulaCsv('a,b', ';')).toBe('a,b');
    expect(celulaCsv('a,b', ',')).toBe('"a,b"');
  });
  it('trata vazio e números', () => {
    expect(celulaCsv(null, ';')).toBe('');
    expect(celulaCsv(undefined, ';')).toBe('');
    expect(celulaCsv(0, ';')).toBe('0');
    expect(celulaCsv(-3, ';')).toBe('-3'); // número negativo não é fórmula
    expect(celulaCsv(false, ';')).toBe('false');
  });
  it('neutraliza texto que viraria fórmula', () => {
    expect(celulaCsv('=SOMA(A1)', ';')).toBe("'=SOMA(A1)");
    expect(celulaCsv('+55 31', ';')).toBe("'+55 31");
    expect(celulaCsv('-x', ';')).toBe("'-x");
    expect(celulaCsv('@usuario', ';')).toBe("'@usuario");
    expect(celulaCsv('2026-10-20', ';')).toBe('2026-10-20');
  });
});

describe('montarCsv', () => {
  it('segue a ordem das colunas e preenche ausentes com vazio', () => {
    const csv = montarCsv(['b', 'a', 'c'], [{ a: 1, b: 'x' }, { a: 2, b: 'y', c: 3 }], ';');
    expect(csv).toBe('b;a;c\r\nx;1;\r\ny;2;3\r\n');
  });
  it('sem linhas, só o cabeçalho', () => {
    expect(montarCsv(['a'], [], ',')).toBe('a\r\n');
  });
});

describe('catálogo de exportação', () => {
  it('chaves e colunas são únicas e todo conjunto começa por participante (exceto nada identificável)', () => {
    expect(new Set(CONJUNTOS.map((c) => c.chave)).size).toBe(CONJUNTOS.length);
    for (const c of CONJUNTOS) {
      expect(c.colunas[0].nome).toBe('participante');
      expect(new Set(c.colunas.map((x) => x.nome)).size).toBe(c.colunas.length);
      for (const col of c.colunas) expect(col.nome).not.toMatch(/^(nome|email|e_mail|apelido|escola|instituicao_ensino|data_nascimento)$/);
    }
  });
  it('dicionário tem uma linha por coluna', () => {
    const total = CONJUNTOS.reduce((s, c) => s + c.colunas.length, 0);
    expect(csvDicionario(CONJUNTOS, ';').trim().split('\r\n')).toHaveLength(total + 1);
  });
  it('nome do arquivo', () => {
    expect(nomeArquivo('agua', { inicio: '2026-10-01', fim: '2026-10-28' }, '2026-10-28')).toBe('nutriteens_agua_2026-10-01_a_2026-10-28.csv');
    expect(nomeArquivo('agua', null, '2026-10-28')).toBe('nutriteens_agua_tudo_ate_2026-10-28.csv');
  });
});
