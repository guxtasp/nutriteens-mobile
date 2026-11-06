import { aplicarConclusaoLocal } from '../conclusaoLocal';

const nos = (...s: Array<'concluida' | 'atual' | 'bloqueada'>) => s.map((status, i) => ({ id: `l${i + 1}`, status }));

describe('aplicarConclusaoLocal', () => {
  it('concluir a lição atual libera a seguinte', () => {
    const r = aplicarConclusaoLocal(nos('concluida', 'atual', 'bloqueada'), 'l2');
    expect(r.map((n) => n.status)).toEqual(['concluida', 'concluida', 'atual']);
  });

  it('concluir a última deixa tudo concluído', () => {
    const r = aplicarConclusaoLocal(nos('concluida', 'atual'), 'l2');
    expect(r.map((n) => n.status)).toEqual(['concluida', 'concluida']);
  });

  it('lição bloqueada não pode ser concluída por esse caminho', () => {
    const entrada = nos('atual', 'bloqueada');
    expect(aplicarConclusaoLocal(entrada, 'l2')).toBe(entrada);
  });

  it('lição que não está no caminho não muda nada', () => {
    const entrada = nos('atual', 'bloqueada');
    expect(aplicarConclusaoLocal(entrada, 'zzz')).toBe(entrada);
  });

  it('concluir de novo uma lição já concluída mantém o estado', () => {
    const r = aplicarConclusaoLocal(nos('concluida', 'atual'), 'l1');
    expect(r.map((n) => n.status)).toEqual(['concluida', 'atual']);
  });

  it('não altera o array original', () => {
    const entrada = nos('atual', 'bloqueada');
    aplicarConclusaoLocal(entrada, 'l1');
    expect(entrada.map((n) => n.status)).toEqual(['atual', 'bloqueada']);
  });
});
