import { agruparPorDia, formatarQuantidade, iconeOrigem, rotuloOrigem, tituloLancamento, type LancamentoXp } from '../extratoXp';

function lanc(id: string, criadoEm: Date, quantidade: number, origem = 'licao', descricao: string | null = null): LancamentoXp {
  return { id, origem, quantidade, descricao, criadoEm: criadoEm.toISOString() };
}

describe('tituloLancamento', () => {
  it('usa a descrição gravada pelo servidor', () => {
    expect(tituloLancamento({ origem: 'licao', descricao: ' Prato colorido ' })).toBe('Prato colorido');
  });

  it('cai no rótulo da origem quando não há descrição', () => {
    expect(tituloLancamento({ origem: 'bonus_trilha', descricao: null })).toBe('Bônus de trilha');
    expect(tituloLancamento({ origem: 'licao', descricao: '   ' })).toBe('Lição concluída');
  });

  it('não quebra com origem desconhecida', () => {
    expect(rotuloOrigem('origem_nova')).toBe('Pontos ganhos');
    expect(iconeOrigem('origem_nova')).toBe('star');
  });
});

describe('formatarQuantidade', () => {
  it('mostra sinal de ganho e unidade', () => {
    expect(formatarQuantidade(25)).toBe('+25 XP');
  });
});

describe('agruparPorDia', () => {
  const agora = new Date(2026, 9, 14, 15, 0, 0); // 14/10/2026 15:00 local

  it('devolve lista vazia sem lançamentos', () => {
    expect(agruparPorDia([], agora)).toEqual([]);
  });

  it('agrupa por dia local, soma o total e nomeia Hoje/Ontem', () => {
    const lista = [
      lanc('a', new Date(2026, 9, 14, 14, 0), 20),
      lanc('b', new Date(2026, 9, 14, 9, 0), 5, 'marco_sequencia'),
      lanc('c', new Date(2026, 9, 13, 20, 0), 100, 'bonus_modulo'),
      lanc('d', new Date(2026, 9, 2, 8, 0), 15),
    ];
    const dias = agruparPorDia(lista, agora);

    expect(dias.map((d) => d.titulo)).toEqual(['Hoje', 'Ontem', '2 de outubro']);
    expect(dias.map((d) => d.total)).toEqual([25, 100, 15]);
    expect(dias[0].itens.map((i) => i.id)).toEqual(['a', 'b']);
  });

  it('o total do extrato bate com a soma dos lançamentos', () => {
    const lista = [lanc('a', new Date(2026, 9, 14, 14), 20), lanc('b', new Date(2026, 8, 1, 10), 30)];
    const soma = agruparPorDia(lista, agora).reduce((s, d) => s + d.total, 0);
    expect(soma).toBe(50);
  });
});
