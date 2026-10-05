import {
  AlimentoPrato,
  CriterioPrato,
  avaliarPrato,
  normalizarCapacidade,
  posicoesDosSlots,
  primeiroSlotLivre,
} from '../prato';

const a = (id: string, grupo: string): AlimentoPrato => ({ id, nome: id, emoji: '🍽️', grupo });

const criterios: CriterioPrato[] = [
  { id: 'c1', texto: 'Uma fonte de energia', grupos: ['cereal', 'tuberculo'], minimo: 1 },
  { id: 'c2', texto: 'Uma verdura', grupos: ['vegetal'], minimo: 1 },
  { id: 'c3', texto: 'Até 1 ultraprocessado', grupos: ['ultraprocessado'], maximo: 1 },
];

describe('prato', () => {
  it('prato vazio não está completo, mas o critério só de limite começa ok', () => {
    const r = avaliarPrato([], criterios);
    expect(r.completo).toBe(false);
    expect(r.status.map((s) => s.atendido)).toEqual([false, false, true]);
    expect(r.status[2].soLimite).toBe(true);
  });

  it('completa quando todos os critérios batem e há itens suficientes', () => {
    const r = avaliarPrato([a('arroz', 'cereal'), a('alface', 'vegetal'), a('ovo', 'proteina')], criterios);
    expect(r.criteriosOk).toBe(true);
    expect(r.completo).toBe(true);
  });

  it('qualquer grupo da lista conta pro critério', () => {
    const r = avaliarPrato([a('batata', 'tuberculo'), a('alface', 'vegetal'), a('ovo', 'proteina')], criterios);
    expect(r.status[0].atendido).toBe(true);
  });

  it('estourar o limite desfaz o critério sem travar nada de forma permanente', () => {
    const base = [a('arroz', 'cereal'), a('alface', 'vegetal')];
    const estourou = avaliarPrato([...base, a('refri', 'ultraprocessado'), a('chips', 'ultraprocessado')], criterios);
    expect(estourou.status[2].excedeu).toBe(true);
    expect(estourou.completo).toBe(false);
    const ok = avaliarPrato([...base, a('refri', 'ultraprocessado')], criterios);
    expect(ok.completo).toBe(true);
  });

  it('respeita o mínimo de itens mesmo com os critérios cumpridos', () => {
    const so2 = [a('arroz', 'cereal'), a('alface', 'vegetal')];
    expect(avaliarPrato(so2, criterios, 3).completo).toBe(false);
    expect(avaliarPrato(so2, criterios, 2).completo).toBe(true);
  });

  it('critério com mínimo 2 só bate com dois alimentos do grupo', () => {
    const c: CriterioPrato[] = [{ id: 'f', texto: 'Duas frutas', grupos: ['fruta'], minimo: 2 }];
    expect(avaliarPrato([a('banana', 'fruta')], c, 1).completo).toBe(false);
    expect(avaliarPrato([a('banana', 'fruta'), a('maca', 'fruta')], c, 1).completo).toBe(true);
  });

  it('sem critérios (prato livre), basta o mínimo de itens', () => {
    expect(avaliarPrato([a('x', 'g'), a('y', 'g')], [], 3).completo).toBe(false);
    expect(avaliarPrato([a('x', 'g'), a('y', 'g'), a('z', 'g')], [], 3).completo).toBe(true);
  });

  it('capacidade fica entre 3 e 7, com padrão 6', () => {
    expect(normalizarCapacidade(undefined)).toBe(6);
    expect(normalizarCapacidade(1)).toBe(3);
    expect(normalizarCapacidade(20)).toBe(7);
    expect(normalizarCapacidade(5)).toBe(5);
  });

  it('distribui os lugares em círculo, começando pelo topo', () => {
    const pos = posicoesDosSlots(4);
    expect(pos).toHaveLength(4);
    expect(pos[0].x).toBeCloseTo(0);
    expect(pos[0].y).toBeCloseTo(-1);
    expect(pos[2].y).toBeCloseTo(1);
  });

  it('acha o primeiro lugar livre e devolve null quando o prato enche', () => {
    expect(primeiroSlotLivre([], 5)).toBe(0);
    expect(primeiroSlotLivre([0, 1, 3], 5)).toBe(2);
    expect(primeiroSlotLivre([0, 1, 2, 3, 4], 5)).toBeNull();
  });
});
