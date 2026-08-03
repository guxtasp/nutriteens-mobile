export function formatarDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

const LABEL_DIA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export type DiaSemanaBase = { label: string; numero: number; data: string };

/**
 * Retorna os 7 dias (Seg a Dom) da semana da data de referência.
 * Por padrão usa a data atual do dispositivo.
 */
export function getSemanaAtual(referencia: Date = new Date()): DiaSemanaBase[] {
  const diaSemanaHoje = referencia.getDay(); // 0 (dom) a 6 (sab)
  const deslocamentoParaSegunda = diaSemanaHoje === 0 ? -6 : 1 - diaSemanaHoje;

  const segunda = new Date(referencia);
  segunda.setDate(referencia.getDate() + deslocamentoParaSegunda);
  segunda.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + index);
    return {
      label: LABEL_DIA_SEMANA[data.getDay()],
      numero: data.getDate(),
      data: formatarDataISO(data),
    };
  });
}