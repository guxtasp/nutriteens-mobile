-- =====================================================================
-- SEED: ALIMENTOS COMUNS PARA O RECORDATÓRIO (BASE INICIAL)
-- Rodar uma vez no SQL Editor do Supabase, depois do schema principal.
-- ~45 itens cobrindo as refeições do dia, com base em hábitos alimentares
-- brasileiros comuns e no Quadro 1 do artigo de Teixeira, Venâncio & Soares (2024).
-- Ajustem/removam itens depois pelo Table Editor do Supabase sem problema --
-- isso é só o ponto de partida pra não começar do catálogo vazio.
-- =====================================================================

INSERT INTO public.alimentos (nome, eh_prato_composto, classificacao_nova, acessivel_ebia, grupos_alimentares) VALUES
('Pão francês', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Pão de forma', FALSE, 'PROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Pão de queijo', FALSE, 'PROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS', 'LEITE_E_DERIVADOS']::enum_grupo_alimentar[]),
('Tapioca', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Cuscuz', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Leite', FALSE, 'IN_NATURA', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[]),
('Café com leite', FALSE, 'IN_NATURA', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[]),
('Iogurte', FALSE, 'PROCESSADO', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[]),
('Queijo', FALSE, 'PROCESSADO', TRUE, ARRAY['LEITE_E_DERIVADOS']::enum_grupo_alimentar[]),
('Manteiga/margarina', FALSE, 'PROCESSADO', TRUE, ARRAY['OLEOS_E_GORDURAS']::enum_grupo_alimentar[]),
('Ovo', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[]),
('Fruta (banana, maçã, mamão...)', FALSE, 'IN_NATURA', TRUE, ARRAY['FRUTAS']::enum_grupo_alimentar[]),
('Suco natural', FALSE, 'IN_NATURA', TRUE, ARRAY['FRUTAS']::enum_grupo_alimentar[]),
('Cereal matinal', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS', 'ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Bolacha/biscoito', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Bolo', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Salgado (coxinha, pastel...)', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Sanduíche natural', TRUE, 'PROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS', 'CARNES_E_OVOS']::enum_grupo_alimentar[]),
('Mel', FALSE, 'IN_NATURA', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Geleia', FALSE, 'PROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Arroz', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Feijão', FALSE, 'IN_NATURA', TRUE, ARRAY['LEGUMINOSAS']::enum_grupo_alimentar[]),
('Macarrão', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Batata', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Mandioca/aipim', FALSE, 'IN_NATURA', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Carne bovina', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[]),
('Frango', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[]),
('Carne suína', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[]),
('Peixe', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[]),
('Salada (alface, tomate...)', FALSE, 'IN_NATURA', TRUE, ARRAY['LEGUMES_E_VERDURAS']::enum_grupo_alimentar[]),
('Legumes cozidos', FALSE, 'IN_NATURA', TRUE, ARRAY['LEGUMES_E_VERDURAS']::enum_grupo_alimentar[]),
('Miojo/macarrão instantâneo', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Ovo frito/mexido', FALSE, 'IN_NATURA', TRUE, ARRAY['CARNES_E_OVOS']::enum_grupo_alimentar[]),
('Refrigerante', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['BEBIDAS', 'ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Sorvete', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Balas/doces', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Chocolate', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['ACUCARES_E_DOCES']::enum_grupo_alimentar[]),
('Barra de cereal', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Salgadinho de pacote', FALSE, 'ULTRAPROCESSADO', TRUE, ARRAY['CEREAIS_E_TUBERCULOS']::enum_grupo_alimentar[]),
('Açaí', FALSE, 'PROCESSADO', TRUE, ARRAY['FRUTAS']::enum_grupo_alimentar[]),
('Castanhas/amendoim', FALSE, 'IN_NATURA', TRUE, ARRAY['OLEAGINOSAS_E_SEMENTES']::enum_grupo_alimentar[]),
('Chá', FALSE, 'IN_NATURA', TRUE, ARRAY['BEBIDAS']::enum_grupo_alimentar[]),
('Vitamina de fruta', FALSE, 'IN_NATURA', TRUE, ARRAY['FRUTAS', 'LEITE_E_DERIVADOS']::enum_grupo_alimentar[]);