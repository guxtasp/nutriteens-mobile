// src/features/adolescente/triagem/ebia/utils/montarRespostas.ts
//
// Monta as linhas de `respostas_ebia` no formato REAL da tabela
// (avaliacao_ebia_id, numero_pergunta, resposta). O código antigo mandava
// user_id/pergunta_id, colunas que não existem.
import { PERGUNTAS_EBIA } from '../data/ebiaData';

export function montarRespostasEbia(avaliacaoEbiaId: string, respostas: boolean[]) {
  return respostas.map((resposta, i) => ({
    avaliacao_ebia_id: avaliacaoEbiaId,
    numero_pergunta: PERGUNTAS_EBIA[i].id,
    resposta,
  }));
}
