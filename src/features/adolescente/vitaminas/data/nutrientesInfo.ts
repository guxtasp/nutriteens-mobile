// RF016 — conteúdo das páginas de vitaminas e minerais.
// ATENÇÃO: textos SUGERIDOS, escritos em linguagem simples para adolescentes.
// Precisam de revisão da nutricionista antes de ir para os usuários.
// Só entram os 13 micronutrientes (vitaminas e minerais) de alimento_nutrientes.
import type { NutrienteChave } from '../../alimentacao/utils/nutrientesPorGrupo';

export type NutrienteInfo = {
  chave: NutrienteChave;
  nome: string;
  simbolo: string;          // aparece no círculo (A, C, Fe...)
  tipo: 'VITAMINA' | 'MINERAL';
  paraQueServe: string;
  dica: string;
  /** 2ª linha do cartão da lista (curta). Rebrand 2026, pendente de revisão nutricional. */
  resumo: string;
  /** Destaque da página do nutriente ("SUPERPODER"). Pendente de revisão nutricional. */
  superpoder: string;
  /** "Combo que funciona": dois alimentos que vão bem juntos para este nutriente. */
  combo?: [string, string];
};

export const NUTRIENTES_INFO: NutrienteInfo[] = [
  { chave: 'vitamina_a', nome: 'Vitamina A', simbolo: 'A', tipo: 'VITAMINA',
    paraQueServe: 'Ajuda a enxergar bem (principalmente com pouca luz), cuida da pele e fortalece as defesas do corpo.',
    dica: 'Alimentos alaranjados e verde-escuros, como cenoura, abóbora e couve, costumam ser boas fontes.',
    resumo: 'Visão e defesas do corpo', superpoder: 'Visão no escuro' },
  { chave: 'vitamina_c', nome: 'Vitamina C', simbolo: 'C', tipo: 'VITAMINA',
    paraQueServe: 'Ajuda na cicatrização, fortalece as defesas do corpo e ajuda a aproveitar o ferro dos alimentos de origem vegetal.',
    dica: 'Comer uma fruta cítrica junto com o feijão ajuda o corpo a absorver mais ferro.',
    resumo: 'Defesas e ajuda a aproveitar o ferro', superpoder: 'Escudo de defesa', combo: ['Laranja', 'Feijão'] },
  { chave: 'vitamina_d', nome: 'Vitamina D', simbolo: 'D', tipo: 'VITAMINA',
    paraQueServe: 'Ajuda o corpo a absorver o cálcio, deixando ossos e dentes fortes.',
    dica: 'O corpo também produz vitamina D quando a pele recebe sol, sempre com os cuidados de proteção contra o sol forte.',
    resumo: 'Ajuda o cálcio a firmar os ossos', superpoder: 'Ossos firmes' },
  { chave: 'tiamina', nome: 'Vitamina B1 (tiamina)', simbolo: 'B1', tipo: 'VITAMINA',
    paraQueServe: 'Ajuda o corpo a transformar o que você come em energia e o sistema nervoso a funcionar bem.',
    dica: 'Aparece em alimentos comuns do dia a dia, como feijão e cereais integrais.',
    resumo: 'Transforma comida em energia', superpoder: 'Bateria do corpo' },
  { chave: 'riboflavina', nome: 'Vitamina B2 (riboflavina)', simbolo: 'B2', tipo: 'VITAMINA',
    paraQueServe: 'Ajuda a transformar alimento em energia e cuida da pele, da boca e dos olhos.',
    dica: 'Leite, ovos e folhas verde-escuras estão entre as boas fontes.',
    resumo: 'Energia, pele e olhos', superpoder: 'Energia e pele' },
  { chave: 'niacina', nome: 'Vitamina B3 (niacina)', simbolo: 'B3', tipo: 'VITAMINA',
    paraQueServe: 'Ajuda a transformar alimento em energia e cuida da pele e do sistema nervoso.',
    dica: 'Carnes, peixes e amendoim são boas fontes.',
    resumo: 'Energia e sistema nervoso', superpoder: 'Energia em dia' },
  { chave: 'piridoxina', nome: 'Vitamina B6 (piridoxina)', simbolo: 'B6', tipo: 'VITAMINA',
    paraQueServe: 'Ajuda o corpo a aproveitar as proteínas e o cérebro a funcionar bem.',
    dica: 'Banana, frango e batata estão entre as fontes.',
    resumo: 'Proteínas e cérebro funcionando', superpoder: 'Cérebro ligado' },
  { chave: 'calcio', nome: 'Cálcio', simbolo: 'Ca', tipo: 'MINERAL',
    paraQueServe: 'Deixa ossos e dentes fortes e ajuda músculos e nervos a funcionarem. A adolescência é a fase em que os ossos mais ganham massa.',
    dica: 'Leite, iogurte e queijo são as fontes mais conhecidas; algumas folhas verde-escuras também ajudam.',
    resumo: 'Ossos e dentes fortes', superpoder: 'Ossos e dentes' },
  { chave: 'ferro', nome: 'Ferro', simbolo: 'Fe', tipo: 'MINERAL',
    paraQueServe: 'Ajuda o sangue a levar oxigênio para o corpo todo. Quando falta, pode dar cansaço e dificuldade de concentração.',
    dica: 'Feijão, carnes e folhas verde-escuras são boas fontes; junto com uma fruta cítrica, o corpo absorve melhor.',
    resumo: 'Leva oxigênio pro corpo todo', superpoder: 'Leva oxigênio pro corpo todo', combo: ['Feijão', 'Laranja'] },
  { chave: 'magnesio', nome: 'Magnésio', simbolo: 'Mg', tipo: 'MINERAL',
    paraQueServe: 'Ajuda músculos, nervos e ossos e participa da produção de energia.',
    dica: 'Castanhas, sementes e feijão são ótimas fontes.',
    resumo: 'Músculos, nervos e energia', superpoder: 'Músculos em dia' },
  { chave: 'fosforo', nome: 'Fósforo', simbolo: 'P', tipo: 'MINERAL',
    paraQueServe: 'Trabalha junto com o cálcio para formar ossos e dentes e ajuda o corpo a produzir energia.',
    dica: 'Está em leite, carnes, ovos e feijão: dá para ter bastante só com a comida do dia a dia.',
    resumo: 'Parceiro do cálcio nos ossos', superpoder: 'Parceiro do cálcio' },
  { chave: 'potassio', nome: 'Potássio', simbolo: 'K', tipo: 'MINERAL',
    paraQueServe: 'Ajuda os músculos (inclusive o coração) e o equilíbrio de líquidos e da pressão no corpo.',
    dica: 'Banana, feijão e legumes são boas fontes.',
    resumo: 'Músculos e coração no ritmo', superpoder: 'Coração no ritmo' },
  { chave: 'zinco', nome: 'Zinco', simbolo: 'Zn', tipo: 'MINERAL',
    paraQueServe: 'Ajuda no crescimento, na cicatrização e nas defesas do corpo.',
    dica: 'Carnes, ovos, feijão e castanhas são boas fontes.',
    resumo: 'Crescimento e cicatrização', superpoder: 'Crescer e cicatrizar' },
];

export function infoDoNutriente(chave: NutrienteChave): NutrienteInfo | undefined {
  return NUTRIENTES_INFO.find((n) => n.chave === chave);
}
