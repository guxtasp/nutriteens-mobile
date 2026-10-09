// src/features/adolescente/cartas/utils/cartas.ts
//
// Regras puras das Cartas dos 10 Passos do Guia (sem Supabase, sem React).
// O banco manda o catálogo (cartas_guia) e as cartas ganhas (cartas_usuario);
// aqui só juntamos as duas listas e calculamos o progresso do álbum.

export const TOTAL_PASSOS = 10;

export type CartaGuia = {
  id: string;
  /** 1 a 10, na ordem oficial do Guia */
  passo: number;
  /** chave da arte no app (cartas/data/cartasArte.ts) */
  codigo: string;
  titulo: string;
  /** o que o passo diz, em linguagem de adolescente */
  resumo: string;
  dica: string;
  comoGanhar: string;
  obtida: boolean;
  /** ganhou e ainda não abriu a carta */
  nova: boolean;
};

export type LinhaCartaGuia = {
  id: string;
  passo: number;
  codigo: string;
  titulo: string;
  resumo: string;
  dica: string;
  como_ganhar: string;
};

export type LinhaCartaUsuario = { carta_id: string; vista: boolean };

/** Junta catálogo + cartas ganhas, sempre na ordem dos passos (o álbum não muda de lugar). */
export function montarCartas(catalogo: LinhaCartaGuia[], ganhas: LinhaCartaUsuario[]): CartaGuia[] {
  const vistaPorCarta = new Map(ganhas.map((g) => [g.carta_id, g.vista]));
  return [...catalogo]
    .sort((a, b) => a.passo - b.passo)
    .map((c) => ({
      id: c.id,
      passo: c.passo,
      codigo: c.codigo,
      titulo: c.titulo,
      resumo: c.resumo,
      dica: c.dica,
      comoGanhar: c.como_ganhar,
      obtida: vistaPorCarta.has(c.id),
      nova: vistaPorCarta.get(c.id) === false,
    }));
}

export type ProgressoAlbum = { obtidas: number; total: number; fracao: number; completo: boolean };

export function progressoAlbum(cartas: CartaGuia[]): ProgressoAlbum {
  const total = cartas.length;
  const obtidas = cartas.filter((c) => c.obtida).length;
  return { obtidas, total, fracao: total === 0 ? 0 : obtidas / total, completo: total > 0 && obtidas === total };
}

export function contarNovas(cartas: CartaGuia[]): number {
  return cartas.filter((c) => c.nova).length;
}

/** "Passo 4" */
export function rotuloPasso(passo: number): string {
  return `Passo ${passo}`;
}

/** Texto do aviso no topo do álbum quando há cartas novas; null se não houver. */
export function textoCartasNovas(qtd: number): string | null {
  if (qtd <= 0) return null;
  return qtd === 1 ? 'Você ganhou 1 carta nova!' : `Você ganhou ${qtd} cartas novas!`;
}
