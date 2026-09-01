-- =====================================================================
-- SEED INCREMENTAL: item de embutido/hambúrguer
-- Rodar uma vez no SQL Editor do Supabase, depois de alimentosBasicos.sql.
-- Sem isso, o marcador Sisvan "embutidos" (CARNES_E_OVOS + ULTRAPROCESSADO)
-- nunca vai pontuar, porque hoje nenhum item do catálogo cai nessa
-- combinação (ver calcularMarcadoresSisvan em recordatorioService.ts).
-- Ajustem depois pelo painel de admin (Catálogo de alimentos) se quiserem
-- outro nome/refeições.
-- =====================================================================

INSERT INTO public.alimentos (nome, eh_prato_composto, classificacao_nova, acessivel_ebia, grupos_alimentares, tipos_refeicao_recordatorio) VALUES
('Embutido/hambúrguer (salsicha, presunto, mortadela...)', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR', 'LANCHE_TARDE']::enum_tipo_refeicao[]);
