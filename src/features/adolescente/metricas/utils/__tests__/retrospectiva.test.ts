import { calcularMetricas } from '../calcularMetricas';
import { montarRetrospectiva } from '../retrospectiva';
import { dadosCompletos, dadosVazios } from './fixtures';

const retro = (d = dadosCompletos(), tipo: 'semana' | 'mes' = 'mes') => montarRetrospectiva(calcularMetricas(d, tipo), 'u1');

describe('montarRetrospectiva', () => {
  it('só existe para a visão do mês', () => {
    expect(retro(dadosCompletos(), 'semana')).toBeNull();
    expect(retro(dadosCompletos(), 'mes')).not.toBeNull();
  });

  it('sem nenhum registro: não há cartão (nada de enchimento)', () => {
    expect(retro(dadosVazios())).toBeNull();
  });

  it('até 3 destaques, de áreas diferentes e com valor real maior que zero', () => {
    const r = retro()!;
    expect(r.destaques.length).toBeGreaterThan(0);
    expect(r.destaques.length).toBeLessThanOrEqual(3);
    expect(new Set(r.destaques.map((d) => d.cartao)).size).toBe(r.destaques.length);
    r.destaques.forEach((d) => expect(Number(d.valor)).toBeGreaterThan(0));
  });

  it('é estável para a mesma semente', () => {
    expect(retro()).toEqual(retro());
  });

  it('período e dias ativos refletem a janela de 28 dias', () => {
    const r = retro()!;
    expect(r.periodo).toBe('18/09 a 15/10');
    const ativos = calcularMetricas(dadosCompletos(), 'mes').atual.diasAtivos;
    expect(r.mensagem).toContain(`${ativos} dia`);
    expect(r.mensagem).toContain('28 dias');
  });

  it('conquista só vem se foi ganha dentro do período', () => {
    const r = retro()!;
    expect(r.conquista).toBe('Carta 1'); // 12/10 está na janela; "Primeira lição" (03/10) também, mas a mais recente vem primeiro
    const sem = retro(dadosCompletos())!;
    expect(sem.conquista).not.toBeNull();
    const fora = dadosCompletos();
    fora.conquistas = [{ tipo: 'insignia', nome: 'Antiga', data: '2026-01-10' }];
    expect(retro(fora)!.conquista).toBeNull();
  });

  it('nenhum texto usa palavras de juízo, cobrança, peso ou caloria', () => {
    const r = retro()!;
    const texto = [r.titulo, r.mensagem, r.conquista ?? '', ...r.destaques.map((d) => `${d.valor} ${d.rotulo}`)].join(' ');
    expect(texto).not.toMatch(/\b(bom|boa|ruim|caloria|kcal|peso|dieta|falhou|culpa|ranking|pior|faltou)\b/i);
  });
});
