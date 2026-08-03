// src/shared/utils/saudacao.ts

type PeriodoDia = 'madrugada' | 'manha' | 'tarde' | 'noite';

const FRASES: Record<PeriodoDia, string[]> = {
  madrugada: [
    'Ainda de pé? Bora cuidar de você.',
    'Boa madrugada! Que tal um pouco de água?',
    'Acordou cedo hoje, hein?',
  ],
  manha: [
    'Bom dia! Já fez sua missão?',
    'Bom dia! Vamos começar o dia bem?',
    'Bom dia! Que tal registrar seu café da manhã?',
  ],
  tarde: [
    'Boa tarde! Como está indo o seu dia?',
    'Boa tarde! Já bebeu água hoje?',
    'Boa tarde! Vamos registrar sua atividade?',
  ],
  noite: [
    'Boa noite! Como foi seu dia?',
    'Boa noite! Já registrou tudo de hoje?',
    'Boa noite! Falta pouco pra fechar o dia.',
  ],
};

export function getPeriodoDoDia(hora: number): PeriodoDia {
  if (hora >= 0 && hora < 6) return 'madrugada';
  if (hora >= 6 && hora < 12) return 'manha';
  if (hora >= 12 && hora < 18) return 'tarde';
  return 'noite';
}

export function sortearSaudacao(referencia: Date = new Date()): string {
  const periodo = getPeriodoDoDia(referencia.getHours());
  const opcoes = FRASES[periodo];
  const indice = Math.floor(Math.random() * opcoes.length);
  return opcoes[indice];
}