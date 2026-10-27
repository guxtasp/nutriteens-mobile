import { CONFIG_PADRAO, type ConfigLembretes, type LembretePlanejado } from '../escolherLembrete';
import { combinarComJornada, planejarJornadaSemanal, proximaJornada, type EntradaJornada } from '../jornadaSemanal';
import { MENSAGENS_LEMBRETE, escolherMensagem } from '../../data/mensagensLembrete';

const HORA = 3600 * 1000;
const DIA = 24 * HORA;

// segunda-feira, 5/out/2026, 9h (horário local do ambiente de teste)
const AGORA = new Date(2026, 9, 5, 9, 0, 0);
const DOMINGO = new Date(2026, 9, 11, 17, 30, 0); // próximo domingo, 17h30

const entrada = (o: Partial<EntradaJornada> = {}): EntradaJornada => ({
  agora: AGORA,
  config: CONFIG_PADRAO,
  aberturas: [AGORA.getTime() - 2 * DIA, AGORA.getTime() - 1 * DIA],
  ignoradasSeguidas: 0,
  hora: 17.5,
  ultimaAbertura: AGORA.getTime(),
  ...o,
});

describe('proximaJornada', () => {
  it('de segunda, vai para o domingo seguinte na hora pedida', () => {
    expect(proximaJornada(AGORA, 17.5, AGORA.getTime())).toEqual(DOMINGO);
  });

  it('no domingo antes da hora, é hoje; depois da hora, é o domingo seguinte', () => {
    const cedo = new Date(2026, 9, 11, 9, 0);
    expect(proximaJornada(cedo, 17.5)).toEqual(new Date(2026, 9, 11, 17, 30));
    const tarde = new Date(2026, 9, 11, 19, 0);
    expect(proximaJornada(tarde, 17.5)).toEqual(new Date(2026, 9, 18, 17, 30));
  });

  it('abriu o app há menos de 3h do horário: passa para a semana seguinte', () => {
    const quase = new Date(2026, 9, 11, 16, 0);
    expect(proximaJornada(quase, 17.5, quase.getTime())).toEqual(new Date(2026, 9, 18, 17, 30));
  });

  it('sempre devolve um domingo no futuro', () => {
    for (let d = 0; d < 14; d++) {
      const agora = new Date(2026, 9, 5 + d, 12, 0);
      const q = proximaJornada(agora, 17.5);
      expect(q.getDay()).toBe(0);
      expect(q.getTime()).toBeGreaterThan(agora.getTime());
      expect(q.getTime() - agora.getTime()).toBeLessThanOrEqual(14 * DIA);
    }
  });
});

describe('planejarJornadaSemanal', () => {
  it('uso recente + ligado: agenda 1 lembrete do tipo jornada', () => {
    const r = planejarJornadaSemanal(entrada())!;
    expect(r.tipo).toBe('jornada');
    expect(r.quando).toEqual(DOMINGO);
  });

  it('chave geral desligada ou resumo desligado: nada', () => {
    expect(planejarJornadaSemanal(entrada({ config: { ...CONFIG_PADRAO, ativado: false } }))).toBeNull();
    expect(planejarJornadaSemanal(entrada({ config: { ...CONFIG_PADRAO, jornadaSemanal: false } }))).toBeNull();
  });

  it('config antiga, sem o campo: conta como ligado', () => {
    const antiga: ConfigLembretes = { ativado: true, tipos: CONFIG_PADRAO.tipos, porDia: 1 };
    expect(planejarJornadaSemanal(entrada({ config: antiga }))).not.toBeNull();
  });

  it('sem uso recente (menos de 2 aberturas em 14 dias): nada', () => {
    expect(planejarJornadaSemanal(entrada({ aberturas: [] }))).toBeNull();
    expect(planejarJornadaSemanal(entrada({ aberturas: [AGORA.getTime() - 1 * DIA] }))).toBeNull();
    expect(planejarJornadaSemanal(entrada({ aberturas: [AGORA.getTime() - 20 * DIA, AGORA.getTime() - 19 * DIA] }))).toBeNull();
  });

  it('respeita o freio: 3 lembretes seguidos ignorados, não manda', () => {
    expect(planejarJornadaSemanal(entrada({ ignoradasSeguidas: 3 }))).toBeNull();
    expect(planejarJornadaSemanal(entrada({ ignoradasSeguidas: 2 }))).not.toBeNull();
  });
});

describe('combinarComJornada', () => {
  const regular = (d: Date, tipo: LembretePlanejado['tipo'] = 'agua'): LembretePlanejado => ({ quando: d, tipo });
  const jornada: LembretePlanejado = { quando: DOMINGO, tipo: 'jornada' };

  it('sem jornada, o plano não muda', () => {
    const p = [regular(new Date(2026, 9, 5, 17, 30))];
    expect(combinarComJornada(p, null)).toBe(p);
  });

  it('no dia do resumo, tira os outros lembretes (nunca dois no mesmo dia)', () => {
    const plano = [regular(new Date(2026, 9, 11, 12, 0)), regular(new Date(2026, 9, 11, 17, 0), 'missao'), regular(new Date(2026, 9, 10, 17, 30))];
    const r = combinarComJornada(plano, jornada);
    expect(r.filter((x) => x.quando.getDate() === 11)).toEqual([jornada]);
    expect(r).toHaveLength(2);
  });

  it('em outros dias, mantém tudo e deixa em ordem de horário', () => {
    const plano = [regular(new Date(2026, 9, 12, 17, 30)), regular(new Date(2026, 9, 6, 17, 30))];
    const r = combinarComJornada(plano, jornada);
    expect(r).toHaveLength(3);
    const ts = r.map((x) => x.quando.getTime());
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
  });

  it('o resumo também toma o lugar de uma "saudade" do mesmo dia', () => {
    const r = combinarComJornada([regular(new Date(2026, 9, 11, 17, 30), 'saudade')], jornada);
    expect(r).toEqual([jornada]);
  });
});

describe('mensagens da jornada', () => {
  const msgs = MENSAGENS_LEMBRETE.filter((m) => m.tipo === 'jornada');

  it('existem, levam para a tela Minha jornada e não citam números', () => {
    expect(msgs.length).toBeGreaterThanOrEqual(2);
    msgs.forEach((m) => {
      expect(m.destino).toBe('Metricas');
      expect(/\d/.test(m.titulo.replace(/7/g, '')) || /\d/.test(m.texto.replace(/7 dias/g, ''))).toBe(false);
    });
  });

  it('tom sem cobrança, juízo ou comparação com outras pessoas', () => {
    msgs.forEach((m) => expect(`${m.titulo} ${m.texto}`).not.toMatch(/\b(falhou|culpa|ranking|pior|perdeu|atrasad[oa]|esqueceu|deveria)\b/i));
  });

  it('o sorteio devolve sempre uma mensagem do tipo pedido', () => {
    for (let i = 0; i < 20; i++) expect(escolherMensagem('jornada').tipo).toBe('jornada');
  });
});
