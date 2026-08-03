// src/shared/utils/calcularIdade.ts
export function calcularIdade(dataNascimentoISO: string): string {
  const nascimento = new Date(dataNascimentoISO);
  const hoje = new Date();

  let anos = hoje.getFullYear() - nascimento.getFullYear();
  let meses = hoje.getMonth() - nascimento.getMonth();
  let dias = hoje.getDate() - nascimento.getDate();

  if (dias < 0) {
    meses -= 1;
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
    dias += ultimoDiaMesAnterior;
  }
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }

  const partes: string[] = [];
  partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
  if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`);

  return partes.join(', ').replace(/, ([^,]*)$/, ' e $1');
}