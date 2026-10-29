import { alertasTrilha, gruposDoCaminho, lacunasReceita, paraQuestoesDoApp, resumoTrilha, usaSessaoDePassos, type TrilhaDaPrevia } from '../previa';

const trilha: TrilhaDaPrevia = {
  id: 't',
  titulo: 'Trilha',
  xpBonus: null,
  modulos: [
    { id: 'm1', titulo: 'Base', ordem: 1, xpBonus: null, licoes: [
      { id: 'l1', titulo: 'Leitura', ordem: 1, tipo: 'conteudo', xp: 10, icone: 'leaf-outline', passos: 3 },
      { id: 'l2', titulo: 'Quiz', ordem: 2, tipo: 'quiz', xp: 20, passos: 0 },
    ] },
    { id: 'm2', titulo: 'Vazio', ordem: 2, xpBonus: 50, licoes: [] },
  ],
};

describe('paraQuestoesDoApp', () => {
  it('ordena opções, numera e garante ids (o RPC da equipe não manda id de opção)', () => {
    const q = paraQuestoesDoApp([{ id: 'q1', enunciado: 'P', formato: 'multipla_escolha', dadosExtra: {}, opcoes: [
      { texto: 'b', correta: false, ordem: 2 },
      { texto: 'a', correta: true, ordem: 1 },
    ] }]);
    expect(q[0].ordem).toBe(1);
    expect(q[0].opcoes.map((o) => o.texto)).toEqual(['a', 'b']);
    expect(q[0].opcoes.map((o) => o.id)).toEqual(['q1:0', 'q1:1']);
    expect(q[0].opcoes[0]).toMatchObject({ correta: true, ordem: 1, categoria: null });
  });
  it('mantém ids e categoria que já existem', () => {
    const q = paraQuestoesDoApp([{ id: 'q', enunciado: 'C', formato: 'classifique', dadosExtra: { categorias: ['A'] }, opcoes: [{ id: 'o9', texto: 'x', correta: true, ordem: 1, categoria: 'A' }] }]);
    expect(q[0].opcoes[0]).toMatchObject({ id: 'o9', categoria: 'A' });
    expect(q[0].dadosExtra).toEqual({ categorias: ['A'] });
  });
});

describe('sessão, mapa e resumo da trilha', () => {
  it('usa sessão de passos como o app', () => {
    expect(usaSessaoDePassos('quiz', 0)).toBe(true);
    expect(usaSessaoDePassos('conteudo', 2)).toBe(true);
    expect(usaSessaoDePassos('conteudo', 0)).toBe(false);
    expect(usaSessaoDePassos('atividade_rastreavel', 0)).toBe(false);
  });
  it('só a primeira lição da trilha fica "atual"', () => {
    const g = gruposDoCaminho(trilha);
    expect(g.map((x) => x.nos.map((n) => n.status))).toEqual([['atual', 'bloqueada'], []]);
    expect(g[0].nos[0]).toMatchObject({ id: 'l1', moduloId: 'm1', icone: 'leaf-outline', tipo: 'conteudo' });
    expect(g.map((x) => x.inicioDeTrilha)).toEqual([true, false]);
    expect(g[0]).toMatchObject({ trilhaId: trilha.id, tituloTrilha: trilha.titulo, numeroTrilha: 1 });
    expect(gruposDoCaminho(trilha, 3)[0].numeroTrilha).toBe(3);
  });
  it('resumo usa o XP bônus padrão quando vazio (100 por módulo, 125 por trilha)', () => {
    expect(resumoTrilha(trilha)).toEqual({ modulos: 2, licoes: 2, passos: 3, xpLicoes: 30, xpBonusModulos: 150, xpBonusTrilha: 125, xpTotal: 305 });
  });
  it('alertas: módulo vazio e quiz sem passos', () => {
    expect(alertasTrilha(trilha)).toEqual(['A lição "Quiz" é um quiz sem passos.', 'O módulo "Vazio" não tem lições.']);
    expect(alertasTrilha({ ...trilha, modulos: [] })).toEqual(['A trilha não tem módulos.']);
  });
});

describe('lacunasReceita', () => {
  it('receita completa não tem lacunas', () => {
    expect(lacunasReceita({ fotoUrl: 'https://x/y.jpg', modoPreparo: 'Misture tudo e asse.', tempoPreparoMin: 30, porcoes: 4, ingredientes: 3, passos: 2 })).toEqual([]);
  });
  it('lista o que falta', () => {
    const l = lacunasReceita({ fotoUrl: null, modoPreparo: 'curto', tempoPreparoMin: null, porcoes: null, ingredientes: 0, passos: 0 });
    expect(l).toHaveLength(6);
    expect(l[0]).toMatch(/ingredientes/);
  });
});
