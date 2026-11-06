import { destinoMissaoDiaria, destinoMissaoPeriodica, estadoDaMissao } from '../destinoMissao';

describe('destinoMissaoDiaria', () => {
  it('água, atividade e refeição levam às telas de registro', () => {
    expect(destinoMissaoDiaria('AGUA_ML')?.rota).toBe('ConsumoAgua');
    expect(destinoMissaoDiaria('ATIVIDADE_MIN')?.rota).toBe('AtividadeFisica');
    expect(destinoMissaoDiaria('ALIMENTO_NATURAL_QTD')?.rota).toBe('TipoRefeicao');
    expect(destinoMissaoDiaria('REFEICAO_SEM_ULTRAPROCESSADO')?.rota).toBe('TipoRefeicao');
    expect(destinoMissaoDiaria('NUTRIENTE_LACUNA')?.rota).toBe('TipoRefeicao');
  });
  it('tipo desconhecido não vira atalho (nada de botão que leva a lugar nenhum)', () => {
    expect(destinoMissaoDiaria('OUTRA_COISA')).toBeNull();
  });
});

describe('destinoMissaoPeriodica', () => {
  it('cada métrica leva ao lugar onde ela é cumprida', () => {
    expect(destinoMissaoPeriodica('DIAS_AGUA_META')?.rota).toBe('ConsumoAgua');
    expect(destinoMissaoPeriodica('MINUTOS_ATIVIDADE')?.rota).toBe('AtividadeFisica');
    expect(destinoMissaoPeriodica('DIAS_PASSOS_META')?.rota).toBe('AtividadeFisica');
    expect(destinoMissaoPeriodica('DIAS_VARIEDADE_GRUPOS')?.rota).toBe('TipoRefeicao');
    expect(destinoMissaoPeriodica('LICOES')?.rota).toBe('Trilha');
  });
  it('missões que somam outras missões não têm atalho único', () => {
    expect(destinoMissaoPeriodica('MISSOES_DIARIAS')).toBeNull();
  });
});

describe('estadoDaMissao', () => {
  it('concluída tem prioridade', () => {
    expect(estadoDaMissao({ concluida: true, atual: 5 })).toBe('concluida');
  });
  it('com algum progresso está em andamento', () => {
    expect(estadoDaMissao({ concluida: false, atual: 1 })).toBe('em_andamento');
  });
  it('sem progresso não foi iniciada', () => {
    expect(estadoDaMissao({ concluida: false, atual: 0 })).toBe('nao_iniciada');
  });
});
