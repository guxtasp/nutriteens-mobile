// src/features/adolescente/home/utils/aniversario.ts
//
// Regra pura do "feliz aniversário" do Bróxis (sem React, sem rede, sem AsyncStorage —
// por isso é testável em ../utils/__tests__/aniversario.test.ts).
//
// Cuidados de projeto (ver plano de novas funcionalidades, ideia 8):
//  - as datas são tratadas como texto AAAA-MM-DD e comparadas por número de dia em UTC;
//    nunca `new Date('AAAA-MM-DD')` no fuso local, que pode deslocar o dia;
//  - quem nasceu em 29/02 celebra em 28/02 nos anos não bissextos;
//  - além do próprio dia, vale uma janela de "aniversário atrasado" (JANELA_ATRASO_DIAS),
//    inclusive na virada do ano (nasceu em 31/12 e abriu o app em 02/01);
//  - as mensagens não citam idade, comida, corpo nem "você merece": é vínculo com o Bróxis,
//    não conteúdo avaliativo. Todo texto novo passa pela revisão da nutricionista.

/** Quantos dias depois do aniversário ainda vale mostrar a mensagem (atrasada). */
export const JANELA_ATRASO_DIAS = 3;

export type SituacaoAniversario =
  | { celebrar: false }
  | {
      celebrar: true;
      /** ano do aniversário celebrado (chave do "já celebrei neste ano") */
      ano: number;
      /** 0 = é hoje; 1..JANELA_ATRASO_DIAS = aniversário atrasado */
      diasDeAtraso: number;
    };

const NAO_CELEBRAR: SituacaoAniversario = { celebrar: false };

const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})/;

type PartesData = { ano: number; mes: number; dia: number };

function lerData(iso: string | null | undefined): PartesData | null {
  if (!iso) return null;
  const m = FORMATO_DATA.exec(iso);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  // rejeita datas que não existem (ex.: 2025-02-31): Date.UTC "rola" para o mês seguinte
  const t = new Date(Date.UTC(ano, mes - 1, dia));
  if (t.getUTCFullYear() !== ano || t.getUTCMonth() !== mes - 1 || t.getUTCDate() !== dia) return null;
  return { ano, mes, dia };
}

function ehBissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function numeroDoDia(ano: number, mes: number, dia: number): number {
  return Math.round(Date.UTC(ano, mes - 1, dia) / MS_POR_DIA);
}

/**
 * Dia (mês/dia) em que o aniversário cai em `ano`: 29/02 vira 28/02 nos anos não bissextos.
 */
function aniversarioNoAno(nascimento: PartesData, ano: number): { mes: number; dia: number } {
  if (nascimento.mes === 2 && nascimento.dia === 29 && !ehBissexto(ano)) return { mes: 2, dia: 28 };
  return { mes: nascimento.mes, dia: nascimento.dia };
}

/**
 * Hoje é aniversário (ou aniversário atrasado, dentro da janela)?
 *
 * @param dataNascimentoISO `profiles.data_nascimento` (AAAA-MM-DD); null/inválida → não celebra
 * @param hojeISO           dia local de hoje (AAAA-MM-DD), como a Home já calcula
 */
export function analisarAniversario(
  dataNascimentoISO: string | null | undefined,
  hojeISO: string,
): SituacaoAniversario {
  const nascimento = lerData(dataNascimentoISO);
  const hoje = lerData(hojeISO);
  if (!nascimento || !hoje) return NAO_CELEBRAR;

  const numeroHoje = numeroDoDia(hoje.ano, hoje.mes, hoje.dia);

  // o aniversário pode ser deste ano ou (na virada de ano, atrasado) do ano anterior
  for (const ano of [hoje.ano, hoje.ano - 1]) {
    // ninguém faz aniversário antes ou no próprio ano de nascimento
    if (ano <= nascimento.ano) continue;
    const { mes, dia } = aniversarioNoAno(nascimento, ano);
    const diasDeAtraso = numeroHoje - numeroDoDia(ano, mes, dia);
    if (diasDeAtraso >= 0 && diasDeAtraso <= JANELA_ATRASO_DIAS) {
      return { celebrar: true, ano, diasDeAtraso };
    }
  }
  return NAO_CELEBRAR;
}

