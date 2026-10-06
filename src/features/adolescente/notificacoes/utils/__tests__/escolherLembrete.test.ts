import {
  atualizarIgnoradas,
  CONFIG_PADRAO,
  ConfigLembretes,
  horaOrganica,
  PendentesHoje,
  planejarLembretes,
} from '../escolherLembrete';
import { escolherMensagem, MENSAGENS_LEMBRETE } from '../../data/mensagensLembrete';

const HORA = 3600 * 1000;
const DIA = 24 * HORA;

// segunda-feira, 5/out/2026, 9h (horário local do ambiente de teste)
const AGORA = new Date(2026, 9, 5, 9, 0, 0);

const TUDO_PENDENTE: PendentesHoje = { agua: true, alimentacao: true, trilha: true, missao: true, atividade: true };
const TUDO_FEITO: PendentesHoje = { agua: false, alimentacao: false, trilha: false, missao: false, atividade: false };

function plano(sobrescritas: Partial<Parameters<typeof planejarLembretes>[0]> = {}) {
  return planejarLembretes({
    agora: AGORA,
    config: CONFIG_PADRAO,
    pendentes: TUDO_PENDENTE,
    aberturas: [],
    ignoradasSeguidas: 0,
    ultimoPorTipo: {},
    ...sobrescritas,
  });
}

