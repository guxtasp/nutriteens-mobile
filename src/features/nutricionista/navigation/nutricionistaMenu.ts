// src/features/nutricionista/navigation/nutricionistaMenu.ts
import type { ConfigPainel } from '../../../shared/painel/types';

export const NUTRICIONISTA_PAINEL: ConfigPainel = {
  papelLabel: 'Nutricionista',
  rotaInicial: 'NutricionistaDashboard',
  itens: [
    { rota: 'NutricionistaDashboard', label: 'Dashboard', icone: 'grid-outline' },
    { rota: 'ParticipantesList', label: 'Participantes', icone: 'people-outline', rotasFilhas: ['ParticipanteDetalhe'] },
    { rota: 'NutriAprovacoes', label: 'Aprovações', icone: 'checkmark-done-outline' },
    { rota: 'ConteudoList', label: 'Conteúdos', icone: 'document-text-outline', rotasFilhas: ['ConteudoDetalhe', 'LicaoPreview', 'EditarLicao'] },
    { rota: 'NutriReceitas', label: 'Receitas', icone: 'restaurant-outline', rotasFilhas: ['EditarReceita'] },
    { rota: 'NutriTrilhas', label: 'Trilhas', icone: 'map-outline', rotasFilhas: ['EditarTrilha'] },
    { rota: 'NutriDesafios', label: 'Desafios', icone: 'trophy-outline' },
    { rota: 'NutriAnalytics', label: 'Analytics', icone: 'stats-chart-outline' },
  ],
};
