// src/shared/utils/calcularIdade.ts
export function calcularIdade(dataNascimentoISO: string): string {
  const nascimento = new Date(dataNascimentoISO); //cria um objeto com a data de nascimento a partir da string ISO
  const hoje = new Date(); // pega a data atual

  let anos = hoje.getFullYear() - nascimento.getFullYear(); // calcula a diferença entre anos
  let meses = hoje.getMonth() - nascimento.getMonth(); // calcula a diferença entre meses
  let dias = hoje.getDate() - nascimento.getDate(); // calcula a diferença entre dias

  if (dias < 0) { // se a diferença de dias for negativa, significa que o último mês não foi completo
    meses -= 1; // diminui a diferença de meses em 1
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate(); // pega o último dia do mês anterior para ajustar a diferença de dias
    dias += ultimoDiaMesAnterior; // ajusta a diferença de dias somando o último dia do mês anterior
  }
  if (meses < 0) { // se a diferença de meses for negativa, significa que o último ano não foi completo
    anos -= 1; // diminui a diferença de anos em 1
    meses += 12; // ajusta a diferença de meses somando 12
  }

  const partes: string[] = []; // cria um array de strings para armazenar as partes da idade (anos, meses, dias)
  partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`); // adiciona a parte de anos ao array, usando singular ou plural conforme necessário
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`); // adiciona a parte de meses ao array, usando singular ou plural conforme necessário
  if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`); // adiciona a parte de dias ao array, usando singular ou plural conforme necessário

  return partes.join(', ').replace(/, ([^,]*)$/, ' e $1'); // junta as partes da idade em uma string, separando por vírgulas e substituindo a última vírgula por "e" para uma leitura mais natural
}