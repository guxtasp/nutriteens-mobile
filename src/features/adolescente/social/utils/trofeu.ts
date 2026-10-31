// src/features/adolescente/social/utils/trofeu.ts
//
// Troféu da temporada: ao fim de cada desafio em grupo, quem cumpriu pelo menos 1 dia ganha um TÍTULO DE HÁBITO.
// Não é ranking: o título depende só dos dias cumpridos da própria pessoa (contra a meta pessoal dela), nunca de
// quem fez mais, de volume, peso ou corpo. Quem fez 0 dia não ganha nada e nada aparece sobre isso.
// Títulos neutros de gênero. Para trocar um nome, é só editar TITULOS (não precisa de migration).
import { DIAS_DESAFIO, METRICAS_DESAFIO, METRICAS_VALIDAS, nomeDaMetrica, type DesafioGrupo, type MetricaDesafio } from './desafioGrupo';

export type NivelTrofeu = 1 | 2 | 3;

export type Trofeu = {
  desafioId: string;
  metrica: MetricaDesafio;
  dias: number;
  nivel: NivelTrofeu;
  titulo: string;
  frase: string;
  icone: string;
  nomeDesafio: string;
  /** ISO do fim do desafio (vazio quando o troféu vem direto do desafio na tela). */
  encerradoEm: string;
};

/** Do nível 1 (começou) ao 3 (quase todos os dias). */
export const TITULOS: Record<MetricaDesafio, [string, string, string]> = {
  AGUA: ['Primeiras gotas', 'Maré boa', 'Lenda da aguinha'],
  ATIVIDADE: ['Aquecendo os motores', 'Pique total', 'Lenda do movimento'],
  PASSOS: ['Primeiros passos', 'Passo firme', 'Lenda dos passos'],
  REGISTRO: ['Primeiras anotações', 'Diário em dia', 'Lenda do registro'],
};

const FRASES: Record<NivelTrofeu, string> = {
  1: 'Você começou, e isso já conta.',
  2: 'Constância de verdade. Continue assim!',
  3: 'Quase todos os dias na sua meta. Mandou muito bem!',
};

/** 6 ou 7 dias = nível 3; 4 ou 5 = nível 2; 1 a 3 = nível 1; 0 = sem troféu. */
export function nivelDoTrofeu(dias: number): NivelTrofeu | null {
  if (!Number.isFinite(dias) || dias < 1) return null;
  if (dias >= 6) return 3;
  if (dias >= 4) return 2;
  return 1;
}

export function montarTrofeu(desafioId: string, metrica: MetricaDesafio, diasBrutos: number, encerradoEm = ''): Trofeu | null {
  const dias = Math.min(DIAS_DESAFIO, Math.floor(diasBrutos));
  const nivel = nivelDoTrofeu(dias);
  if (!nivel || !METRICAS_VALIDAS.includes(metrica)) return null;
  return {
    desafioId, metrica, dias, nivel,
    titulo: TITULOS[metrica][nivel - 1],
    frase: FRASES[nivel],
    icone: METRICAS_DESAFIO.find((m) => m.metrica === metrica)?.icone ?? 'flag',
    nomeDesafio: nomeDaMetrica(metrica),
    encerradoEm,
  };
}

/** Troféu do desafio que está na tela (só quando já acabou; usa os dias da própria pessoa). */
export function trofeuDoDesafio(d: DesafioGrupo, acabou: boolean): Trofeu | null {
  if (!acabou) return null;
  return montarTrofeu(d.id, d.metrica, new Set(d.meusDias).size);
}

/** Resposta de desafio_trofeus_listar → lista tipada; descarta registro inválido. */
export function mapearTrofeus(raw: unknown): Trofeu[] {
  if (!Array.isArray(raw)) return [];
  const out: Trofeu[] = [];
  for (const r of raw as any[]) {
    if (!r || !r.desafio_id) continue;
    const t = montarTrofeu(String(r.desafio_id), r.metrica as MetricaDesafio, Number(r.dias), r.encerrado_em ? String(r.encerrado_em) : '');
    if (t) out.push(t);
  }
  return out;
}

/** "dd/mm" a partir de um ISO; vazio se não der. Sem Intl, para funcionar igual em qualquer aparelho. */
export function dataCurtaDoTrofeu(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : '';
}

/** Rótulo para leitor de tela. */
export function rotuloDoTrofeu(t: Trofeu): string {
  return `Troféu ${t.titulo}. ${t.dias} de ${DIAS_DESAFIO} dias no desafio ${t.nomeDesafio}.`;
}
