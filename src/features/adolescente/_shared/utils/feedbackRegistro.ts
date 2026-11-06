// src/features/adolescente/_shared/utils/feedbackRegistro.ts
//
// Mensagens de retorno ao registrar ÁGUA e ATIVIDADE FÍSICA (item 4.2 da auditoria).
// Funções puras. Tom sempre positivo (decisão de produto): sem culpa, sem comparação
// com outras pessoas, sem foco em peso ou aparência. Mostra o que já foi feito e,
// quando falta, o quanto falta — nunca "você não conseguiu".
export type FeedbackRegistro = { titulo: string; mensagem: string };

export function formatarMl(ml: number): string {
  if (ml < 1000) return `${Math.round(ml)} ml`;
  const litros = Math.round(ml / 100) / 10; // 1 casa
  return `${String(litros).replace('.', ',')} L`;
}

export function feedbackAgua(p: { registradoMl: number; totalAntesMl: number; totalDepoisMl: number; metaMl: number }): FeedbackRegistro {
  const { registradoMl, totalAntesMl, totalDepoisMl, metaMl } = p;
  const falta = Math.max(0, metaMl - totalDepoisMl);
  const pct = metaMl > 0 ? totalDepoisMl / metaMl : 0;

  if (totalAntesMl < metaMl && totalDepoisMl >= metaMl) {
    return { titulo: 'Meta batida!', mensagem: `Você chegou a ${formatarMl(totalDepoisMl)} hoje e completou a meta de água. Seu corpo agradece!` };
  }
  if (totalDepoisMl >= metaMl) {
    return { titulo: 'Hidratação em dia!', mensagem: `A meta de hoje já estava completa. Você está em ${formatarMl(totalDepoisMl)} hoje.` };
  }
  if (pct >= 0.75) {
    return { titulo: 'Quase lá!', mensagem: `+${formatarMl(registradoMl)} registrados. Faltam só ${formatarMl(falta)} para a meta de hoje.` };
  }
  if (pct >= 0.5) {
    return { titulo: 'Mais da metade!', mensagem: `+${formatarMl(registradoMl)} registrados. Faltam ${formatarMl(falta)} para a meta de hoje.` };
  }
  return { titulo: 'Boa!', mensagem: `+${formatarMl(registradoMl)} registrados. Você já está em ${formatarMl(totalDepoisMl)} hoje.` };
}

function textoAtividades(quantidade: number): string {
  return quantidade === 1 ? '1 atividade' : `${quantidade} atividades`;
}

/**
 * `totalHojeMin` e `alvoMin` só existem com internet; sem eles (ex.: registro guardado no
 * celular) a mensagem fala só do que foi registrado agora.
 */
export function feedbackAtividade(p: {
  quantidade: number;
  minutosRegistrados: number;
  totalHojeMin?: number | null;
  alvoMin?: number | null;
}): FeedbackRegistro {
  const { quantidade, minutosRegistrados, totalHojeMin, alvoMin } = p;
  const agora = `${textoAtividades(quantidade)} (${minutosRegistrados} min)`;

  if (totalHojeMin == null || !alvoMin) {
    return { titulo: 'Boa!', mensagem: `Você registrou ${agora}. Cada movimento conta.` };
  }
  const antes = totalHojeMin - minutosRegistrados;
  if (antes < alvoMin && totalHojeMin >= alvoMin) {
    return { titulo: 'Meta do dia batida!', mensagem: `Você registrou ${agora} e chegou a ${totalHojeMin} min hoje. Meta de ${alvoMin} min cumprida!` };
  }
  if (totalHojeMin >= alvoMin) {
    return { titulo: 'Que energia!', mensagem: `Você registrou ${agora}. Já são ${totalHojeMin} min hoje, acima da meta de ${alvoMin} min.` };
  }
  return {
    titulo: 'Boa!',
    mensagem: `Você registrou ${agora}. Faltam ${alvoMin - totalHojeMin} min para a meta de hoje, e qualquer movimento conta.`,
  };
}
