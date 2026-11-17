// src/features/adolescente/home/utils/primeirosPassos.ts
//
// Regra pura do cartão "Primeiros passos" da Home (sem React, sem rede, sem AsyncStorage —
// testável em ./__tests__/primeirosPassos.test.ts).
//
// Problema que ele resolve: depois do cadastro, das boas-vindas e do tour, a pessoa chega numa
// Home cheia de cartões e não sabe por onde começar. O cartão lista poucas ações simples, mostra
// o quanto já foi feito e leva direto para a tela de cada uma.
//
// Cada passo é "feito" quando existe QUALQUER registro dele na conta (não só hoje): é um guia de
// descoberta, não uma meta diária. Ver ../services/primeirosPassosService.ts.
//
// Os textos seguem o mesmo cuidado das boas-vindas: tom acolhedor, sem cobrança e sem falar de
// corpo/peso. Todo texto novo passa pela revisão da nutricionista.
import { numeroDoDia } from './boasVindas';

/** Quantos dias depois de criar a conta o cartão ainda pode aparecer. */
export const JANELA_PRIMEIROS_PASSOS_DIAS = 14;

export type IdPasso = 'agua' | 'atividade' | 'refeicao' | 'licao' | 'amigo';
export type RotaPasso = 'ConsumoAgua' | 'AtividadeFisica' | 'TipoRefeicao' | 'Trilha' | 'Social';

export type PassoBase = {
  id: IdPasso;
  /** nome do ícone Ionicons */
  icone: 'water' | 'walk' | 'restaurant' | 'book' | 'people';
  titulo: string;
  legenda: string;
  rota: RotaPasso;
};

/** Ordem pensada do mais rápido (um toque) para o mais "social". */
export const PASSOS_BASE: readonly PassoBase[] = [
  { id: 'agua', icone: 'water', titulo: 'Registre sua água', legenda: 'Conte o primeiro copinho do dia', rota: 'ConsumoAgua' },
  { id: 'atividade', icone: 'walk', titulo: 'Registre uma atividade', legenda: 'Caminhar, dançar, jogar bola… tudo vale', rota: 'AtividadeFisica' },
  { id: 'refeicao', icone: 'restaurant', titulo: 'Registre uma refeição', legenda: 'O Bróxis comenta e dá dicas pra você', rota: 'TipoRefeicao' },
  { id: 'licao', icone: 'book', titulo: 'Faça sua primeira lição', legenda: 'Aprenda um pouquinho na Trilha', rota: 'Trilha' },
  { id: 'amigo', icone: 'people', titulo: 'Adicione um amigo', legenda: 'Envie um pedido usando o código de amizade', rota: 'Social' },
];

export type PassosFeitos = Record<IdPasso, boolean>;

export const NENHUM_PASSO_FEITO: PassosFeitos = {
  agua: false,
  atividade: false,
  refeicao: false,
  licao: false,
  amigo: false,
};

export type PassoComEstado = PassoBase & { feito: boolean };

export type ResumoPrimeirosPassos = {
  passos: PassoComEstado[];
  feitos: number;
  total: number;
  /** 0 a 1, para a barra */
  fracao: number;
  completo: boolean;
  /** o primeiro passo ainda pendente (o que o botão principal do cartão abre) */
  proximo: PassoComEstado | null;
};

export function resumirPrimeirosPassos(feitos: Partial<PassosFeitos>): ResumoPrimeirosPassos {
  const passos = PASSOS_BASE.map((p) => ({ ...p, feito: feitos[p.id] === true }));
  const qtd = passos.filter((p) => p.feito).length;
  return {
    passos,
    feitos: qtd,
    total: passos.length,
    fracao: passos.length > 0 ? qtd / passos.length : 0,
    completo: qtd === passos.length,
    proximo: passos.find((p) => !p.feito) ?? null,
  };
}

/** A conta ainda está na janela em que faz sentido guiar os primeiros passos? */
export function dentroDaJanelaPrimeirosPassos(criadaEmISO: string | null | undefined, hojeISO: string | null | undefined): boolean {
  const criada = numeroDoDia(criadaEmISO);
  const hoje = numeroDoDia(hojeISO);
  if (criada === null || hoje === null) return false;
  const dias = hoje - criada;
  return dias >= 0 && dias <= JANELA_PRIMEIROS_PASSOS_DIAS;
}

/** "3 de 5 feitos" / "Tudo feito!" */
export function textoProgressoPassos(r: Pick<ResumoPrimeirosPassos, 'feitos' | 'total' | 'completo'>): string {
  return r.completo ? 'Tudo feito!' : `${r.feitos} de ${r.total} feitos`;
}

/** Texto do botão principal do cartão, conforme o próximo passo. */
export function rotuloBotaoPassos(r: Pick<ResumoPrimeirosPassos, 'feitos' | 'proximo'>): string {
  if (!r.proximo) return 'Continuar';
  return r.feitos === 0 ? 'Começar' : 'Próximo passo';
}
