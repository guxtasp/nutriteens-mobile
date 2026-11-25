// src/features/adolescente/vitaminas/utils/__tests__/testeRapido.test.ts
import { NUTRIENTES_INFO } from '../../data/nutrientesInfo';
import { FONTE_CERTA } from '../../data/perguntasNutriente';
import {
  deNutriente,
  embaralhar,
  estadoDaOpcao,
  filtrarNutrientes,
  nomeEmFrase,
  perguntasDoNutriente,
} from '../testeRapido';

describe('dados novos de nutrientesInfo', () => {
  it('os 13 nutrientes têm resumo e superpoder curtos', () => {
    expect(NUTRIENTES_INFO).toHaveLength(13);
    for (const n of NUTRIENTES_INFO) {
      expect(n.resumo.length).toBeGreaterThan(0);
      expect(n.resumo.length).toBeLessThanOrEqual(45);
      expect(n.superpoder.length).toBeGreaterThan(0);
    }
  });
  it('combo, quando existe, tem dois alimentos diferentes', () => {
    for (const n of NUTRIENTES_INFO.filter((x) => x.combo)) {
      expect(n.combo).toHaveLength(2);
      expect(n.combo![0]).not.toBe(n.combo![1]);
    }
    expect(NUTRIENTES_INFO.filter((x) => x.combo).map((x) => x.chave).sort()).toEqual(['ferro', 'vitamina_c']);
  });
  it('nenhum texto novo fala de caloria ou peso', () => {
    for (const n of NUTRIENTES_INFO) {
      const t = `${n.resumo} ${n.superpoder}`.toLowerCase();
      expect(t).not.toMatch(/caloria|peso|emagrec|dieta/);
    }
  });
});

describe('filtrarNutrientes', () => {
  it('abas Todos / Vitaminas / Minerais', () => {
    expect(filtrarNutrientes(NUTRIENTES_INFO, 'TODOS')).toHaveLength(13);
    expect(filtrarNutrientes(NUTRIENTES_INFO, 'VITAMINA').every((n) => n.tipo === 'VITAMINA')).toBe(true);
    expect(filtrarNutrientes(NUTRIENTES_INFO, 'VITAMINA')).toHaveLength(7);
    expect(filtrarNutrientes(NUTRIENTES_INFO, 'MINERAL')).toHaveLength(6);
  });
});

describe('textos de apoio', () => {
  it('nomeEmFrase e deNutriente', () => {
    expect(nomeEmFrase('Vitamina A')).toBe('vitamina A');
    expect(deNutriente({ nome: 'Vitamina C', tipo: 'VITAMINA' })).toBe('da vitamina C');
    expect(deNutriente({ nome: 'Ferro', tipo: 'MINERAL' })).toBe('do ferro');
  });
});

describe('embaralhar', () => {
  it('é estável para a mesma semente e não perde itens', () => {
    const a = embaralhar([1, 2, 3, 4], 'x');
    expect(embaralhar([1, 2, 3, 4], 'x')).toEqual(a);
    expect([...a].sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('perguntasDoNutriente', () => {
  it('todo nutriente tem fonte certa definida', () => {
    for (const n of NUTRIENTES_INFO) expect(FONTE_CERTA[n.chave as keyof typeof FONTE_CERTA]).toBeTruthy();
  });

  it('3 perguntas, 4 opções diferentes e exatamente uma certa, em todos os nutrientes', () => {
    for (const n of NUTRIENTES_INFO) {
      const ps = perguntasDoNutriente(n.chave)!;
      expect(ps).toHaveLength(3);
      for (const p of ps) {
        expect(p.opcoes).toHaveLength(4);
        expect(new Set(p.opcoes).size).toBe(4);
        expect(p.opcoes.filter((o) => o === p.certa)).toHaveLength(1);
        expect(p.explicacao.length).toBeGreaterThan(0);
      }
    }
  });

  it('a fonte certa aparece na dica ou no combo do nutriente (o teste não afirma nada novo)', () => {
    for (const n of NUTRIENTES_INFO) {
      const fonte = perguntasDoNutriente(n.chave)![1].certa.toLowerCase();
      const palavra = n.chave === 'vitamina_d' ? 'sol' : fonte.slice(0, 5);
      expect(`${n.dica} ${(n.combo ?? []).join(' ')}`.toLowerCase()).toContain(palavra);
    }
  });

  it('chave sem página devolve null', () => {
    expect(perguntasDoNutriente('proteina')).toBeNull();
  });
});

describe('estadoDaOpcao', () => {
  it('nunca marca "errado": a escolhida fica amarela e a certa verde', () => {
    expect(estadoDaOpcao('A', 'A', null)).toBe('neutra');
    expect(estadoDaOpcao('A', 'A', 'B')).toBe('certa');
    expect(estadoDaOpcao('B', 'A', 'B')).toBe('escolhidaOutra');
    expect(estadoDaOpcao('C', 'A', 'B')).toBe('neutra');
  });
});
