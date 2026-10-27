import { derivarEstado } from '../estadoMetricas';
import { dadosCompletos, dadosVazios } from './fixtures';

describe('derivarEstado', () => {
  it('sem dados e sem erro: carregando', () => {
    expect(derivarEstado(null, false, 'semana', 'u1')).toEqual({ status: 'carregando' });
  });

  it('sem dados e com erro: erro', () => {
    expect(derivarEstado(null, true, 'semana', 'u1')).toEqual({ status: 'erro' });
  });

  it('com dados, o erro de uma recarga não derruba a tela', () => {
    expect(derivarEstado(dadosCompletos(), true, 'semana', 'u1').status).toBe('pronto');
  });

  it('usuário sem registros: pronto, nível "nenhum" e feedback para todos os cartões', () => {
    const e = derivarEstado(dadosVazios(), false, 'semana', 'u1');
    if (e.status !== 'pronto') throw new Error('esperava pronto');
    expect(e.metricas.atual.nivelDados).toBe('nenhum');
    expect(Object.keys(e.feedbacks).sort()).toEqual(
      ['agua', 'alimentacao', 'atividade', 'conquistas', 'diversidade', 'engajamento', 'resumo'],
    );
  });

  it('trocar o período recalcula a janela sem novos dados', () => {
    const d = dadosCompletos();
    const s = derivarEstado(d, false, 'semana', 'u1');
    const m = derivarEstado(d, false, 'mes', 'u1');
    if (s.status !== 'pronto' || m.status !== 'pronto') throw new Error('esperava pronto');
    expect(s.metricas.atual.janela.dias).toBe(7);
    expect(m.metricas.atual.janela.dias).toBe(28);
  });

  it('é determinístico para a mesma semente (mensagem não muda a cada render)', () => {
    const a = derivarEstado(dadosCompletos(), false, 'semana', 'u1');
    const b = derivarEstado(dadosCompletos(), false, 'semana', 'u1');
    expect(a).toEqual(b);
  });

  it('pronto traz o termômetro calculado na janela do período: sem registros = sem_dados', () => {
    const e = derivarEstado(dadosVazios(), false, 'semana', 'u1');
    if (e.status !== 'pronto') throw new Error('esperava pronto');
    expect(e.mistura.estado).toBe('sem_dados');
    expect(e.mistura.classificados).toBe(0);
  });
});
