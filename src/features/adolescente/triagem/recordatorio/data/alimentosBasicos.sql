-- =====================================================================
-- SEED: ALIMENTOS COMUNS PARA O RECORDATÓRIO (BASE INICIAL)
-- Rodar uma vez no SQL Editor do Supabase, depois do schema principal e
-- depois de migration_tipos_refeicao_recordatorio.sql (que cria a coluna
-- tipos_refeicao_recordatorio usada abaixo).
-- ~45 itens cobrindo as refeições do dia, com base em hábitos alimentares
-- brasileiros comuns e no Quadro 1 do artigo de Teixeira, Venâncio & Soares (2024).
-- Ajustem/removam itens depois pelo painel de admin do app (Catálogo de
-- alimentos), inclusive quais refeições cada um deve aparecer no
-- Recordatório — isso aqui é só o ponto de partida pra não começar do
-- catálogo vazio.
-- =====================================================================

INSERT INTO public.alimentos (nome, eh_prato_composto, classificacao_nova, acessivel_ebia, grupos_alimentares, tipos_refeicao_recordatorio) VALUES
('Pão francês', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Pão de forma', FALSE, 'PROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Pão de queijo', FALSE, 'PROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS', 'LEITE_E_DERIVADOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Tapioca', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Cuscuz', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Leite', FALSE, 'IN_NATURA', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA', 'CEIA']::enum_tipo_refeicao[]),
('Café com leite', FALSE, 'IN_NATURA', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Iogurte', FALSE, 'PROCESSADO', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA', 'LANCHE_MANHA', 'CEIA']::enum_tipo_refeicao[]),
('Queijo', FALSE, 'PROCESSADO', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Manteiga/margarina', FALSE, 'PROCESSADO', TRUE, ARRAY['OLEOS_E_GORDURAS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Ovo', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Fruta (banana, maçã, mamão...)', FALSE, 'IN_NATURA', TRUE, ARRAY['FRUTAS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA', 'LANCHE_MANHA', 'CEIA']::enum_tipo_refeicao[]),
('Suco natural', FALSE, 'IN_NATURA', TRUE, ARRAY['FRUTAS']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA', 'LANCHE_MANHA', 'ALMOCO', 'LANCHE_TARDE']::enum_tipo_refeicao[]),
('Cereal matinal', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS', 'ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Bolacha/biscoito', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['LANCHE_MANHA', 'CEIA']::enum_tipo_refeicao[]),
('Bolo', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['LANCHE_TARDE']::enum_tipo_refeicao[]),
('Salgado (coxinha, pastel...)', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['LANCHE_TARDE']::enum_tipo_refeicao[]),
('Sanduíche natural', TRUE, 'PROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS', 'CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['LANCHE_MANHA', 'JANTAR']::enum_tipo_refeicao[]),
('Mel', FALSE, 'IN_NATURA', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Geleia', FALSE, 'PROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['CAFE_DA_MANHA']::enum_tipo_refeicao[]),
('Arroz', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Feijão', FALSE, 'IN_NATURA', TRUE, ARRAY['LEGUMINOSAS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Macarrão', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Batata', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Mandioca/aipim', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['ALMOCO']::enum_tipo_refeicao[]),
('Carne bovina', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Frango', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Carne suína', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Peixe', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Salada (alface, tomate...)', FALSE, 'IN_NATURA', TRUE, ARRAY['LEGUMES_E_VERDURAS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Legumes cozidos', FALSE, 'IN_NATURA', TRUE, ARRAY['LEGUMES_E_VERDURAS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Miojo/macarrão instantâneo', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Ovo frito/mexido', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'JANTAR']::enum_tipo_refeicao[]),
('Refrigerante', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['BEBIDAS', 'ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['ALMOCO', 'LANCHE_TARDE']::enum_tipo_refeicao[]),
('Sorvete', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['LANCHE_TARDE']::enum_tipo_refeicao[]),
('Balas/doces', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['LANCHE_TARDE']::enum_tipo_refeicao[]),
('Chocolate', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[], ARRAY['LANCHE_TARDE']::enum_tipo_refeicao[]),
('Barra de cereal', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['LANCHE_MANHA']::enum_tipo_refeicao[]),
('Salgadinho de pacote', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[], ARRAY['LANCHE_TARDE']::enum_tipo_refeicao[]),
('Açaí', FALSE, 'PROCESSADO', TRUE, ARRAY['FRUTAS']::enum_grupo_alimentar[], ARRAY['LANCHE_TARDE']::enum_tipo_refeicao[]),
('Castanhas/amendoim', FALSE, 'IN_NATURA', TRUE, ARRAY['OLEAGINOSAS_E_SEMENTES']::enum_grupo_alimentar[], ARRAY['LANCHE_MANHA']::enum_tipo_refeicao[]),
('Chá', FALSE, 'IN_NATURA', TRUE, ARRAY['BEBIDAS']::enum_grupo_alimentar[], ARRAY['CEIA']::enum_tipo_refeicao[]),
('Vitamina de fruta', FALSE, 'IN_NATURA', TRUE, ARRAY['FRUTAS', 'LEITE_E_DERIVADOS']::enum_grupo_alimentar[], ARRAY['CEIA']::enum_tipo_refeicao[]);