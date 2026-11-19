// src/features/nutricionista/navigation/nutricionistaMenu.ts
//
// Menu do painel da Nutricionista, agrupado por tarefa. "Exportar dados" já existia como
// rota (NutriExportar, liberada no banco para este papel), mas não tinha entrada no menu.
// O Catálogo (alimentos e pratos) vale para a nutricionista desde migration_catalogo_nutricionista.sql.
import type { ConfigPainel } from '../../../shared/painel/types';

export const NUTRICIONISTA_PAINEL: ConfigPainel = {
  papelLabel: 'Nutricionista',
  rotaInicial: 'NutricionistaDashboard',
  rotaReceitas: 'NutriReceitas',
  itens: [
    { secao: 'Visão geral', rota: 'NutricionistaDashboard', label: 'Dashboard', rotuloCurto: 'Início', icone: 'grid-outline' },
    { secao: 'Visão geral', rota: 'NutriAnalytics', label: 'Analytics', icone: 'stats-chart-outline' },

    { secao: 'Acompanhamento', rota: 'ParticipantesList', label: 'Participantes', rotuloCurto: 'Particip.', icone: 'people-outline', rotasFilhas: ['ParticipanteDetalhe'] },

    { secao: 'Revisão de conteúdo', rota: 'NutriAprovacoes', label: 'Aprovações', icone: 'checkmark-done-outline' },
    { secao: 'Revisão de conteúdo', rota: 'ConteudoList', label: 'Conteúdos', icone: 'document-text-outline', rotasFilhas: ['ConteudoDetalhe', 'LicaoPreview', 'EditarLicao'] },
    { secao: 'Revisão de conteúdo', rota: 'NutriTrilhas', label: 'Trilhas', icone: 'map-outline', rotasFilhas: ['EditarTrilha', 'TrilhaPreview'] },
    // Catálogo: alimentos, pratos e receitas em abas (as receitas continuam em NutriReceitas)
    { secao: 'Revisão de conteúdo', rota: 'AlimentosList', label: 'Catálogo', icone: 'nutrition-outline', rotasFilhas: ['AlimentoForm', 'NutriReceitas', 'EditarReceita', 'ReceitaPreview'] },
    { secao: 'Revisão de conteúdo', rota: 'NutriTrocas', label: 'Alternativas', icone: 'swap-horizontal-outline', rotasFilhas: ['EditarTroca'] },
    { secao: 'Revisão de conteúdo', rota: 'NutriDesafios', label: 'Desafios', icone: 'trophy-outline' },
    { secao: 'Revisão de conteúdo', rota: 'NutriProdutosScanner', label: 'Produtos do scanner', rotuloCurto: 'Scanner', icone: 'barcode-outline', selo: 'SCANNER_PENDENTES' },
    { secao: 'Revisão de conteúdo', rota: 'GuiaCriacao', label: 'Como criar', rotuloCurto: 'Guia', icone: 'school-outline' },

    { secao: 'Dados e conta', rota: 'NutriExportar', label: 'Exportar dados', rotuloCurto: 'Exportar', icone: 'download-outline' },
    { secao: 'Dados e conta', rota: 'NutriConfiguracoes', label: 'Configurações', rotuloCurto: 'Ajustes', icone: 'settings-outline' },
  ],
};
