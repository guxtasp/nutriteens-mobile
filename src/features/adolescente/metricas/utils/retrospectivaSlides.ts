// src/features/adolescente/metricas/utils/retrospectivaSlides.ts
//
// "Seu ano com o Bróxis" em SLIDES (passo a passo, estilo retrospectiva): monta o roteiro a
// partir dos totais do ano. Lógica pura (sem React nem Supabase), testável.
//
// Regras do módulo Minha jornada valem aqui: só celebra, nunca aponta o que faltou, sem nota
// e sem comparação com ninguém (nem com o ano anterior). Só entram números > 0 e momentos que
// de fato aconteceram; sem nenhum número, não há retrospectiva (null).
//
// O texto de compartilhar parabeniza e resume as conquistas, e também apresenta o app. Ele
// NÃO leva nome, idade, data de nascimento nem apelido: só contagens.
import { pluralizar } from './apresentacao';
import type { CartaoId } from './cartoesInfo';
import type { JanelaAno, TotaisAno } from './retrospectivaAno';

export type DadosAno = {
  janela: JanelaAno;
  totais: TotaisAno;
  /** dias (AAAA-MM-DD) com pelo menos uma refeição registrada na janela */
  diasComRefeicao: string[];
  /** maior sequência de dias do perfil (acumulada, não só do ano) */
  maiorSequencia: number;
  /** dia (AAAA-MM-DD, local) em que a conta foi criada */
  criadaEm: string | null;
};

export type IconeMomento = 'calendar' | 'flame' | 'sparkles';

export type ItemNumero = { cartao: CartaoId; valor: number; rotulo: string };
export type ItemMomento = { icone: IconeMomento; titulo: string; destaque: string; frase: string };

// Roteiro enxuto: no máximo 4 slides (intro, números, momentos, cartão final).
export type SlideAno =
  | { tipo: 'intro'; titulo: string; periodo: string; texto: string }
  | { tipo: 'numeros'; titulo: string; itens: ItemNumero[] }
  | { tipo: 'momentos'; titulo: string; itens: ItemMomento[] }
  | { tipo: 'final'; titulo: string; mensagem: string; resumo: { valor: string; rotulo: string }[] };

export type RetrospectivaAno = {
  slides: SlideAno[];
  /** texto pronto para compartilhar (parabeniza, resume e apresenta o app) */
  textoCompartilhar: string;
  /** chave do avatar do usuário (profiles.avatar_social), para o cartão "Festa"; preenchida pelo serviço */
  avatar?: string | null;
};

export const MAX_NUMEROS = 4;
export const MAX_MOMENTOS = 3;
/** mês mais ativo só aparece com dias suficientes para a comparação entre meses fazer sentido */
export const MIN_DIAS_PARA_MES_ATIVO = 5;
export const MIN_DIAS_NO_MES_ATIVO = 3;

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];


