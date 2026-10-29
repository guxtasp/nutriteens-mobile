import { mesMaisAtivo, montarSlidesAno, type DadosAno } from '../retrospectivaSlides';

const JANELA = { inicio: '2025-10-28', fim: '2026-10-28', anoCompleto: true };
const ZERO = { refeicoes: 0, licoes: 0, atividades: 0, insignias: 0 };

const dados = (o: Partial<DadosAno> = {}): DadosAno => ({
  janela: JANELA,
  totais: { refeicoes: 120, licoes: 1, atividades: 14, insignias: 5 },
  diasComRefeicao: [],
  maiorSequencia: 0,
  criadaEm: '2024-01-10',
  ...o,
});

const dias = (mes: string, n: number) => Array.from({ length: n }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`);

describe('mesMaisAtivo', () => {
  it('escolhe o mês com mais dias e devolve o nome em português', () => {
    expect(mesMaisAtivo([...dias('2026-03', 4), ...dias('2026-08', 9), ...dias('2026-09', 2)])).toEqual({ mes: 'agosto', dias: 9 });
  });

  it('empate fica com o mês mais antigo', () => {
    expect(mesMaisAtivo([...dias('2026-05', 4), ...dias('2026-02', 4)])).toEqual({ mes: 'fevereiro', dias: 4 });
  });

  it('ignora dias repetidos', () => {
    expect(mesMaisAtivo([...dias('2026-03', 4), ...dias('2026-03', 4), '2026-04-01'])).toEqual({ mes: 'março', dias: 4 });
  });

  it('com poucos dias no total ou no melhor mês, não há "mês mais ativo"', () => {
    expect(mesMaisAtivo(dias('2026-03', 4))).toBeNull(); // menos de 5 no total
    expect(mesMaisAtivo(['2026-01-01', '2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-05-02'])).toBeNull(); // melhor mês com 2
  });
});

describe('montarSlidesAno', () => {
  it('sem nada para celebrar não há retrospectiva', () => {
    expect(montarSlidesAno(dados({ totais: ZERO }))).toBeNull();
  });

  it('roteiro enxuto: intro, números, (momentos) e cartão final — no máximo 4 slides', () => {
    const r = montarSlidesAno(dados({ diasComRefeicao: dias('2026-08', 9), maiorSequencia: 7, criadaEm: '2026-02-03' }))!;
    expect(r.slides.map((s) => s.tipo)).toEqual(['intro', 'numeros', 'momentos', 'final']);
    expect(r.slides.length).toBeLessThanOrEqual(4);
    expect(r.slides[0]).toMatchObject({ titulo: 'Seu ano com o Bróxis', periodo: '28/10/2025 a 28/10/2026' });
  });

  it('sem momentos o slide de momentos não existe (3 slides)', () => {
    const r = montarSlidesAno(dados())!;
    expect(r.slides.map((s) => s.tipo)).toEqual(['intro', 'numeros', 'final']);
  });

  it('números em ordem fixa (até 4) num único slide', () => {
    const r = montarSlidesAno(dados({ diasComRefeicao: dias('2026-08', 9) }))!;
    const numeros = r.slides.find((s) => s.tipo === 'numeros');
    expect(numeros?.tipo === 'numeros' && numeros.itens.map((i) => i.cartao)).toEqual(['alimentacao', 'resumo', 'engajamento', 'atividade']);
    expect(numeros?.tipo === 'numeros' && numeros.itens[2]).toMatchObject({ valor: 1, rotulo: 'lição concluída' });
  });

  it('pula zeros e usa os números seguintes', () => {
    const r = montarSlidesAno(dados({ totais: { ...ZERO, atividades: 3, insignias: 1 } }))!;
    const numeros = r.slides.find((s) => s.tipo === 'numeros');
    expect(numeros?.tipo === 'numeros' && numeros.itens.map((i) => i.rotulo)).toEqual(['atividades registradas', 'conquista']);
  });

  it('momentos só aparecem quando aconteceram, todos num único slide', () => {
    const r = montarSlidesAno(
      dados({ diasComRefeicao: dias('2026-08', 9), maiorSequencia: 7, criadaEm: '2026-02-03' }),
    )!;
    const m = r.slides.find((s) => s.tipo === 'momentos');
    expect(m?.tipo === 'momentos' && m.itens).toEqual([
      { icone: 'calendar', titulo: 'Seu mês mais ativo', destaque: 'agosto', frase: '9 dias com refeição registrada nesse mês.' },
      { icone: 'flame', titulo: 'Sua maior sequência', destaque: '7 dias', frase: expect.any(String) },
      { icone: 'sparkles', titulo: 'Sua jornada começou', destaque: '03/02/2026', frase: expect.any(String) },
    ]);
  });

  it('sequência de 1 dia não vira momento', () => {
    expect(montarSlidesAno(dados({ maiorSequencia: 1 }))!.slides.some((s) => s.tipo === 'momentos')).toBe(false);
  });

  it('janela curta usa "Sua jornada até aqui" na intro', () => {
    const r = montarSlidesAno(dados({ janela: { ...JANELA, inicio: '2026-09-01', anoCompleto: false } }))!;
    expect(r.slides[0]).toMatchObject({ titulo: 'Sua jornada até aqui' });
  });

  it('o cartão final parabeniza pelo aniversário E pela jornada e resume os números', () => {
    const r = montarSlidesAno(dados())!;
    const final = r.slides[r.slides.length - 1];
    expect(final.tipo).toBe('final');
    if (final.tipo !== 'final') return;
    expect(final.titulo).toBe('Parabéns!');
    expect(final.mensagem).toMatch(/aniversário/);
    expect(final.mensagem).toMatch(/jornada/);
    expect(final.resumo).toEqual([
      { valor: '120', rotulo: 'refeições registradas' },
      { valor: '1', rotulo: 'lição concluída' },
      { valor: '14', rotulo: 'atividades registradas' },
      { valor: '5', rotulo: 'conquistas' },
    ]);
  });
});

describe('texto de compartilhar', () => {
  it('parabeniza, resume e apresenta o app; inclui o link só se houver', () => {
    const sem = montarSlidesAno(dados({ maiorSequencia: 7 }))!.textoCompartilhar;
    expect(sem).toMatch(/^Parabéns pra mim, pelo aniversário e pela jornada!/);
    expect(sem).toContain('• 120 refeições registradas');
    expect(sem).toContain('• maior sequência: 7 dias seguidos');
    expect(sem).toContain('NutriTeens ajuda adolescentes');
    expect(sem).not.toContain('http');

    const com = montarSlidesAno(dados(), 'https://exemplo.com/nutriteens')!.textoCompartilhar;
    expect(com.endsWith('https://exemplo.com/nutriteens')).toBe(true);
  });

  it('não leva dado pessoal (nome, idade, nascimento) e não compara nem cobra', () => {
    const t = montarSlidesAno(dados({ criadaEm: '2026-02-03' }))!.textoCompartilhar;
    expect(t).not.toMatch(/nasc|\bidade\b|\banos\b|ranking|nota|peso|corpo|merece|falt|menos que/i);
  });
});