function dia(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

describe('planejarLembretes', () => {
  it('não agenda nada com os lembretes desligados', () => {
    const config: ConfigLembretes = { ...CONFIG_PADRAO, ativado: false };
    expect(plano({ config })).toEqual([]);
  });

  it('não agenda nada se todos os tipos estiverem desligados', () => {
    const config: ConfigLembretes = {
      ...CONFIG_PADRAO,
      tipos: { agua: false, alimentacao: false, trilha: false, missao: false, atividade: false },
    };
    expect(plano({ config })).toEqual([]);
  });

  it('no máximo 1 lembrete por dia por padrão', () => {
    const porDia = new Map<string, number>();
    for (const l of plano()) porDia.set(dia(l.quando), (porDia.get(dia(l.quando)) ?? 0) + 1);
    expect(Math.max(...Array.from(porDia.values()))).toBe(1);
  });

  it('usa 17h30 sem histórico, escolhe missão hoje e outro tipo amanhã', () => {
    const [hoje, amanha] = plano();
    expect(hoje.quando.getHours()).toBe(17);
    expect(hoje.quando.getMinutes()).toBe(30);
    expect(dia(hoje.quando)).toBe('2026-10-5');
    expect(hoje.tipo).toBe('missao');
    expect(dia(amanha.quando)).toBe('2026-10-6');
    expect(amanha.tipo).not.toBe('missao');
  });

  it('sem abrir o app, depois de hoje/amanhã só vem saudade (dias 3 e 6)', () => {
    const lista = plano();
    expect(lista.map((l) => l.tipo === 'saudade')).toEqual([false, false, true, true]);
    expect(dia(lista[2].quando)).toBe('2026-10-8');
    expect(dia(lista[3].quando)).toBe('2026-10-11');
  });

  it('se tudo já foi feito hoje, não manda nada hoje', () => {
    const lista = plano({ pendentes: TUDO_FEITO });
    expect(lista.some((l) => dia(l.quando) === '2026-10-5')).toBe(false);
    expect(dia(lista[0].quando)).toBe('2026-10-6');
  });

  it('hoje só considera o que está pendente', () => {
    const lista = plano({ pendentes: { ...TUDO_FEITO, agua: true } });
    expect(lista[0].tipo).toBe('agua');
  });

  it('não manda hoje se a pessoa abriu o app há menos de 3h do horário', () => {
    const agora = new Date(2026, 9, 5, 15, 0, 0);
    const lista = plano({ agora, ultimaAbertura: agora.getTime() });
    expect(lista.some((l) => dia(l.quando) === '2026-10-5')).toBe(false);
  });

  it('manda hoje se a última abertura foi há mais de 3h do horário', () => {
    const agora = new Date(2026, 9, 5, 14, 0, 0);
    const lista = plano({ agora, ultimaAbertura: agora.getTime() });
    expect(dia(lista[0].quando)).toBe('2026-10-5');
  });

  it('não agenda horário que já passou', () => {
    const agora = new Date(2026, 9, 5, 19, 0, 0);
    const lista = plano({ agora });
    expect(dia(lista[0].quando)).toBe('2026-10-6');
  });

  it('freio: com 3 ignoradas seguidas cai pra ~2 por semana', () => {
    const lista = plano({ ignoradasSeguidas: 3 });
    expect(lista).toHaveLength(2);
    expect(lista.map((l) => l.tipo === 'saudade')).toEqual([false, true]);
    expect(dia(lista[0].quando)).toBe('2026-10-7');
    expect(dia(lista[1].quando)).toBe('2026-10-10');
  });

  it('2 por dia (quando a pessoa pede) usa tipos diferentes em horários diferentes', () => {
    const config: ConfigLembretes = { ...CONFIG_PADRAO, porDia: 2 };
    const hoje = plano({ config }).filter((l) => dia(l.quando) === '2026-10-5');
    expect(hoje).toHaveLength(2);
    expect(hoje[0].tipo).not.toBe(hoje[1].tipo);
    expect(hoje[1].quando.getTime() - hoje[0].quando.getTime()).toBeGreaterThanOrEqual(3 * HORA);
  });

  it('com 2 por dia, o freio volta pra 1', () => {
    const config: ConfigLembretes = { ...CONFIG_PADRAO, porDia: 2 };
    expect(plano({ config, ignoradasSeguidas: 3 })).toHaveLength(2);
  });

  it('respeita os tipos desligados', () => {
    const config: ConfigLembretes = {
      ...CONFIG_PADRAO,
      tipos: { agua: true, alimentacao: false, trilha: false, missao: false, atividade: false },
    };
    const regulares = plano({ config }).filter((l) => l.tipo !== 'saudade');
    expect(regulares.every((l) => l.tipo === 'agua')).toBe(true);
  });

  it('prefere o tipo lembrado há mais tempo', () => {
    const ontem = AGORA.getTime() - DIA;
    const lista = plano({ ultimoPorTipo: { missao: ontem, alimentacao: ontem, atividade: ontem, agua: ontem - DIA } });
    // trilha nunca foi lembrada -> ganha de todos
    expect(lista[0].tipo).toBe('trilha');
  });
});

describe('horaOrganica', () => {
  const agora = AGORA.getTime();
  const abertoAs = (hora: number, minuto = 0) =>
    [1, 2, 3, 4, 5].map((d) => new Date(2026, 9, 5 - d, hora, minuto).getTime());

  it('sem histórico suficiente usa 17h30', () => {
    expect(horaOrganica([], agora)).toBe(17.5);
    expect(horaOrganica(abertoAs(19).slice(0, 2), agora)).toBe(17.5);
  });

  it('usa a mediana dos horários de abertura', () => {
    expect(horaOrganica(abertoAs(19, 30), agora)).toBe(19.5);
  });

  it('limita a uma janela razoável (nada de madrugada nem hora de aula)', () => {
    expect(horaOrganica(abertoAs(23), agora)).toBe(20.5);
    expect(horaOrganica(abertoAs(7), agora)).toBe(11);
  });

  it('ignora aberturas com mais de 30 dias', () => {
    const velhas = [40, 41, 42, 43].map((d) => agora - d * DIA);
    expect(horaOrganica(velhas, agora)).toBe(17.5);
  });
});

describe('atualizarIgnoradas', () => {
  const agora = new Date(2026, 9, 5, 21, 0).getTime();
  const lembreteAs = (hora: number, d = 0) => ({ quando: new Date(2026, 9, 5 - d, hora).getTime(), tipo: 'agua' as const });

  it('lembrete sem nenhuma abertura depois conta como ignorado', () => {
    const r = atualizarIgnoradas({ agendados: [lembreteAs(17)], aberturas: [], agora, ignoradasAntes: 0 });
    expect(r.ignoradasSeguidas).toBe(1);
    expect(r.agendadosPendentes).toEqual([]);
  });

  it('abrir o app até 3h depois conta como resposta e zera a contagem', () => {
    const r = atualizarIgnoradas({
      agendados: [lembreteAs(17)],
      aberturas: [new Date(2026, 9, 5, 18, 0).getTime()],
      agora,
      ignoradasAntes: 2,
    });
    expect(r.ignoradasSeguidas).toBe(0);
  });

  it('abrir só depois da janela de 3h não conta como resposta', () => {
    const r = atualizarIgnoradas({
      agendados: [lembreteAs(15)],
      aberturas: [new Date(2026, 9, 5, 20, 0).getTime()],
      agora,
      ignoradasAntes: 0,
    });
    expect(r.ignoradasSeguidas).toBe(1);
  });

  it('lembrete ainda dentro da janela (e sem abertura) fica pra depois', () => {
    const r = atualizarIgnoradas({ agendados: [lembreteAs(19)], aberturas: [], agora, ignoradasAntes: 1 });
    expect(r.ignoradasSeguidas).toBe(1);
    expect(r.agendadosPendentes).toHaveLength(1);
  });

  it('lembretes futuros são descartados (o novo plano substitui)', () => {
    const futuro = { quando: agora + DIA, tipo: 'agua' as const };
    const r = atualizarIgnoradas({ agendados: [futuro], aberturas: [], agora, ignoradasAntes: 0 });
    expect(r.ignoradasSeguidas).toBe(0);
    expect(r.agendadosPendentes).toEqual([]);
  });

  it('três ignorados seguidos chegam a 3 (aciona o freio)', () => {
    const r = atualizarIgnoradas({
      agendados: [lembreteAs(17, 3), lembreteAs(17, 2), lembreteAs(17, 1)],
      aberturas: [],
      agora,
      ignoradasAntes: 0,
    });
    expect(r.ignoradasSeguidas).toBe(3);
  });
});

describe('mensagens', () => {
  it('tem pelo menos 10 mensagens e cobre todos os tipos', () => {
    expect(MENSAGENS_LEMBRETE.length).toBeGreaterThanOrEqual(10);
    const tipos = new Set(MENSAGENS_LEMBRETE.map((m) => m.tipo));
    expect(Array.from(tipos).sort()).toEqual(['agua', 'alimentacao', 'atividade', 'missao', 'saudade', 'trilha']);
  });

  it('ids são únicos', () => {
    const ids = MENSAGENS_LEMBRETE.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('não repete a última mensagem usada', () => {
    for (let i = 0; i < 50; i++) {
      expect(escolherMensagem('agua', 'agua-1').id).not.toBe('agua-1');
    }
  });

  it('o sorteio sempre devolve uma mensagem do tipo pedido', () => {
    expect(escolherMensagem('trilha', undefined, () => 0.999).tipo).toBe('trilha');
    expect(escolherMensagem('saudade', 'saudade-1').id).toBe('saudade-2');
  });
});
