// src/features/adolescente/home/utils/perdaSequencia.ts
//
// Regra pura (sem React, sem storage) de "o aluno perdeu a sequência?".
//
// A sequência só diminui quando quebra (ver calcularProximoEstadoSequencia), então
// basta comparar com a última sequência que o aluno VIU nesse aparelho: se a de agora
// é menor, ela quebrou. Isso cobre tanto "caiu para 0" quanto "quebrou e já recomeçou
// em 1 no mesmo dia". Sem registro anterior (primeiro acesso, app reinstalado) ou com
// sequência anterior zerada, não há o que perder.

export type ResultadoPerdaSequencia = {
  perdeu: boolean;
  /** tamanho da sequência que foi perdida (0 quando não perdeu) */
  diasPerdidos: number;
};

export function detectarPerdaSequencia(ultimaVista: number | null, atual: number): ResultadoPerdaSequencia {
  if (ultimaVista === null || ultimaVista <= 0 || atual >= ultimaVista) {
    return { perdeu: false, diasPerdidos: 0 };
  }
  return { perdeu: true, diasPerdidos: ultimaVista };
}