export type ProximoAniversario = {
  ano: number;
  mes: number;
  dia: number;
  /** quantos dias faltam (0 = é hoje) */
  diasAte: number;
};

/**
 * Próximo aniversário de hoje em diante (hoje conta). Usado para agendar a notificação
 * local; null se a data de nascimento ou `hojeISO` forem inválidas.
 */
export function proximoAniversario(
  dataNascimentoISO: string | null | undefined,
  hojeISO: string,
): ProximoAniversario | null {
  const nascimento = lerData(dataNascimentoISO);
  const hoje = lerData(hojeISO);
  if (!nascimento || !hoje) return null;

  const numeroHoje = numeroDoDia(hoje.ano, hoje.mes, hoje.dia);
  for (const ano of [hoje.ano, hoje.ano + 1]) {
    if (ano <= nascimento.ano) continue;
    const { mes, dia } = aniversarioNoAno(nascimento, ano);
    const diasAte = numeroDoDia(ano, mes, dia) - numeroHoje;
    if (diasAte >= 0) return { ano, mes, dia, diasAte };
  }
  return null;
}

// --- mensagens -------------------------------------------------------------------------

/** Corpo da mensagem no dia do aniversário (o nome vai no título, ver montarMensagemAniversario). */
export const CORPOS_NO_DIA: readonly string[] = [
  'Hoje o dia é seu, e eu fico muito feliz de fazer parte da sua jornada.',
  'Preparei confete pra você. Aproveita o seu dia!',
  'Hoje a missão do Bróxis é uma só: te desejar um dia muito especial!',
  'Que bom ter você por aqui, junto comigo, em cada passo da jornada. Um dia incrível pra você!',
  'Um dia cheio de coisas boas pra você, do jeitinho que você gosta!',
];

/** Corpo da mensagem quando o app foi aberto até JANELA_ATRASO_DIAS dias depois. */
export const CORPOS_ATRASADOS: readonly string[] = [
  'Eu não podia deixar passar em branco! Espero que o seu dia tenha sido muito especial.',
  'O confete chegou um pouquinho atrasado, mas a vontade de te parabenizar estava aqui desde o começo.',
  'Passei da hora, mas não passei da vontade: um feliz aniversário pra você!',
];

/** Hash simples e estável (djb2) — só para variar a mensagem sem sortear de novo a cada abertura. */
function hashTexto(texto: string): number {
  let h = 5381;
  for (let i = 0; i < texto.length; i++) {
    h = ((h << 5) + h + texto.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export type MensagemAniversario = {
  titulo: string;
  corpo: string;
};

/**
 * Monta a mensagem. A escolha do corpo é determinística pela `semente` (por exemplo
 * `${userId}:${ano}`): a pessoa vê uma mensagem diferente a cada ano, e a mesma se o
 * modal for reaberto no mesmo ano.
 *
 * @param primeiroNome primeiro nome, ou null/vazio para uma mensagem sem nome
 */
export function montarMensagemAniversario(
  primeiroNome: string | null | undefined,
  diasDeAtraso: number,
  semente: string,
): MensagemAniversario {
  const nome = primeiroNome?.trim() || null;
  const atrasado = diasDeAtraso > 0;
  const corpos = atrasado ? CORPOS_ATRASADOS : CORPOS_NO_DIA;
  const corpo = corpos[hashTexto(semente) % corpos.length];

  const base = atrasado ? 'Feliz aniversário atrasado' : 'Feliz aniversário';
  const titulo = nome ? `${base}, ${nome}!` : `${base}!`;
  return { titulo, corpo };
}
