import {
  missaoDoDiaElegivel,
  montarConteudoMissaoTela,
  rotuloDataExtenso,
  textoSequenciaChip,
} from '../missaoDoDiaTela';

describe('rotuloDataExtenso', () => {
  it('dia da semana e mês por extenso', () => {
    expect(rotuloDataExtenso('2026-11-16')).toBe('Segunda-feira, 16 de novembro');
    expect(rotuloDataExtenso('2026-11-15')).toBe('Domingo, 15 de novembro');
    expect(rotuloDataExtenso('2026-12-31')).toBe('Quinta-feira, 31 de dezembro');
    expect(rotuloDataExtenso('2028-02-29')).toBe('Terça-feira, 29 de fevereiro');
  });

  it('data inválida ou vazia vira texto vazio', () => {
    expect(rotuloDataExtenso(null)).toBe('');
    expect(rotuloDataExtenso('2026-02-31')).toBe('');
    expect(rotuloDataExtenso('abc')).toBe('');
  });
});

describe('missaoDoDiaElegivel', () => {
  it('só com dados carregados, com missão e ainda não cumprida', () => {
    expect(missaoDoDiaElegivel({ dadosCarregados: true, temMissao: true, concluida: false })).toBe(true);
    expect(missaoDoDiaElegivel({ dadosCarregados: false, temMissao: true, concluida: false })).toBe(false);
    expect(missaoDoDiaElegivel({ dadosCarregados: true, temMissao: false, concluida: false })).toBe(false);
    expect(missaoDoDiaElegivel({ dadosCarregados: true, temMissao: true, concluida: true })).toBe(false);
  });
});

describe('montarConteudoMissaoTela', () => {
  it('missão com destino: o botão leva para lá', () => {
    const c = montarConteudoMissaoTela('AGUA_ML');
    expect(c.destino?.rota).toBe('ConsumoAgua');
    expect(c.rotuloPrincipal).toBe('Registrar água');
  });

  it('missão sem destino único: abre as missões', () => {
    const c = montarConteudoMissaoTela('TIPO_NOVO_QUALQUER');
    expect(c.destino).toBeNull();
    expect(c.rotuloPrincipal).toBe('Ver minhas missões');
  });
});

describe('textoSequenciaChip', () => {
  it('singular, plural e ausência', () => {
    expect(textoSequenciaChip(1)).toBe('1 dia seguido');
    expect(textoSequenciaChip(7)).toBe('7 dias seguidos');
    expect(textoSequenciaChip(0)).toBeNull();
    expect(textoSequenciaChip(NaN)).toBeNull();
  });
});
