import { mapearPerfilAmigo, rotuloDias, rotuloLicoes, type LinhaPerfilAmigo } from '../perfilAmigo';

const base: LinhaPerfilAmigo = {
  apelido: 'Ana',
  avatar: 'supercontente',
  desde: '2026-09-01T12:00:00Z',
  xp_total: 120,
  sequencia_atual: 4,
  maior_sequencia: 9,
  licoes_concluidas: 7,
  insignias: [],
};

describe('mapearPerfilAmigo', () => {
  it('converte a linha do banco', () => {
    const p = mapearPerfilAmigo(base);
    expect(p).toMatchObject({ apelido: 'Ana', xpTotal: 120, sequenciaAtual: 4, maiorSequencia: 9, licoesConcluidas: 7 });
    expect(p.desde).toBeInstanceOf(Date);
  });

  it('usa valores seguros para nulos e negativos', () => {
    const p = mapearPerfilAmigo({
      ...base,
      apelido: null,
      desde: null,
      xp_total: null,
      sequencia_atual: -3,
      maior_sequencia: null,
      licoes_concluidas: null,
    });
    expect(p.apelido).toBe('Amigo');
    expect(p.desde).toBeNull();
    expect(p.xpTotal).toBe(0);
    expect(p.sequenciaAtual).toBe(0);
    expect(p.maiorSequencia).toBe(0);
    expect(p.licoesConcluidas).toBe(0);
  });

  it('marca insígnias como obtidas e nunca como novas', () => {
    const p = mapearPerfilAmigo({
      ...base,
      insignias: [{ id: 'i1', codigo: 'c', categoria: 'marco', valor: 7, nome: 'Uma semana', descricao: null, icone: null }],
    });
    expect(p.insignias).toEqual([
      { id: 'i1', codigo: 'c', categoria: 'marco', valor: 7, nome: 'Uma semana', descricao: null, icone: null, obtida: true, nova: false },
    ]);
  });

  it('descarta itens malformados e categoria desconhecida vira conquista', () => {
    const p = mapearPerfilAmigo({
      ...base,
      insignias: [null, 'x', { id: 1, nome: 'a' }, { id: 'i2', nome: 'B', categoria: '???' }],
    });
    expect(p.insignias).toHaveLength(1);
    expect(p.insignias[0].categoria).toBe('conquista');
  });

  it('insignias que não é lista vira lista vazia', () => {
    expect(mapearPerfilAmigo({ ...base, insignias: { a: 1 } }).insignias).toEqual([]);
  });
});

describe('rótulos', () => {
  it('singular e plural', () => {
    expect(rotuloDias(1)).toBe('1 dia');
    expect(rotuloDias(0)).toBe('0 dias');
    expect(rotuloLicoes(1)).toBe('1 lição');
    expect(rotuloLicoes(12)).toBe('12 lições');
  });
});
