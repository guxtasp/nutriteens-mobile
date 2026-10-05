// src/features/adolescente/trilha/utils/praticaReal.ts
//
// A lição "Prática Real" (tipo atividade_rastreavel) pode checar três
// hábitos (ver verificarHabitoRecente em trilhaService): atividade física,
// água e alimentação. A tela de lição só tratava atividade física — esta
// tabela resolve texto, ícone e destino do botão por hábito.
export type RotaPratica = 'AtividadeFisica' | 'ConsumoAgua' | 'TipoRefeicao';

export type ConfigPraticaReal = {
  registroDe: string; // "um registro de ___"
  botao: string;
  icone: 'walk-outline' | 'water-outline' | 'restaurant-outline';
  rota: RotaPratica;
};

const CONFIG: Record<string, ConfigPraticaReal> = {
  atividade_fisica: { registroDe: 'atividade física', botao: 'Registrar atividade física', icone: 'walk-outline', rota: 'AtividadeFisica' },
  agua: { registroDe: 'consumo de água', botao: 'Registrar água', icone: 'water-outline', rota: 'ConsumoAgua' },
  alimentacao: { registroDe: 'refeição', botao: 'Registrar refeição', icone: 'restaurant-outline', rota: 'TipoRefeicao' },
};

// Hábito nulo/desconhecido cai em atividade física: é o comportamento que
// a tela tinha antes, então nada muda pra lições já cadastradas.
export function configPraticaReal(tipoHabito: string | null): ConfigPraticaReal {
  return (tipoHabito && CONFIG[tipoHabito]) || CONFIG.atividade_fisica;
}
