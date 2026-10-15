import { calcularMetricas } from '../calcularMetricas';
import { escolher, fraseComparacao, gerarFeedbacks } from '../feedbackBroxis';
import { dadosCompletos, dadosVazios } from './fixtures';

const PROIBIDAS = /\b(bom|boa|ruim|ruins|caloria|kcal|peso|gordura|dieta|perdeu|falhou|fracasso|culpa|ranking|melhor que|pior)\b/i;
const todos = (d = dadosCompletos()) => Object.values(gerarFeedbacks(calcularMetricas(d, 'semana'), { semente: 'u1' }));

describe('feedback do Broxis', () => {
  it('sem dados: explica que falta dado e indica como começar, sem inventar números', () => {
    const f = gerarFeedbacks(calcularMetricas(dadosVazios(), 'semana'), { semente: 'u1' });
    expect(f.resumo.pose).toBe('aceno');
    expect(f.resumo.proximoPasso?.tipo).toBe('registrar_refeicao');
    expect(f.alimentacao.proximoPasso?.tipo).toBe('registrar_refeicao');
    expect(f.agua.proximoPasso?.tipo).toBe('registrar_agua');
    expect(f.atividade.proximoPasso?.tipo).toBe('registrar_atividade');
    expect(f.engajamento.proximoPasso?.tipo).toBe('continuar_trilha');
    for (const x of Object.values(f)) expect(/\d/.test(x.texto)).toBe(false);
  });
  it('poucos dias: não fala em tendência', () => {
    const d = dadosVazios({ agua: [{ data: '2026-10-14', ml: 300 }] });
    const f = gerarFeedbacks(calcularMetricas(d, 'semana'), { semente: 'u1' });
    expect(f.resumo.texto).toContain('1 dia');
    expect(f.resumo.texto).toContain('poucos');
  });
  it('textos citam números que existem nos dados', () => {
    const f = gerarFeedbacks(calcularMetricas(dadosCompletos(), 'semana'), { semente: 'u1' });
    expect(f.alimentacao.texto).toContain('3 dias');
    expect(f.alimentacao.texto).toContain('4 refeições');
    expect(f.diversidade.texto).toContain('Banana, Couve');
    expect(f.engajamento.texto).toContain('1 de 2 missões');
    expect(f.engajamento.proximoPasso?.trilhaTitulo).toBe('Comida de verdade');
    expect(f.conquistas.texto).toContain('Carta 1');
  });
  it('queda nunca vira cobrança e mantém tom neutro', () => {
    const d = dadosCompletos();
    for (const dia of ['2026-10-02', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07']) {
      d.refeicoes.push({ id: 'x' + dia, data: dia, tipo: 'ALMOCO', alimentos: [] });
    }
    const m = calcularMetricas(d, 'semana');
    expect(m.comparacoes.diasComRefeicao.direcao).toBe('desceu');
    const f = gerarFeedbacks(m, { semente: 'u1' });
    expect(f.alimentacao.texto).toContain('No período anterior foram');
    expect(f.resumo.pose).toBe('calmo');
  });
  it('nenhuma mensagem usa linguagem de julgamento, dieta ou corpo', () => {
    for (const f of todos()) expect(PROIBIDAS.test(f.texto)).toBe(false);
    for (const f of todos(dadosVazios())) expect(PROIBIDAS.test(f.texto)).toBe(false);
  });
  it('variação é determinística por semente e pode diferir entre sementes', () => {
    const opcoes = ['a', 'b', 'c', 'd'];
    expect(escolher(opcoes, 'x')).toBe(escolher(opcoes, 'x'));
    const vistos = new Set(Array.from({ length: 30 }, (_, i) => escolher(opcoes, 'semente' + i)));
    expect(vistos.size).toBeGreaterThan(1);
  });
  it('sem alimentos novos informa isso sem cobrar; histórico ausente não afirma nada', () => {
    const d = dadosCompletos();
    d.primeiraAparicaoAlimentos = [{ alimentoId: 'a3', nome: 'Arroz', data: '2026-09-01' }, { alimentoId: 'a2', nome: 'Banana', data: '2026-09-01' }, { alimentoId: 'a5', nome: 'Couve', data: '2026-09-01' }];
    const f = gerarFeedbacks(calcularMetricas(d, 'semana'), { semente: 'u1' });
    expect(f.diversidade.texto).toContain('novo');
    d.primeiraAparicaoAlimentos = [];
    const g = gerarFeedbacks(calcularMetricas(d, 'semana'), { semente: 'u1' });
    expect(g.diversidade.texto.includes('novo')).toBe(false);
  });
  it('fraseComparacao: sem base é vazia', () => {
    expect(fraseComparacao({ direcao: 'sem_base', atual: 1, anterior: 0, diferenca: 1 }, 'dia', 'dias')).toBe('');
  });
});