function dataCompleta(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** Mês (nome) com mais dias de refeição registrada; empate fica com o mais antigo. */
export function mesMaisAtivo(dias: string[]): { mes: string; dias: number } | null {
  if (dias.length < MIN_DIAS_PARA_MES_ATIVO) return null;
  const porMes = new Map<string, number>();
  for (const d of new Set(dias)) {
    const chave = d.slice(0, 7); // AAAA-MM
    porMes.set(chave, (porMes.get(chave) ?? 0) + 1);
  }
  let melhor: { chave: string; n: number } | null = null;
  for (const [chave, n] of [...porMes.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (!melhor || n > melhor.n) melhor = { chave, n };
  }
  if (!melhor || melhor.n < MIN_DIAS_NO_MES_ATIVO) return null;
  const nomeMes = MESES[Number(melhor.chave.slice(5, 7)) - 1];
  return nomeMes ? { mes: nomeMes, dias: melhor.n } : null;
}

export function montarSlidesAno(dados: DadosAno, linkApp?: string | null): RetrospectivaAno | null {
  const { janela, totais } = dados;
  const diasUnicos = new Set(dados.diasComRefeicao).size;

  // ---- números (ordem fixa, sem ranking entre áreas) ----
  const candidatos: { cartao: CartaoId; v: number; s: string; p: string }[] = [
    {
      cartao: 'alimentacao', v: totais.refeicoes, s: 'refeição registrada', p: 'refeições registradas',
    },
    {
      cartao: 'resumo', v: diasUnicos, s: 'dia com refeição registrada', p: 'dias com refeição registrada',
    },
    {
      cartao: 'engajamento', v: totais.licoes, s: 'lição concluída', p: 'lições concluídas',
    },
    {
      cartao: 'atividade', v: totais.atividades, s: 'atividade registrada', p: 'atividades registradas',
    },
    {
      cartao: 'conquistas', v: totais.insignias, s: 'conquista', p: 'conquistas',
    },
  ];
  const numeros = candidatos.filter((c) => c.v > 0).slice(0, MAX_NUMEROS);
  if (numeros.length === 0) return null;

  // ---- momentos marcantes (só o que de fato aconteceu) ----
  const momentos: ItemMomento[] = [];
  const mes = mesMaisAtivo(dados.diasComRefeicao);
  if (mes) {
    momentos.push({
      icone: 'calendar', titulo: 'Seu mês mais ativo', destaque: mes.mes,
      frase: `${mes.dias} ${pluralizar(mes.dias, 'dia', 'dias')} com refeição registrada nesse mês.`,
    });
  }
  if (dados.maiorSequencia >= 2) {
    momentos.push({
      icone: 'flame', titulo: 'Sua maior sequência', destaque: `${dados.maiorSequencia} dias`,
      frase: 'Foram dias seguidos com o foguinho aceso. Que constância!',
    });
  }
  if (dados.criadaEm && dados.criadaEm >= janela.inicio && dados.criadaEm <= janela.fim) {
    momentos.push({
      icone: 'sparkles', titulo: 'Sua jornada começou', destaque: dataCompleta(dados.criadaEm),
      frase: 'Desde então, cada passo ajudou o Bróxis a crescer com você.',
    });
  }

  const resumo = numeros.map((n) => ({ valor: String(n.v), rotulo: pluralizar(n.v, n.s, n.p) }));
  const completo = janela.anoCompleto;

  const slides: SlideAno[] = [
    {
      tipo: 'intro',
      titulo: completo ? 'Seu ano com o Bróxis' : 'Sua jornada até aqui',
      periodo: `${dataCompleta(janela.inicio)} a ${dataCompleta(janela.fim)}`,
      texto: 'Vem ver o que você conquistou!',
    },
    {
      tipo: 'numeros',
      titulo: 'Seus números',
      itens: numeros.map((n) => ({ cartao: n.cartao, valor: n.v, rotulo: pluralizar(n.v, n.s, n.p) })),
    },
  ];
  if (momentos.length > 0) {
    slides.push({ tipo: 'momentos', titulo: 'Momentos marcantes', itens: momentos.slice(0, MAX_MOMENTOS) });
  }
  slides.push({
    tipo: 'final',
    titulo: 'Parabéns!',
    mensagem: 'Pelo seu aniversário e por cada passo da sua jornada com o Bróxis.',
    resumo,
  });

  return { slides, textoCompartilhar: montarTextoCompartilhar(completo, resumo, dados.maiorSequencia, linkApp) };
}

function montarTextoCompartilhar(
  anoCompleto: boolean,
  resumo: { valor: string; rotulo: string }[],
  maiorSequencia: number,
  linkApp?: string | null,
): string {
  const linhas = [
    anoCompleto
      ? 'Parabéns pra mim, pelo aniversário e pela jornada! 🎉 Olha o que eu conquistei no meu ano com o Bróxis, no NutriTeens:'
      : 'Parabéns pra mim, pelo aniversário e pela jornada! 🎉 Olha o que eu já conquistei com o Bróxis, no NutriTeens:',
    '',
    ...resumo.map((r) => `• ${r.valor} ${r.rotulo}`),
  ];
  if (maiorSequencia >= 2) linhas.push(`• maior sequência: ${maiorSequencia} dias seguidos`);
  linhas.push(
    '',
    'O NutriTeens ajuda adolescentes a cuidar da alimentação de um jeito leve, com missões, trilhas e o Bróxis. Vem junto! 💚',
  );
  if (linkApp) linhas.push(linkApp);
  return linhas.join('\n');
}

