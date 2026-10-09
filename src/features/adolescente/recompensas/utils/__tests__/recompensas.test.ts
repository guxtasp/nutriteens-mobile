import {
  INTERVALO_VERIFICACAO_MS,
  deveVerificar,
  montarFilaRecompensas,
  obterRotaAtiva,
  rotaPermiteCelebrar,
  tituloRecompensaInsignia,
} from '../recompensas';
import type { CartaGuia } from '../../../cartas/utils/cartas';
import type { Insignia } from '../../../perfil/services/gamificacaoService';

function carta(passo: number, extra: Partial<CartaGuia> = {}): CartaGuia {
  return {
    id: `c${passo}`,
    passo,
    codigo: `passo_${passo}`,
    titulo: `Carta ${passo}`,
    resumo: '',
    dica: '',
    comoGanhar: '',
    obtida: true,
    nova: true,
    ...extra,
  };
}

function insignia(id: string, categoria: Insignia['categoria'], extra: Partial<Insignia> = {}): Insignia {
  return { id, codigo: id, categoria, valor: null, nome: id, descricao: null, icone: null, obtida: true, nova: true, ...extra };
}

describe('montarFilaRecompensas', () => {
  it('só entra o que foi ganho e ainda não foi visto', () => {
    const fila = montarFilaRecompensas(
      [carta(1, { nova: false }), carta(2), carta(3, { obtida: false, nova: false })],
      [insignia('a', 'conquista', { nova: false }), insignia('b', 'conquista', { obtida: false, nova: false })],
      new Set(),
    );
    expect(fila.map((r) => r.chave)).toEqual(['carta:c2']);
  });

  it('cartas vêm primeiro (por passo) e depois conquista, marco e insígnia', () => {
    const fila = montarFilaRecompensas(
      [carta(4), carta(2)],
      [insignia('ins', 'insignia'), insignia('mar', 'marco'), insignia('con', 'conquista')],
      new Set(),
    );
    expect(fila.map((r) => r.chave)).toEqual(['carta:c2', 'carta:c4', 'insignia:con', 'insignia:mar', 'insignia:ins']);
  });

  it('ignora o que já foi mostrado nesta sessão', () => {
    const fila = montarFilaRecompensas([carta(1), carta(2)], [], new Set(['carta:c1']));
    expect(fila.map((r) => r.chave)).toEqual(['carta:c2']);
  });

  it('lista vazia quando não há nada novo', () => {
    expect(montarFilaRecompensas([], [], new Set())).toEqual([]);
  });
});

describe('rotas', () => {
  it('só celebra em telas calmas', () => {
    expect(rotaPermiteCelebrar('Home')).toBe(true);
    expect(rotaPermiteCelebrar('Trilha')).toBe(true);
    expect(rotaPermiteCelebrar('LicaoDetalhe')).toBe(false);
    expect(rotaPermiteCelebrar('AlbumCartas')).toBe(false);
    expect(rotaPermiteCelebrar(undefined)).toBe(false);
  });

  it('obterRotaAtiva desce pelos navegadores aninhados', () => {
    expect(obterRotaAtiva({ index: 1, routes: [{ name: 'A' }, { name: 'B' }] })).toBe('B');
    expect(
      obterRotaAtiva({ index: 0, routes: [{ name: 'Pai', state: { index: 1, routes: [{ name: 'X' }, { name: 'Filha' }] } }] }),
    ).toBe('Filha');
    expect(obterRotaAtiva(undefined)).toBeUndefined();
    expect(obterRotaAtiva({ routes: [] })).toBeUndefined();
  });
});

describe('deveVerificar', () => {
  it('verifica na hora ao sair de uma tela que gera recompensa', () => {
    expect(deveVerificar({ agora: 1000, ultimaVerificacao: 990, rotaAnterior: 'LicaoCompleta' })).toBe(true);
  });

  it('em navegação normal respeita o intervalo mínimo', () => {
    expect(deveVerificar({ agora: 10_000, ultimaVerificacao: 5_000, rotaAnterior: 'Trilha' })).toBe(false);
    expect(
      deveVerificar({ agora: 5_000 + INTERVALO_VERIFICACAO_MS, ultimaVerificacao: 5_000, rotaAnterior: 'Trilha' }),
    ).toBe(true);
  });
});

describe('tituloRecompensaInsignia', () => {
  it('muda conforme a categoria', () => {
    expect(tituloRecompensaInsignia('insignia')).toBe('Nova insígnia!');
    expect(tituloRecompensaInsignia('marco')).toBe('Marco alcançado!');
    expect(tituloRecompensaInsignia('conquista')).toBe('Conquista desbloqueada!');
  });
});
