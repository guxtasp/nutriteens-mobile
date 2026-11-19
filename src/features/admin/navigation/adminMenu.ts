// src/features/admin/navigation/adminMenu.ts
//
// Menu do painel da Administração, agrupado por tarefa (o menu plano tinha 15 itens
// sem ordem clara). As rotas são as mesmas registradas no AdminNavigator.
import type { ConfigPainel } from '../../../shared/painel/types';

export const ADMIN_PAINEL: ConfigPainel = {
  papelLabel: 'Administração',
  rotaInicial: 'AdminDashboard',
  rotaReceitas: 'AdminReceitas',
  itens: [
    { secao: 'Visão geral', rota: 'AdminDashboard', label: 'Dashboard', rotuloCurto: 'Início', icone: 'grid-outline' },
    { secao: 'Visão geral', rota: 'Metricas', label: 'Analytics', icone: 'stats-chart-outline' },

    { secao: 'Pessoas', rota: 'Usuarios', label: 'Usuários', icone: 'people-outline', rotasFilhas: ['UsuarioDetalhe'] },
    { secao: 'Pessoas', rota: 'AdminNutricionistas', label: 'Nutricionistas', rotuloCurto: 'Nutris', icone: 'medkit-outline' },
    { secao: 'Pessoas', rota: 'AdminModeracao', label: 'Moderação', icone: 'shield-checkmark-outline' },

    { secao: 'Conteúdo', rota: 'AdminConteudos', label: 'Conteúdos', icone: 'document-text-outline', rotasFilhas: ['ConteudoDetalhe', 'LicaoPreview', 'EditarLicao'] },
    { secao: 'Conteúdo', rota: 'AdminTrilhas', label: 'Trilhas', icone: 'map-outline', rotasFilhas: ['EditarTrilha', 'TrilhaPreview'] },
    { secao: 'Conteúdo', rota: 'AlimentosList', label: 'Catálogo', icone: 'nutrition-outline', rotasFilhas: ['AlimentoForm', 'AdminReceitas', 'EditarReceita', 'ReceitaPreview'] },
    { secao: 'Conteúdo', rota: 'AdminTrocas', label: 'Alternativas', icone: 'swap-horizontal-outline', rotasFilhas: ['EditarTroca'] },
    { secao: 'Conteúdo', rota: 'AdminDesafios', label: 'Desafios', icone: 'trophy-outline' },
    { secao: 'Conteúdo', rota: 'AdminImagensJogos', label: 'Imagens dos jogos', rotuloCurto: 'Imagens', icone: 'images-outline' },
    { secao: 'Conteúdo', rota: 'AdminProdutosScanner', label: 'Produtos do scanner', rotuloCurto: 'Scanner', icone: 'barcode-outline', selo: 'SCANNER_PENDENTES' },
    { secao: 'Conteúdo', rota: 'GuiaCriacao', label: 'Como criar', rotuloCurto: 'Guia', icone: 'school-outline' },

    { secao: 'Dados e sistema', rota: 'AdminExportar', label: 'Exportar dados', rotuloCurto: 'Exportar', icone: 'download-outline' },
    { secao: 'Dados e sistema', rota: 'AdminAuditoria', label: 'Auditoria', icone: 'receipt-outline' },
    { secao: 'Dados e sistema', rota: 'AdminConfiguracoes', label: 'Configurações', rotuloCurto: 'Ajustes', icone: 'settings-outline' },
  ],
};
