// src/features/adolescente/trocas/utils/__tests__/avaliacaoTrocas.test.ts
import {
  adiarAteAmanha,
  diasDesde,
  escolherIdeiaDoDia,
  limparAdiamentos,
  proximaCarta,
  somarCategoria,
  taxasAvaliacao,
  trocasGuardadas,
  trocasParaPerguntar,
  type RespostaRegistrada,
  type ResumoAvaliacaoTroca,
} from '../avaliacaoTrocas';
import { ordenarTrocas, type Troca } from '../trocas';
import { ORDEM_TESTEI, RETORNO_TESTEI } from '../../data/textosTestei';

const t = (o: Partial<Troca> & { id: string }): Troca => ({
  categoria: 'DOCE', origemId: null, origemNome: null, destinoId: `d-${o.id}`, destinoNome: o.id,
  tiposRefeicao: [], frase: 'f', rapida: false, ordem: 0,
  destinoAcessivel: true, destinoRecente: false, respondidaRecente: false, ...o,
});
const r = (trocaId: string, resposta: RespostaRegistrada['resposta'], criadoEm: string): RespostaRegistrada => ({
  trocaId, resposta, criadoEm,
});

describe('trocasGuardadas', () => {
  it('guarda quem disse QUERO TESTAR e ainda não contou como foi', () => {
    const g = trocasGuardadas([
      r('a', 'TENTAR', '2026-11-10T12:00:00Z'),
      r('b', 'TENTAR', '2026-11-12T12:00:00Z'),
      r('b', 'CURTI', '2026-11-14T12:00:00Z'),
    ]);
    expect(g.map((x) => x.trocaId)).toEqual(['a']);
  });

  it('guardar de novo depois de avaliar volta para a lista', () => {
    const g = trocasGuardadas([
      r('a', 'TENTAR', '2026-11-01T12:00:00Z'),
      r('a', 'NAO_ROLOU', '2026-11-03T12:00:00Z'),
      r('a', 'TENTAR', '2026-11-05T12:00:00Z'),
    ]);
    expect(g).toEqual([{ trocaId: 'a', guardadaEm: '2026-11-05T12:00:00.000Z' }]);
  });

  it('"não tenho" sem ter guardado não entra; mais recentes primeiro', () => {
    const g = trocasGuardadas([
      r('x', 'NAO_TENHO', '2026-11-01T12:00:00Z'),
      r('a', 'TENTAR', '2026-11-01T12:00:00Z'),
      r('b', 'TENTAR', '2026-11-02T12:00:00Z'),
    ]);
    expect(g.map((x) => x.trocaId)).toEqual(['b', 'a']);
  });

  it('ignora data inválida', () => {
    expect(trocasGuardadas([r('a', 'TENTAR', 'ontem')])).toEqual([]);
  });
});

describe('trocasParaPerguntar', () => {
  const agora = new Date('2026-11-15T12:00:00Z');
  const respostas = [
    r('velha', 'TENTAR', '2026-11-10T12:00:00Z'),
    r('dois', 'TENTAR', '2026-11-13T11:00:00Z'),
    r('nova', 'TENTAR', '2026-11-14T12:00:00Z'),
  ];

  it('só depois de 2 dias, a mais antiga primeiro', () => {
    expect(trocasParaPerguntar(respostas, agora).map((x) => [x.trocaId, x.dias])).toEqual([
      ['velha', 5],
      ['dois', 2],
    ]);
  });

  it('respeita o "me lembra amanhã" até a data marcada', () => {
    const adiadas = { velha: '2026-11-16T03:00:00Z' };
    expect(trocasParaPerguntar(respostas, agora, adiadas).map((x) => x.trocaId)).toEqual(['dois']);
    const depois = new Date('2026-11-16T04:00:00Z');
    expect(trocasParaPerguntar(respostas, depois, adiadas).map((x) => x.trocaId)).toContain('velha');
  });
});

describe('datas', () => {
  it('diasDesde conta dias inteiros e nunca fica negativo', () => {
    expect(diasDesde('2026-11-13T12:00:00Z', new Date('2026-11-15T11:59:00Z'))).toBe(1);
    expect(diasDesde('2026-11-16T12:00:00Z', new Date('2026-11-15T12:00:00Z'))).toBe(0);
  });
  it('adiarAteAmanha é a meia-noite do dia seguinte', () => {
    const agora = new Date(2026, 10, 15, 22, 30);
    expect(new Date(adiarAteAmanha(agora)).getTime()).toBe(new Date(2026, 10, 16).getTime());
  });
  it('limparAdiamentos tira vencidos e trocas que já não estão guardadas', () => {
    const agora = new Date('2026-11-15T12:00:00Z');
    const r2 = limparAdiamentos(
      { a: '2026-11-16T00:00:00Z', b: '2026-11-14T00:00:00Z', c: '2026-11-16T00:00:00Z' },
      ['a', 'b'],
      agora,
    );
    expect(r2).toEqual({ a: '2026-11-16T00:00:00Z' });
  });
});

