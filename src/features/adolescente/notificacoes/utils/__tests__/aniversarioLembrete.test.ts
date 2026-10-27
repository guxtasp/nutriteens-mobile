import { CONFIG_PADRAO, type ConfigLembretes, type LembretePlanejado } from '../escolherLembrete';
import { combinarComJornada } from '../jornadaSemanal';
import {
  HORA_ANIVERSARIO,
  JANELA_AGENDAMENTO_DIAS,
  planejarAniversario,
  type EntradaAniversario,
} from '../aniversarioLembrete';
import { MENSAGENS_LEMBRETE } from '../../data/mensagensLembrete';
import { proximoAniversario } from '../../../home/utils/aniversario';

// terça-feira, 27/out/2026, 8h (horário local do ambiente de teste)
const AGORA = new Date(2026, 9, 27, 8, 0, 0);

const entrada = (o: Partial<EntradaAniversario> = {}): EntradaAniversario => ({
  agora: AGORA,
  config: CONFIG_PADRAO,
  dataNascimento: '2010-10-30', // daqui a 3 dias
  hojeISO: '2026-10-27',
  anosCelebrados: [],
  ...o,
});

describe('proximoAniversario', () => {
  it('hoje conta (diasAte 0) e devolve o dia certo', () => {
    expect(proximoAniversario('2010-10-27', '2026-10-27')).toEqual({ ano: 2026, mes: 10, dia: 27, diasAte: 0 });
  });

  it('já passou neste ano: vai para o ano seguinte', () => {
    expect(proximoAniversario('2010-10-20', '2026-10-27')).toEqual({ ano: 2027, mes: 10, dia: 20, diasAte: 358 });
  });

  it('29/02 cai em 28/02 nos anos não bissextos e em 29/02 nos bissextos', () => {
    expect(proximoAniversario('2012-02-29', '2027-01-10')).toEqual({ ano: 2027, mes: 2, dia: 28, diasAte: 49 });
    expect(proximoAniversario('2012-02-29', '2028-01-10')).toEqual({ ano: 2028, mes: 2, dia: 29, diasAte: 50 });
  });

  it('não existe aniversário no ano de nascimento; dados inválidos devolvem null', () => {
    expect(proximoAniversario('2026-12-31', '2026-10-27')).toEqual({ ano: 2027, mes: 12, dia: 31, diasAte: 430 });
    expect(proximoAniversario(null, '2026-10-27')).toBeNull();
    expect(proximoAniversario('abc', '2026-10-27')).toBeNull();
  });
});

describe('planejarAniversario', () => {
  it('agenda para a data do aniversário na hora combinada', () => {
    expect(planejarAniversario(entrada())).toEqual({
      quando: new Date(2026, 9, 30, HORA_ANIVERSARIO, 0),
      tipo: 'aniversario',
    });
  });

  it('no próprio dia, antes das 9h, agenda para hoje', () => {
    const r = planejarAniversario(entrada({ dataNascimento: '2010-10-27' }));
    expect(r?.quando).toEqual(new Date(2026, 9, 27, HORA_ANIVERSARIO, 0));
  });

  it('no próprio dia, depois das 9h, não agenda (o modal da Home cuida)', () => {
    const tarde = new Date(2026, 9, 27, 10, 0);
    expect(planejarAniversario(entrada({ agora: tarde, dataNascimento: '2010-10-27' }))).toBeNull();
  });

  it('faltando menos de 5 min para as 9h, não agenda', () => {
    const quase = new Date(2026, 9, 27, 8, 57);
    expect(planejarAniversario(entrada({ agora: quase, dataNascimento: '2010-10-27' }))).toBeNull();
  });

  it('só agenda dentro da janela de dias', () => {
    // 14 dias: 10/nov
    expect(planejarAniversario(entrada({ dataNascimento: '2010-11-10' }))).not.toBeNull();
    // 15 dias: 11/nov
    expect(JANELA_AGENDAMENTO_DIAS).toBe(14);
    expect(planejarAniversario(entrada({ dataNascimento: '2010-11-11' }))).toBeNull();
  });

  it('já celebrou dentro do app neste ano: não avisa de novo', () => {
    expect(planejarAniversario(entrada({ dataNascimento: '2010-10-27', anosCelebrados: [2026] }))).toBeNull();
  });

  it('virada de ano: aniversário em 02/01 agenda para o ano seguinte', () => {
    const fim = new Date(2026, 11, 28, 12, 0);
    const r = planejarAniversario(entrada({ agora: fim, hojeISO: '2026-12-28', dataNascimento: '2010-01-02' }));
    expect(r?.quando).toEqual(new Date(2027, 0, 2, HORA_ANIVERSARIO, 0));
    // celebrado em 2026 (outro aniversário) não bloqueia o de 2027
    const r2 = planejarAniversario(
      entrada({ agora: fim, hojeISO: '2026-12-28', dataNascimento: '2010-01-02', anosCelebrados: [2026] }),
    );
    expect(r2).not.toBeNull();
  });

  it('respeita a chave geral e o interruptor próprio (ausente conta como ligado)', () => {
    const desligadoGeral: ConfigLembretes = { ...CONFIG_PADRAO, ativado: false };
    const desligadoProprio: ConfigLembretes = { ...CONFIG_PADRAO, aniversario: false };
    const antigo: ConfigLembretes = { ...CONFIG_PADRAO };
    delete antigo.aniversario;
    expect(planejarAniversario(entrada({ config: desligadoGeral }))).toBeNull();
    expect(planejarAniversario(entrada({ config: desligadoProprio }))).toBeNull();
    expect(planejarAniversario(entrada({ config: antigo }))).not.toBeNull();
  });

  it('sem data de nascimento válida, não agenda', () => {
    expect(planejarAniversario(entrada({ dataNascimento: null }))).toBeNull();
    expect(planejarAniversario(entrada({ dataNascimento: '31/10/2010' }))).toBeNull();
  });
});

describe('aniversário na combinação com o plano', () => {
  it('toma o lugar de qualquer outro lembrete do mesmo dia e mantém os demais', () => {
    const aniv: LembretePlanejado = { quando: new Date(2026, 9, 30, 9, 0), tipo: 'aniversario' };
    const plano: LembretePlanejado[] = [
      { quando: new Date(2026, 9, 29, 17, 30), tipo: 'agua' },
      { quando: new Date(2026, 9, 30, 17, 30), tipo: 'missao' },
      { quando: new Date(2026, 9, 31, 17, 30), tipo: 'trilha' },
    ];
    expect(combinarComJornada(plano, aniv).map((p) => p.tipo)).toEqual(['agua', 'aniversario', 'trilha']);
  });
});

describe('mensagens de notificação de aniversário', () => {
  const msgs = MENSAGENS_LEMBRETE.filter((m) => m.tipo === 'aniversario');

  it('existem, abrem a Home e não citam idade, comida, corpo nem merecimento', () => {
    expect(msgs.length).toBeGreaterThanOrEqual(2);
    for (const m of msgs) {
      expect(m.destino).toBe('Home');
      expect(`${m.titulo} ${m.texto}`).not.toMatch(/bolo|doce|comer|comid|peso|corpo|merece|\bidade\b|\banos\b/i);
    }
  });
});
