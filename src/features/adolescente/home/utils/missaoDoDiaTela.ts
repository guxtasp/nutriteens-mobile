// src/features/adolescente/home/utils/missaoDoDiaTela.ts
//
// Regra pura da tela "Missão do dia" (sem React/AsyncStorage; testável em
// ./__tests__/missaoDoDiaTela.test.ts).
//
// A tela aparece UMA vez por dia, na primeira abertura da Home, apresentando a missão sorteada
// para hoje. Só é oferecida se a missão ainda não foi cumprida: quem já cumpriu não precisa de
// convite, e a celebração da sequência já cuida desse momento.
import { destinoMissaoDiaria, type DestinoMissao } from '../../missoes/utils/destinoMissao';
import { numeroDoDia } from './boasVindas';

const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** "Segunda-feira, 16 de novembro" a partir de AAAA-MM-DD; '' se a data for inválida. */
export function rotuloDataExtenso(iso: string | null | undefined): string {
  const n = numeroDoDia(iso);
  if (n === null || !iso) return '';
  const [, mes, dia] = iso.split('-').map(Number);
  // n = dias desde 1970-01-01 (quinta-feira): evita depender de fuso/Date local
  const diaSemana = (((n + 4) % 7) + 7) % 7;
  return `${DIAS_SEMANA[diaSemana]}, ${dia} de ${MESES[mes - 1]}`;
}

type EntradaElegivel = {
  dadosCarregados: boolean;
  temMissao: boolean;
  concluida: boolean;
};

/** A missão de hoje deve ser apresentada? (o gate "uma vez por dia" é checado à parte) */
export function missaoDoDiaElegivel({ dadosCarregados, temMissao, concluida }: EntradaElegivel): boolean {
  return dadosCarregados && temMissao && !concluida;
}

export type ConteudoMissaoTela = {
  etiqueta: string;
  titulo: string;
  /** texto do botão principal */
  rotuloPrincipal: string;
  /** para onde o botão principal leva; null = abre a tela de Missões */
  destino: DestinoMissao | null;
  rotuloSecundario: string;
};

export function montarConteudoMissaoTela(tipoMissao: string): ConteudoMissaoTela {
  const destino = destinoMissaoDiaria(tipoMissao);
  return {
    etiqueta: 'MISSÃO DO DIA',
    titulo: 'Sua missão de hoje',
    rotuloPrincipal: destino ? destino.rotulo : 'Ver minhas missões',
    destino,
    rotuloSecundario: 'Agora não',
  };
}

/** "1 dia seguido" / "5 dias seguidos"; null quando não há sequência para destacar. */
export function textoSequenciaChip(sequenciaAtual: number): string | null {
  if (!Number.isFinite(sequenciaAtual) || sequenciaAtual <= 0) return null;
  return `${sequenciaAtual} ${sequenciaAtual === 1 ? 'dia seguido' : 'dias seguidos'}`;
}
