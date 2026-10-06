// src/features/admin/navigation/adminMenu.ts
import type { ConfigPainel } from '../../../shared/painel/types';

export const ADMIN_PAINEL: ConfigPainel = {
  papelLabel: 'Administração',
  rotaInicial: 'AdminDashboard',
  itens: [
    { rota: 'AdminDashboard', label: 'Dashboard', icone: 'grid-outline' },
    { rota: 'Usuarios', label: 'Usuários', icone: 'people-outline', rotasFilhas: ['UsuarioDetalhe'] },
    { rota: 'AdminNutricionistas', label: 'Nutricionistas', icone: 'medkit-outline' },
    { rota: 'AlimentosList', label: 'Alimentos', icone: 'nutrition-outline', rotasFilhas: ['AlimentoForm'] },
    { rota: 'AdminReceitas', label: 'Receitas', icone: 'restaurant-outline', rotasFilhas: ['EditarReceita'] },
    { rota: 'AdminConteudos', label: 'Conteúdos', icone: 'document-text-outline', rotasFilhas: ['ConteudoDetalhe', 'LicaoPreview', 'EditarLicao'] },
    { rota: 'AdminTrilhas', label: 'Trilhas', icone: 'map-outline', rotasFilhas: ['EditarTrilha'] },
    { rota: 'AdminDesafios', label: 'Desafios', icone: 'trophy-outline' },
    { rota: 'AdminModeracao', label: 'Moderação', icone: 'shield-checkmark-outline' },
    { rota: 'Metricas', label: 'Analytics', icone: 'stats-chart-outline' },
    { rota: 'AdminAuditoria', label: 'Auditoria', icone: 'receipt-outline' },
    { rota: 'AdminConfiguracoes', label: 'Configurações', icone: 'settings-outline' },
  ],
};
