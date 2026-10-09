import { aplicarLeitura, contarNaoLidas, montarNotificacoesApp } from '../notificacoesApp';
import type { ChamaDupla } from '../../../social/utils/chamaDupla';

const chama = (o: Partial<ChamaDupla>): ChamaDupla => ({
  id: 'c1', situacao: 'ativa', amizadeId: 'a1', apelido: 'Lia', avatar: null,
  sequenciaAtual: 3, maiorSequencia: 3, vidasRestantes: 3,
  euFizHoje: false, duplaFezHoje: false, concluidaHoje: false, aviso: null, ...o,
});
const dia = new Date(2026, 9, 7, 20, 0);

describe('montarNotificacoesApp', () => {
  it('tudo em dia → lista vazia', () => {
    const l = montarNotificacoesApp({
      chamas: [chama({ concluidaHoje: true })], pedidosRecebidos: [],
      missoes: { diaria: { titulo: 'x', concluida: true }, semanais: [], mensais: [] }, agora: dia,
    });
    expect(l).toEqual([]);
  });

  it('cada item leva para a tela que resolve', () => {
    const l = montarNotificacoesApp({
      chamas: [chama({ id: 'c2', situacao: 'recebido', apelido: 'Beto' }), chama({})],
      pedidosRecebidos: [{ amizadeId: 'p1', apelido: 'Ana' }],
      missoes: {
        diaria: { titulo: 'Beber água', concluida: false },
        semanais: [{ titulo: 'A', concluida: false }, { titulo: 'B', concluida: false }, { titulo: 'C', concluida: false }, { titulo: 'D', concluida: true }],
        mensais: [{ titulo: 'M', concluida: false }],
      },
      agora: dia,
    });
    expect(l.map((n) => [n.tipo, n.destino])).toEqual([
      ['pedido_amizade', 'Social'],
      ['convite_chama', 'Social'],
      ['lembrete_chama', 'Home'],
      ['missao_diaria', 'Missoes'],
      ['missao_semanal', 'Missoes'],
      ['missao_mensal', 'Missoes'],
    ]);
    expect(l.find((n) => n.tipo === 'missao_semanal')?.texto).toBe('A, B e mais 1');
  });

  it('lembrete só a partir das 19h e nenhum texto aponta culpado', () => {
    const cedo = montarNotificacoesApp({ chamas: [chama({})], pedidosRecebidos: [], missoes: null, agora: new Date(2026, 9, 7, 9, 0) });
    expect(cedo).toEqual([]);
    const aviso = montarNotificacoesApp({ chamas: [chama({ aviso: 'ENCERRADA', concluidaHoje: true })], pedidosRecebidos: [], missoes: null, agora: dia });
    expect(aviso[0].texto).toBe('A sequência da dupla chegou ao fim! Que tal recomeçarem juntos hoje?');
  });

  it('lidas: não lidas vêm primeiro e o id muda no dia seguinte (volta a ser não lida)', () => {
    const entrada = (agora: Date) => montarNotificacoesApp({
      chamas: [], pedidosRecebidos: [{ amizadeId: 'p1', apelido: 'Ana' }],
      missoes: { diaria: { titulo: 'Beber água', concluida: false }, semanais: [], mensais: [] }, agora,
    });
    const hoje = entrada(dia);
    const lidas = new Set([hoje[0].id]); // pedido lido
    const marcadas = aplicarLeitura(hoje, lidas);
    expect(marcadas.map((n) => [n.tipo, n.lida])).toEqual([['missao_diaria', false], ['pedido_amizade', true]]);
    expect(contarNaoLidas(marcadas)).toBe(1);

    const amanha = aplicarLeitura(entrada(new Date(2026, 9, 8, 20, 0)), lidas);
    expect(amanha.find((n) => n.tipo === 'missao_diaria')?.lida).toBe(false);
    expect(amanha.find((n) => n.tipo === 'pedido_amizade')?.lida).toBe(true);
  });

  it('receita de amigo vira notificação que abre a receita certa', () => {
    const l = montarNotificacoesApp({
      chamas: [], pedidosRecebidos: [], missoes: null, agora: dia,
      receitasRecebidas: [{ id: 'r1', receitaId: 'rec9', titulo: 'Omelete', remetente: 'Lia' }],
    });
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ tipo: 'receita_amigo', destino: 'Receita', params: { receitaId: 'rec9' } });
    expect(l[0].titulo).toBe('Lia te mandou uma receita');
  });
});
