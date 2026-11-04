// src/features/adolescente/home/utils/boasVindas.ts
//
// Regra pura das "boas-vindas" do primeiro acesso (sem React, sem rede, sem AsyncStorage —
// testável em ../utils/__tests__/boasVindas.test.ts).
//
// "Primeiro acesso" = conta criada hoje (ou até JANELA_BOAS_VINDAS_DIAS atrás, para quem
// criou a conta e só abriu a Home depois). Quem já usa o app há mais tempo nunca vê a
// mensagem, mesmo sem ter o "já vi" gravado neste aparelho.
//
// Os textos seguem o mesmo cuidado do aniversário: vínculo com o Bróxis, sem citar comida,
// corpo, peso nem cobrança. Todo texto novo passa pela revisão da nutricionista.

/** Quantos dias depois de criar a conta ainda vale mostrar as boas-vindas. */
export const JANELA_BOAS_VINDAS_DIAS = 3;

const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})/;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function numeroDoDia(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const m = FORMATO_DATA.exec(iso);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const t = new Date(Date.UTC(ano, mes - 1, dia));
  // rejeita datas inexistentes (ex.: 2026-02-31), que Date.UTC "rola" para o mês seguinte
  if (t.getUTCFullYear() !== ano || t.getUTCMonth() !== mes - 1 || t.getUTCDate() !== dia) return null;
  return Math.round(t.getTime() / MS_POR_DIA);
}

/**
 * A conta é recente o bastante para mostrar as boas-vindas?
 *
 * @param criadaEmISO dia LOCAL em que a conta foi criada (AAAA-MM-DD)
 * @param hojeISO     dia local de hoje (AAAA-MM-DD), como a Home já calcula
 */
export function ehPrimeiroAcessoRecente(criadaEmISO: string | null | undefined, hojeISO: string | null | undefined): boolean {
  const criada = numeroDoDia(criadaEmISO);
  const hoje = numeroDoDia(hojeISO);
  if (criada === null || hoje === null) return false;
  const dias = hoje - criada;
  return dias >= 0 && dias <= JANELA_BOAS_VINDAS_DIAS;
}

export type PassoBoasVindas = {
  /** nome do ícone Ionicons */
  icone: 'flag' | 'map' | 'flame';
  titulo: string;
  legenda: string;
};

export type MensagemBoasVindas = {
  /** balãozinho ao lado do Bróxis */
  saudacao: string;
  /** título do cartão (aparece palavra por palavra) */
  titulo: string;
  corpo: string;
  passos: readonly PassoBoasVindas[];
  textoBotao: string;
};

export const PASSOS_BOAS_VINDAS: readonly PassoBoasVindas[] = [
  { icone: 'flag', titulo: 'Missões', legenda: 'pequenos desafios do dia' },
  { icone: 'map', titulo: 'Trilha', legenda: 'aprenda passo a passo' },
  { icone: 'flame', titulo: 'Sequência', legenda: 'dia após dia com o Bróxis' },
];

/** @param primeiroNome primeiro nome, ou null/vazio para uma saudação sem nome */
export function montarMensagemBoasVindas(primeiroNome: string | null | undefined): MensagemBoasVindas {
  const nome = primeiroNome?.trim() || null;
  return {
    saudacao: nome ? `Oi, ${nome}!` : 'Oi!',
    titulo: 'Que bom que você chegou!',
    corpo: 'Eu sou o Bróxis e vou te acompanhar por aqui. Sem pressa: cada passo conta.',
    passos: PASSOS_BOAS_VINDAS,
    textoBotao: 'Bora começar!',
  };
}
