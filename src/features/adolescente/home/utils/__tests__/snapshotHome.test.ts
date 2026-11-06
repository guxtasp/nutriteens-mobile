import { aproveitarSnapshotHome, type SnapshotHome } from '../snapshotHome';

const base: SnapshotHome = {
  gravadoEm: '2026-11-05',
  missao: null,
  missaoConcluida: true,
  sequenciaAtual: 4,
  maiorSequencia: 9,
  xpTotal: 120,
  diaDeHojeMantido: true,
  diasMantidos: ['2026-11-04', '2026-11-05'],
};

describe('aproveitarSnapshotHome', () => {
  it('sem cópia, não há o que mostrar', () => {
    expect(aproveitarSnapshotHome(null, '2026-11-06', '2026-11-05')).toBeNull();
  });

  it('cópia de hoje vale inteira', () => {
    const hoje = { ...base, gravadoEm: '2026-11-06' };
    expect(aproveitarSnapshotHome(hoje, '2026-11-06', '2026-11-05')).toBe(hoje);
  });

  it('cópia de ontem com o dia mantido: mantém a sequência e descarta o que era de ontem', () => {
    const r = aproveitarSnapshotHome(base, '2026-11-06', '2026-11-05');
    expect(r).not.toBeNull();
    expect(r!.sequenciaAtual).toBe(4);
    expect(r!.xpTotal).toBe(120);
    expect(r!.missao).toBeNull();
    expect(r!.missaoConcluida).toBe(false);
    expect(r!.diaDeHojeMantido).toBe(false);
  });

  it('cópia de ontem SEM o dia mantido: a sequência pode ter quebrado, não mostra número', () => {
    const r = aproveitarSnapshotHome({ ...base, diaDeHojeMantido: false }, '2026-11-06', '2026-11-05');
    expect(r).toBeNull();
  });

  it('cópia mais antiga que ontem: não mostra', () => {
    expect(aproveitarSnapshotHome({ ...base, gravadoEm: '2026-11-01' }, '2026-11-06', '2026-11-05')).toBeNull();
  });

  it('cópia corrompida é ignorada', () => {
    expect(aproveitarSnapshotHome({} as SnapshotHome, '2026-11-06', '2026-11-05')).toBeNull();
  });
});
