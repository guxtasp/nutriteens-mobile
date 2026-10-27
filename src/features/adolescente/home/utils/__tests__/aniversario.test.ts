import {
  analisarAniversario,
  montarMensagemAniversario,
  CORPOS_NO_DIA,
  CORPOS_ATRASADOS,
  JANELA_ATRASO_DIAS,
} from '../aniversario';

describe('analisarAniversario', () => {
  it('celebra no próprio dia', () => {
    expect(analisarAniversario('2010-10-27', '2026-10-27')).toEqual({ celebrar: true, ano: 2026, diasDeAtraso: 0 });
  });

  it('não celebra antes do dia nem muito depois da janela', () => {
    expect(analisarAniversario('2010-10-27', '2026-10-26').celebrar).toBe(false);
    expect(analisarAniversario('2010-10-27', '2026-01-15').celebrar).toBe(false);
    expect(analisarAniversario('2010-10-27', '2026-10-31').celebrar).toBe(false); // 4 dias depois
  });

  it('celebra atrasado dentro da janela, informando o atraso', () => {
    expect(analisarAniversario('2010-10-27', '2026-10-28')).toEqual({ celebrar: true, ano: 2026, diasDeAtraso: 1 });
    expect(analisarAniversario('2010-10-27', '2026-10-30')).toEqual({
      celebrar: true,
      ano: 2026,
      diasDeAtraso: JANELA_ATRASO_DIAS,
    });
  });

  it('atravessa a virada de ano: nasceu em 31/12 e abriu o app em 02/01', () => {
    expect(analisarAniversario('2010-12-31', '2027-01-02')).toEqual({ celebrar: true, ano: 2026, diasDeAtraso: 2 });
  });

  it('atravessa a virada de mês', () => {
    expect(analisarAniversario('2010-01-30', '2026-02-02')).toEqual({ celebrar: true, ano: 2026, diasDeAtraso: 3 });
  });

  it('29/02: celebra em 28/02 nos anos não bissextos', () => {
    expect(analisarAniversario('2012-02-29', '2027-02-28')).toEqual({ celebrar: true, ano: 2027, diasDeAtraso: 0 });
    // 01/03 de ano não bissexto é 1 dia de atraso do aniversário de 28/02
    expect(analisarAniversario('2012-02-29', '2027-03-01')).toEqual({ celebrar: true, ano: 2027, diasDeAtraso: 1 });
  });

  it('29/02: celebra em 29/02 nos anos bissextos (e não em 28/02)', () => {
    expect(analisarAniversario('2012-02-29', '2028-02-29')).toEqual({ celebrar: true, ano: 2028, diasDeAtraso: 0 });
    expect(analisarAniversario('2012-02-29', '2028-02-28').celebrar).toBe(false);
  });

  it('não celebra no ano de nascimento nem antes dele', () => {
    expect(analisarAniversario('2026-10-27', '2026-10-27').celebrar).toBe(false);
    expect(analisarAniversario('2026-12-31', '2027-01-02').celebrar).toBe(false); // 1º aniversário seria só em 2027-12-31
  });

  it('data de nascimento nula, vazia ou inválida não celebra', () => {
    expect(analisarAniversario(null, '2026-10-27').celebrar).toBe(false);
    expect(analisarAniversario(undefined, '2026-10-27').celebrar).toBe(false);
    expect(analisarAniversario('', '2026-10-27').celebrar).toBe(false);
    expect(analisarAniversario('27/10/2010', '2026-10-27').celebrar).toBe(false);
    expect(analisarAniversario('2010-02-31', '2026-03-03').celebrar).toBe(false);
  });

  it('aceita timestamp ISO usando só a parte da data (sem deslocar o dia pelo fuso)', () => {
    expect(analisarAniversario('2010-10-27T00:00:00+00:00', '2026-10-27')).toEqual({
      celebrar: true,
      ano: 2026,
      diasDeAtraso: 0,
    });
  });
});

describe('montarMensagemAniversario', () => {
  it('usa o nome no título e o corpo do dia', () => {
    const msg = montarMensagemAniversario('Ana', 0, 'user-1:2026');
    expect(msg.titulo).toBe('Feliz aniversário, Ana!');
    expect(CORPOS_NO_DIA).toContain(msg.corpo);
  });

  it('usa o corpo e o título de aniversário atrasado quando passou do dia', () => {
    const msg = montarMensagemAniversario('Ana', 2, 'user-1:2026');
    expect(msg.titulo).toBe('Feliz aniversário atrasado, Ana!');
    expect(CORPOS_ATRASADOS).toContain(msg.corpo);
  });

  it('funciona sem nome', () => {
    expect(montarMensagemAniversario(null, 0, 's').titulo).toBe('Feliz aniversário!');
    expect(montarMensagemAniversario('   ', 0, 's').titulo).toBe('Feliz aniversário!');
    expect(montarMensagemAniversario(undefined, 1, 's').titulo).toBe('Feliz aniversário atrasado!');
  });

  it('é determinística pela semente', () => {
    expect(montarMensagemAniversario('Ana', 0, 'user-1:2026')).toEqual(montarMensagemAniversario('Ana', 0, 'user-1:2026'));
  });

  it('varia o corpo conforme a semente (todas as mensagens são alcançáveis)', () => {
    const vistos = new Set<string>();
    for (let i = 0; i < 200; i++) vistos.add(montarMensagemAniversario('Ana', 0, `user:${i}`).corpo);
    expect(vistos.size).toBe(CORPOS_NO_DIA.length);
  });

  it('as mensagens não falam de comida, corpo, merecimento nem idade', () => {
    const proibido = /bolo|doce|comer|comid|peso|corpo|merece|\bidade\b|\banos\b/i;
    for (const texto of [...CORPOS_NO_DIA, ...CORPOS_ATRASADOS]) {
      expect(texto).not.toMatch(proibido);
    }
  });
});
