// src/features/adolescente/triagem/recordatorio/utils/dataReferencia.ts
//
// O recordatório pergunta sobre o dia de ONTEM ("O que você comeu no café da
// manhã de ontem?"), então é essa a data gravada. Usa o fuso do aparelho —
// o antigo `new Date().toISOString().slice(0, 10)` devolvia a data em UTC,
// que no Brasil (UTC-3) já virava o dia seguinte depois das 21h.
export function ontemLocalISO(agora: Date = new Date()): string {
  const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 1);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
