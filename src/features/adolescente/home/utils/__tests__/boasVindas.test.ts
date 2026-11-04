import {
  ehPrimeiroAcessoRecente,
  montarMensagemBoasVindas,
  JANELA_BOAS_VINDAS_DIAS,
  PASSOS_BOAS_VINDAS,
} from '../boasVindas';

describe('ehPrimeiroAcessoRecente', () => {
  it('vale no próprio dia da criação da conta', () => {
    expect(ehPrimeiroAcessoRecente('2026-11-03', '2026-11-03')).toBe(true);
  });

  it('vale até o limite da janela e não depois', () => {
    expect(ehPrimeiroAcessoRecente('2026-11-03', '2026-11-06')).toBe(true); // 3 dias
    expect(JANELA_BOAS_VINDAS_DIAS).toBe(3);
    expect(ehPrimeiroAcessoRecente('2026-11-03', '2026-11-07')).toBe(false); // 4 dias
  });

  it('atravessa a virada de mês e de ano', () => {
    expect(ehPrimeiroAcessoRecente('2026-10-31', '2026-11-02')).toBe(true);
    expect(ehPrimeiroAcessoRecente('2026-12-31', '2027-01-02')).toBe(true);
  });

  it('quem já usa o app há tempos nunca vê', () => {
    expect(ehPrimeiroAcessoRecente('2026-01-10', '2026-11-03')).toBe(false);
  });

  it('conta "criada no futuro" não vale', () => {
    expect(ehPrimeiroAcessoRecente('2026-11-05', '2026-11-03')).toBe(false);
  });

  it('datas nulas, vazias ou inválidas não valem', () => {
    expect(ehPrimeiroAcessoRecente(null, '2026-11-03')).toBe(false);
    expect(ehPrimeiroAcessoRecente('2026-11-03', undefined)).toBe(false);
    expect(ehPrimeiroAcessoRecente('', '2026-11-03')).toBe(false);
    expect(ehPrimeiroAcessoRecente('03/11/2026', '2026-11-03')).toBe(false);
    expect(ehPrimeiroAcessoRecente('2026-02-31', '2026-03-03')).toBe(false);
  });
});

describe('montarMensagemBoasVindas', () => {
  it('usa o primeiro nome na saudação', () => {
    expect(montarMensagemBoasVindas('Ana').saudacao).toBe('Oi, Ana!');
  });

  it('sem nome (null, vazio ou só espaços) cai na saudação simples', () => {
    expect(montarMensagemBoasVindas(null).saudacao).toBe('Oi!');
    expect(montarMensagemBoasVindas('').saudacao).toBe('Oi!');
    expect(montarMensagemBoasVindas('   ').saudacao).toBe('Oi!');
  });

  it('traz título, corpo, botão e os passos', () => {
    const m = montarMensagemBoasVindas('Ana');
    expect(m.titulo.length).toBeGreaterThan(0);
    expect(m.corpo.length).toBeGreaterThan(0);
    expect(m.textoBotao.length).toBeGreaterThan(0);
    expect(m.passos).toBe(PASSOS_BOAS_VINDAS);
    expect(m.passos).toHaveLength(3);
  });

  it('não cita comida, corpo, peso nem idade', () => {
    const m = montarMensagemBoasVindas('Ana');
    const texto = [m.saudacao, m.titulo, m.corpo, ...m.passos.flatMap((p) => [p.titulo, p.legenda])]
      .join(' ')
      .toLowerCase();
    for (const proibida of ['comida', 'peso', 'corpo', 'dieta', 'emagrec', 'gordur', 'anos']) {
      expect(texto).not.toContain(proibida);
    }
  });
});
