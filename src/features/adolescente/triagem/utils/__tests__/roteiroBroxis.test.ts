// src/features/adolescente/triagem/utils/__tests__/roteiroBroxis.test.ts
import { NO_FINAL, ROTEIRO_BROXIS, type NoRoteiro } from '../../data/roteiroBroxis';
import { caminhosDoRoteiro, falaDoNo, tempoDigitacao, validarRoteiro } from '../roteiroBroxis';

describe('roteiro do Bróxis', () => {
  it('não tem problemas: todo próximo existe, sem nó órfão, sem beco e sem ciclo', () => {
    expect(validarRoteiro()).toEqual([]);
  });

  it('todo caminho termina em "bora"', () => {
    const caminhos = caminhosDoRoteiro();
    expect(caminhos.length).toBeGreaterThan(0);
    for (const c of caminhos) expect(c[c.length - 1]).toBe(NO_FINAL);
  });

  it('cobre os 4 caminhos possíveis (oi/quem × bora/porque)', () => {
    expect(caminhosDoRoteiro()).toHaveLength(4);
  });

  it('só o nó final é marcado como final', () => {
    for (const [id, no] of Object.entries(ROTEIRO_BROXIS)) expect(!!no.final).toBe(id === NO_FINAL);
  });

  it('códigos de analytics são curtos e sem espaço', () => {
    for (const no of Object.values(ROTEIRO_BROXIS)) {
      for (const o of no.opcoes) expect(o.codigo).toMatch(/^[a-z_]{1,20}$/);
    }
  });

  it('detecta próximo inexistente, órfão e beco sem saída', () => {
    const quebrado: Record<string, NoRoteiro> = {
      inicio: { mensagens: [], opcoes: [{ rotulo: 'x', proximo: 'nao_existe' as never, codigo: 'x' }] },
      solto: { mensagens: [], opcoes: [] },
      bora: { mensagens: [], opcoes: [], final: true },
    };
    const tipos = validarRoteiro(quebrado).map((p) => `${p.tipo}:${p.no}`);
    expect(tipos).toEqual(expect.arrayContaining(['proximo_inexistente:inicio', 'no_orfao:solto', 'sem_saida:solto']));
  });

  it('detecta ciclo', () => {
    const ciclico: Record<string, NoRoteiro> = {
      inicio: { mensagens: [], opcoes: [], seguir: 'a' as never },
      a: { mensagens: [], opcoes: [], seguir: 'inicio' as never },
      bora: { mensagens: [], opcoes: [], final: true },
    };
    expect(validarRoteiro(ciclico).some((p) => p.tipo === 'ciclo')).toBe(true);
  });
});

describe('falaDoNo', () => {
  it('"oi" encadeia o combinado e termina nas respostas dele', () => {
    const f = falaDoNo('oi');
    expect(f.mensagens[0]).toEqual({ tipo: 'broxis', texto: 'Que bom te ver por aqui!' });
    expect(f.mensagens.some((m) => m.tipo === 'cartao' && m.cartao === 'como_vai_ser')).toBe(true);
    expect(f.opcoes.map((o) => o.proximo)).toEqual(['bora', 'porque']);
    expect(f.final).toBe(false);
  });

  it('"bora" é o fim, sem respostas', () => {
    const f = falaDoNo('bora');
    expect(f.final).toBe(true);
    expect(f.opcoes).toEqual([]);
  });

  it('"porque" traz o cartão de privacidade', () => {
    expect(falaDoNo('porque').mensagens.some((m) => m.tipo === 'cartao' && m.cartao === 'privacidade')).toBe(true);
  });
});

describe('tempoDigitacao', () => {
  it('cresce com o tamanho e para em 1500 ms', () => {
    expect(tempoDigitacao({ tipo: 'broxis', texto: 'oi' }, false)).toBe(528);
    expect(tempoDigitacao({ tipo: 'broxis', texto: 'x'.repeat(500) }, false)).toBe(1500);
  });
  it('reduzir movimento usa espera curta para tudo', () => {
    expect(tempoDigitacao({ tipo: 'broxis', texto: 'x'.repeat(500) }, true)).toBe(300);
    expect(tempoDigitacao({ tipo: 'cartao', cartao: 'privacidade' }, true)).toBe(300);
  });
  it('cartão tem tempo fixo', () => {
    expect(tempoDigitacao({ tipo: 'cartao', cartao: 'como_vai_ser' }, false)).toBe(900);
  });
});
