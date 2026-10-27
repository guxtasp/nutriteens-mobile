import { calcularMetricas } from '../calcularMetricas';
import { montarDetalhes, type ContextoDetalhes } from '../detalhes';
import { dadosCompletos, dadosVazios } from './fixtures';

const PROIBIDAS = /\b(bom|boa|ruim|ruins|caloria|kcal|peso|gordura|dieta|perdeu|falhou|fracasso|culpa|ranking|pior|ebia|inseguran\w*)\b|compr(ar|e|a)\b/i;
const alimentos = [
  { nome: 'Banana', grupos: ['FRUTAS'] }, { nome: 'Couve', grupos: ['LEGUMES_E_VERDURAS'] },
  { nome: 'Ovo', grupos: ['CARNES_E_OVOS'] }, { nome: 'Castanha', grupos: ['OLEAGINOSAS_E_SEMENTES'] },
];
const ctx = (o: Partial<ContextoDetalhes> = {}): ContextoDetalhes => ({ restricao: false, alimentos, semente: 'u1', ...o });
const det = (d = dadosCompletos(), c = ctx(), tipo: 'semana' | 'mes' = 'semana') => montarDetalhes(calcularMetricas(d, tipo), c);
const textos = (r: ReturnType<typeof det>) =>
  Object.values(r).flatMap((x) => [...x.linhas.flatMap((l) => [l.rotulo, l.valor]), ...x.dicas, ...(x.sugestoes ?? []).flatMap((s) => [s.titulo, ...s.alimentos])]);

describe('montarDetalhes', () => {
  it('números de apoio batem com os dados', () => {
    const r = det();
    expect(r.alimentacao.linhas[0]).toEqual({ rotulo: 'Refeições registradas', valor: '4' });
    expect(r.atividade.linhas).toContainEqual({ rotulo: 'Minutos registrados', valor: '95' });
    expect(r.atividade.linhas).toContainEqual({ rotulo: 'Atividades diferentes', valor: '2' });
    expect(r.engajamento.linhas).toContainEqual({ rotulo: 'Lições concluídas', valor: '2' });
  });

  it('lista refeições por tipo com nome amigável', () => {
    const rotulos = det().alimentacao.linhas.map((l) => l.rotulo);
    expect(rotulos).toContain('Almoço');
    expect(rotulos).toContain('Café da manhã');
  });

  it('sugestões só aparecem para grupos que não apareceram no período', () => {
    const sug = det().diversidade.sugestoes ?? [];
    const dados = dadosCompletos();
    const presentes = new Set(dados.refeicoes.filter((r) => r.data >= '2026-10-09').flatMap((r) => r.alimentos.flatMap((a) => a.grupos)));
    const grupoDe = (nome: string) => alimentos.find((a) => a.nome === nome)!.grupos[0];
    sug.flatMap((s) => s.alimentos).forEach((n) => expect(presentes.has(grupoDe(n))).toBe(false));
  });

  it('o tom da dica muda com a restrição, sem citar a causa', () => {
    const livre = det(dadosCompletos(), ctx({ restricao: false })).diversidade.dicas.join(' ');
    const apertado = det(dadosCompletos(), ctx({ restricao: true })).diversidade.dicas.join(' ');
    expect(livre).not.toBe(apertado);
    expect(apertado).toContain('já está disponível');
  });

  it('sem catálogo (falha ao carregar), os detalhes funcionam sem sugestões', () => {
    const r = det(dadosCompletos(), ctx({ alimentos: [] }));
    expect(r.diversidade.sugestoes).toBeUndefined();
    expect(r.diversidade.linhas.length).toBeGreaterThan(0);
  });

  it('sem registros: nada de dica inventada e nenhuma sugestão', () => {
    const r = det(dadosVazios());
    Object.values(r).forEach((x) => expect(x.dicas).toEqual([]));
    expect(r.diversidade.sugestoes).toBeUndefined();
  });

  it('atividade repetida gera dica de variar; várias, dica geral', () => {
    const uma = det(dadosVazios({ atividades: [{ data: '2026-10-12', tipo: 'Caminhada', minutos: 30 }] }));
    expect(uma.atividade.dicas[0]).toContain('Variar');
    expect(det().atividade.dicas[0]).toContain('Qualquer movimento');
  });

  it('missão não concluída não vira dica: a limitação é explicada pela nota do cartão', () => {
    const r = det(dadosVazios({ missoesDiarias: [{ data: '2026-10-12', concluida: false }] }));
    expect(r.engajamento.dicas.join(' ')).not.toMatch(/miss/i);
  });

  it('trilha a poucas lições do fim é destacada', () => {
    const r = det(dadosVazios({ trilhas: [{ trilhaId: 't1', titulo: 'Trilha A', totalLicoes: 8, licoesConcluidas: 6 }] }));
    expect(r.engajamento.dicas[0]).toContain('"Trilha A"');
    expect(r.engajamento.dicas[0]).toContain('2 lições');
  });

  it('alimentos novos: só mostra se há histórico anterior (senão não afirma)', () => {
    expect(det(dadosVazios({ refeicoes: [{ id: 'r', data: '2026-10-12', tipo: 'ALMOCO', alimentos: [] }] })).diversidade.linhas.map((l) => l.rotulo))
      .not.toContain('Alimentos novos no seu histórico');
  });

  it.each([true, false])('nenhum texto usa palavras proibidas nem cita EBIA (restricao=%s)', (restricao) => {
    for (const d of [dadosCompletos(), dadosVazios(), dadosVazios({ agua: [{ data: '2026-10-14', ml: 300 }] })]) {
      for (const tipo of ['semana', 'mes'] as const) {
        textos(det(d, ctx({ restricao }), tipo)).forEach((t) => expect(t).not.toMatch(PROIBIDAS));
      }
    }
  });
});