describe('escolherIdeiaDoDia', () => {
  const lista = ['a', 'b', 'c', 'd', 'e'].map((id) => t({ id }));

  it('é a mesma no mesmo dia, independente da ordem recebida', () => {
    const x = escolherIdeiaDoDia(lista, '2026-11-15');
    const y = escolherIdeiaDoDia([...lista].reverse(), '2026-11-15');
    expect(x?.id).toBe(y?.id);
  });

  it('varia ao longo dos dias', () => {
    const dias = Array.from({ length: 10 }, (_, i) => `2026-11-${String(10 + i).padStart(2, '0')}`);
    const ids = new Set(dias.map((d) => escolherIdeiaDoDia(lista, d)?.id));
    expect(ids.size).toBeGreaterThan(1);
  });

  it('prefere acessível e sem "não rolou", mas não exclui se só houver essas', () => {
    const so = [t({ id: 'a', destinoAcessivel: false }), t({ id: 'b', naoRolouRecente: true }), t({ id: 'c' })];
    expect(escolherIdeiaDoDia(so, '2026-11-15')?.id).toBe('c');
    expect(escolherIdeiaDoDia([t({ id: 'a', destinoAcessivel: false })], '2026-11-15')?.id).toBe('a');
  });

  it('lista vazia não tem ideia do dia', () => {
    expect(escolherIdeiaDoDia([], '2026-11-15')).toBeNull();
  });
});

describe('ordenarTrocas com o retorno do "Testei?"', () => {
  it('"curti" sobe e "não rolou" desce, sem remover nada', () => {
    const r2 = ordenarTrocas([t({ id: 'a', naoRolouRecente: true }), t({ id: 'b' }), t({ id: 'c', curtidaRecente: true })]);
    expect(r2.map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });
  it('é só desempate: acessível continua na frente de curtida', () => {
    const r2 = ordenarTrocas([t({ id: 'a', curtidaRecente: true, destinoAcessivel: false }), t({ id: 'b' })]);
    expect(r2.map((x) => x.id)).toEqual(['b', 'a']);
  });
});

describe('proximaCarta', () => {
  it('é circular', () => {
    expect(proximaCarta(0, 3)).toBe(1);
    expect(proximaCarta(2, 3)).toBe(0);
    expect(proximaCarta(0, 0)).toBe(0);
  });
});

describe('taxas do painel', () => {
  const linha: ResumoAvaliacaoTroca = { trocaId: 'a', categoria: 'DOCE', guardaram: 10, curti: 3, meio: 2, naoRolou: 1, naoTenho: 2 };

  it('testei = testaram de fato / guardaram; curti = curti / testaram', () => {
    expect(taxasAvaliacao(linha)).toEqual({ testei: 60, curti: 50, testaram: 6 });
  });

  it('com menos de 5 pessoas a taxa não aparece', () => {
    expect(taxasAvaliacao({ guardaram: 4, curti: 2, meio: 0, naoRolou: 0, naoTenho: 0 })).toEqual({
      testei: null,
      curti: null,
      testaram: 2,
    });
  });

  it('soma por categoria', () => {
    const outra: ResumoAvaliacaoTroca = { ...linha, trocaId: 'b' };
    const bebida: ResumoAvaliacaoTroca = { ...linha, trocaId: 'c', categoria: 'REFRIGERANTE_BEBIDA' };
    expect(somarCategoria([linha, outra, bebida], 'DOCE')).toEqual({
      categoria: 'DOCE', guardaram: 20, curti: 6, meio: 4, naoRolou: 2, naoTenho: 4,
    });
  });
});

describe('textos do "Testei?"', () => {
  it('cada opção tem retorno e nenhum usa palavras de julgamento', () => {
    expect(ORDEM_TESTEI).toHaveLength(4);
    for (const k of ORDEM_TESTEI) {
      const txt = `${RETORNO_TESTEI[k].titulo} ${RETORNO_TESTEI[k].texto}`.toLowerCase();
      for (const proibida of ['errado', 'ruim', 'proibido', 'culpa']) expect(txt).not.toContain(proibida);
    }
  });
});
