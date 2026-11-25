import {
  JANELA_PRIMEIROS_PASSOS_DIAS,
  NENHUM_PASSO_FEITO,
  PASSOS_BASE,
  dentroDaJanelaPrimeirosPassos,
  resumirPrimeirosPassos,
  rotuloBotaoPassos,
  textoProgressoPassos,
} from '../primeirosPassos';

describe('resumirPrimeirosPassos', () => {
  it('sem nada feito: 0 de 5, próximo é o primeiro da lista', () => {
    const r = resumirPrimeirosPassos(NENHUM_PASSO_FEITO);
    expect(r.feitos).toBe(0);
    expect(r.total).toBe(PASSOS_BASE.length);
    expect(r.fracao).toBe(0);
    expect(r.completo).toBe(false);
    expect(r.proximo?.id).toBe('agua');
  });

  it('o próximo é o primeiro PENDENTE, mesmo com passos feitos fora de ordem', () => {
    const r = resumirPrimeirosPassos({ agua: true, refeicao: true });
    expect(r.feitos).toBe(2);
    expect(r.proximo?.id).toBe('atividade');
    expect(r.passos.find((p) => p.id === 'refeicao')?.feito).toBe(true);
  });

  it('tudo feito: completo, sem próximo, fração 1', () => {
    const r = resumirPrimeirosPassos({ agua: true, atividade: true, refeicao: true, licao: true, amigo: true });
    expect(r.completo).toBe(true);
    expect(r.proximo).toBeNull();
    expect(r.fracao).toBe(1);
  });

  it('só true conta como feito (undefined/ausente não)', () => {
    expect(resumirPrimeirosPassos({}).feitos).toBe(0);
  });

  it('todo passo aponta para uma rota diferente e existente na lista', () => {
    const rotas = PASSOS_BASE.map((p) => p.rota);
    expect(new Set(rotas).size).toBe(rotas.length);
  });
});

describe('textos do cartão', () => {
  it('progresso', () => {
    expect(textoProgressoPassos({ feitos: 3, total: 5, completo: false })).toBe('3 de 5 feitos');
    expect(textoProgressoPassos({ feitos: 5, total: 5, completo: true })).toBe('Tudo feito!');
  });

  it('botão: "Começar" no zero, "Próximo passo" depois, "Continuar" sem pendência', () => {
    const base = resumirPrimeirosPassos(NENHUM_PASSO_FEITO);
    expect(rotuloBotaoPassos(base)).toBe('Começar');
    expect(rotuloBotaoPassos(resumirPrimeirosPassos({ agua: true }))).toBe('Próximo passo');
    expect(rotuloBotaoPassos({ feitos: 5, proximo: null })).toBe('Continuar');
  });
});

describe('dentroDaJanelaPrimeirosPassos', () => {
  it('vale no dia da criação e até o limite, não depois', () => {
    expect(dentroDaJanelaPrimeirosPassos('2026-11-03', '2026-11-03')).toBe(true);
    expect(dentroDaJanelaPrimeirosPassos('2026-11-03', '2026-11-17')).toBe(true); // 14 dias
    expect(JANELA_PRIMEIROS_PASSOS_DIAS).toBe(14);
    expect(dentroDaJanelaPrimeirosPassos('2026-11-03', '2026-11-18')).toBe(false); // 15 dias
  });

  it('atravessa virada de mês e de ano', () => {
    expect(dentroDaJanelaPrimeirosPassos('2026-12-25', '2027-01-05')).toBe(true);
  });

  it('conta antiga, futura ou datas inválidas não valem', () => {
    expect(dentroDaJanelaPrimeirosPassos('2026-01-10', '2026-11-03')).toBe(false);
    expect(dentroDaJanelaPrimeirosPassos('2026-11-05', '2026-11-03')).toBe(false);
    expect(dentroDaJanelaPrimeirosPassos(null, '2026-11-03')).toBe(false);
    expect(dentroDaJanelaPrimeirosPassos('2026-02-31', '2026-03-01')).toBe(false);
  });
});

describe('passosRecemFeitos e falaPrimeirosPassos', () => {
  const { passosRecemFeitos, falaPrimeirosPassos } = require('../primeirosPassos');
  it('só aponta o que virou feito agora', () => {
    const antes = [{ id: 'agua', feito: true }, { id: 'atividade', feito: false }, { id: 'refeicao', feito: false }];
    const depois = [{ id: 'agua', feito: true }, { id: 'atividade', feito: true }, { id: 'refeicao', feito: false }];
    expect(passosRecemFeitos(antes, depois)).toEqual(['atividade']);
    expect(passosRecemFeitos(null, depois)).toEqual([]);
    expect(passosRecemFeitos(depois, depois)).toEqual([]);
  });
  it('fala comemora sem cobrar', () => {
    expect(falaPrimeirosPassos({ feitos: 4, total: 5, completo: false }, true)).toMatch(/Só mais um/);
    expect(falaPrimeirosPassos({ feitos: 2, total: 5, completo: false }, true)).toMatch(/Faltam 3/);
    expect(falaPrimeirosPassos({ feitos: 0, total: 5, completo: false }, false)).toMatch(/coisinha/);
    expect(falaPrimeirosPassos({ feitos: 5, total: 5, completo: true }, false)).toMatch(/orgulhoso/);
  });
});
