import {
  diasEntre, insightsGerais, insightsIndividuais, maiorSequencia, nivel, retencaoMedia, semanasCalendario, totalSemana,
} from '../utils/jornada';
import type { AnalyticsJornada, DiaCalendario, JornadaParticipante } from '../services/jornadaService';

const semana = (inicio: string, frequentes: number, pausa = 0) => ({ inicio, novos: 1, frequentes, ocasionais: 4, pausa, inativos: 5 });

function jornada(parcial: Partial<AnalyticsJornada> = {}): AnalyticsJornada {
  return {
    semanas: 5,
    estagios: [semana('2026-10-12', 2), semana('2026-10-19', 3), semana('2026-10-26', 3), semana('2026-11-02', 4), semana('2026-11-09', 8, 3)],
    coortes: [{ semana: '2026-10-12', tamanho: 10, retencao: [100, 60, 40, null, null, null, null, null] }, { semana: '2026-10-19', tamanho: 3, retencao: [null, null, null, null, null, null, null, null] }],
    adocao: [
      { recurso: 'registro', pontos: [{ semana: 4, elegiveis: 10, pct: 80 }] },
      { recurso: 'receita', pontos: [{ semana: 4, elegiveis: 10, pct: 20 }] },
      { recurso: 'scanner', pontos: [{ semana: 4, elegiveis: 3, pct: null }] },
    ],
    horarios: [{ dia: 2, faixa: 6, pessoas: 9, eventos: 40 }, { dia: 0, faixa: 3, pessoas: 6, eventos: 10 }, { dia: 4, faixa: 1, pessoas: null, eventos: null }],
    pessoas_periodo: 20,
    progresso_trilhas: [{ faixa: '0', pessoas: 6 }, { faixa: '1 a 2', pessoas: 4 }],
    total_adolescentes: 20,
    minimo_pessoas: 5,
    ...parcial,
  };
}

describe('jornada: regras', () => {
  it('soma a semana e calcula o nível de intensidade', () => {
    expect(totalSemana(semana('x', 2))).toBe(12);
    expect(nivel(0, 10)).toBe(-1);
    expect(nivel(1, 10)).toBe(0);
    expect(nivel(10, 10)).toBe(3);
  });
  it('retenção média ignora turmas sem número', () => {
    expect(retencaoMedia(jornada().coortes, 1)).toBe(60);
    expect(retencaoMedia(jornada().coortes, 4)).toBeNull();
  });
});

describe('insights gerais', () => {
  const ins = insightsGerais(jornada());
  it('detecta aumento dos frequentes, pausa, retenção, adoção, pico e trilhas', () => {
    const titulos = ins.map((i) => i.titulo);
    expect(titulos[0]).toBe('Mais adolescentes usando com frequência');
    expect(titulos).toContain('3 adolescentes em pausa');
    expect(titulos).toContain('60% voltam na semana seguinte ao cadastro');
    expect(titulos).toContain('Registros do dia é o recurso mais adotado');
    expect(titulos).toContain('Pico de uso: quarta, 18–21h');
    expect(titulos).toContain('40% já concluíram pelo menos uma lição');
  });
  it('não gera frase com julgamento sobre o adolescente', () => {
    const texto = ins.map((i) => `${i.titulo} ${i.texto}`).join(' ').toLowerCase();
    expect(texto).not.toMatch(/errad|ruim|preguiç|culpa|fracass/);
  });
  it('sem dados suficientes, não inventa insight', () => {
    const vazio = insightsGerais(jornada({ estagios: [], coortes: [], adocao: [], horarios: [], progresso_trilhas: [] }));
    expect(vazio).toEqual([]);
  });
});

function dia(data: string, usou: boolean, antes = false): DiaCalendario {
  return { data, acoes: usou ? 2 : 0, registro: false, licoes: 0, antes_do_cadastro: antes };
}
function calendario(usos: boolean[]): DiaCalendario[] {
  const ini = Date.parse('2026-08-27T12:00:00Z');
  return usos.map((u, i) => dia(new Date(ini + i * 86400000).toISOString().slice(0, 10), u));
}

describe('jornada individual', () => {
  it('maior sequência e semanas do calendário', () => {
    expect(maiorSequencia(calendario([true, true, false, true, true, true, false]))).toBe(3);
    const sem = semanasCalendario(calendario(Array(10).fill(true)));
    expect(sem.every((s) => s.length === 7)).toBe(true);
    expect(diasEntre('2026-11-01', '2026-11-19')).toBe(18);
  });

  it('gera insights de ritmo, ausência, período e recursos', () => {
    // 84 dias: usa bastante no início, nada nas últimas 2 semanas
    const usos = Array.from({ length: 84 }, (_, i) => i < 60 && i % 2 === 0);
    const j: JornadaParticipante = {
      inicio: '2026-08-27',
      cadastro: '2026-08-20',
      calendario: calendario(usos),
      recursos: [
        { recurso: 'registro', dias: 20, dias_12_semanas: 20, primeiro: '2026-08-27', ultimo: '2026-10-24' },
        { recurso: 'trilha', dias: 3, dias_12_semanas: 3, primeiro: '2026-09-01', ultimo: '2026-09-20' },
        { recurso: 'receita', dias: 0, dias_12_semanas: 0, primeiro: null, ultimo: null },
      ],
      marcos: [{ chave: 'primeiro_registro', data: '2026-08-27' }],
      periodos: { madrugada: 0, manha: 2, tarde: 3, noite: 15 },
    };
    const ins = insightsIndividuais(j, '2026-11-18');
    const titulos = ins.map((i) => i.titulo);
    expect(titulos).toContain('Usando menos o app');
    expect(titulos.some((t) => /^Há \d+ dias sem usar o app$/.test(t))).toBe(true);
    expect(titulos).toContain('Costuma usar à noite');
    expect(titulos).toContain('Mais usado: Registros do dia');
    expect(ins.find((i) => i.titulo === 'Mais usado: Registros do dia')?.texto).toBe('Ainda não experimentou: Receitas.');
    expect(titulos).toContain('Primeiro registro 7 dias após o cadastro');
  });
});
