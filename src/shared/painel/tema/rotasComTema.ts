// src/shared/painel/tema/rotasComTema.ts
//
// Rotas do painel que leem as cores do tema (claro/escuro). Hoje todas as telas do painel já
// foram migradas. Se surgir uma tela nova com cores fixas, deixe-a FORA desta lista: no tema
// escuro ela aparece dentro de uma "ilha" clara, e o texto continua legível.
export const ROTAS_COM_TEMA: ReadonlySet<string> = new Set([
  'AdminAuditoria',
  'AdminConfiguracoes',
  'AdminConteudos',
  'AdminDashboard',
  'AdminDesafios',
  'AdminExportar',
  'AdminImagensJogos',
  'AdminModeracao',
  'AdminNutricionistas',
  'AdminProdutosScanner',
  'AdminReceitas',
  'AdminTrilhas',
  'AdminTrocas',
  'AlimentoForm',
  'AlimentosList',
  'ConteudoDetalhe',
  'ConteudoList',
  'EditarLicao',
  'EditarReceita',
  'EditarTrilha',
  'EditarTroca',
  'GuiaCriacao',
  'LicaoPreview',
  'Metricas',
  'NutriAnalytics',
  'NutriAprovacoes',
  'NutriDesafios',
  'NutriExportar',
  'NutriProdutosScanner',
  'NutriReceitas',
  'NutriTrilhas',
  'NutriTrocas',
  'NutricionistaDashboard',
  'ParticipanteDetalhe',
  'ParticipantesList',
  'ReceitaPreview',
  'TrilhaPreview',
  'UsuarioDetalhe',
  'Usuarios',
]);

export function rotaTemTema(nomeRota: string): boolean {
  return ROTAS_COM_TEMA.has(nomeRota);
}
