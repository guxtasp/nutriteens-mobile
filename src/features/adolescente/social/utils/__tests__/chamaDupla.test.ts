import { mensagemAviso, mensagemConvite, textoProgressoHoje, mapearChamaDupla, proximoLembrete, ehHoraDoLembrete } from '../chamaDupla';

const base = {
  id: '1', situacao: 'ativa' as const, amizade_id: 'a', apelido: 'Lia', avatar: null,
  sequencia_atual: 4, maior_sequencia: 4, vidas_restantes: 2,
  eu_fiz_hoje: false, dupla_fez_hoje: false, concluida_hoje: false, aviso: null,
};

describe('chamaDupla', () => {
  it('aviso de fim é neutro e não cita ninguém', () => {
    expect(mensagemAviso('ENCERRADA', 3)).toBe('A sequência da dupla chegou ao fim! Que tal recomeçarem juntos hoje?');
  });
  it('aviso de vida usada não aponta culpado', () => {
    const m = mensagemAviso('VIDA_USADA', 1);
    expect(m).toContain('1 vida');
    expect(m.toLowerCase()).not.toMatch(/você não|ele não|ela não|falhou/);
  });
  it('mapeia apelido ausente', () => {
    expect(mapearChamaDupla({ ...base, apelido: null }).apelido).toBe('Amigo');
  });
  it('progresso de hoje é sempre positivo', () => {
    expect(textoProgressoHoje(mapearChamaDupla({ ...base, concluida_hoje: true }))).toContain('garantida');
    expect(textoProgressoHoje(mapearChamaDupla({ ...base, duplaFezHoje: true } as any))).toBeTruthy();
  });
  it('mensagem de convite enviado cita o apelido', () => {
    expect(mensagemConvite('enviado', 'Lia')).toContain('Lia');
  });

  it('hora do lembrete: só a partir das 19h', () => {
    expect(ehHoraDoLembrete(new Date(2026, 9, 7, 18, 59))).toBe(false);
    expect(ehHoraDoLembrete(new Date(2026, 9, 7, 19, 0))).toBe(true);
  });
  it('próximo lembrete: hoje às 19h antes do horário; amanhã se já passou ou concluída', () => {
    expect(proximoLembrete(new Date(2026, 9, 7, 10, 0), false)).toEqual(new Date(2026, 9, 7, 19, 0));
    expect(proximoLembrete(new Date(2026, 9, 7, 20, 0), false)).toEqual(new Date(2026, 9, 8, 19, 0));
    expect(proximoLembrete(new Date(2026, 9, 7, 10, 0), true)).toEqual(new Date(2026, 9, 8, 19, 0));
  });
});
