-- =====================================================================
-- MIGRATION: liga cada alimento aos tipos de refeição em que ele deve
-- aparecer no Recordatório, substituindo o mapeamento fixo que hoje
-- vive em alimentosPorRefeicao.ts (front-end).
--
-- Reaproveita o enum_tipo_refeicao já usado em refeicoes.tipo — não cria
-- tipo novo.
-- =====================================================================

ALTER TABLE public.alimentos
  ADD COLUMN tipos_refeicao_recordatorio enum_tipo_refeicao[] NOT NULL DEFAULT '{}';

-- Índice GIN pra suportar a busca `.contains()` usada no app
-- (equivalente a WHERE tipos_refeicao_recordatorio @> ARRAY['ALMOCO']).
CREATE INDEX idx_alimentos_tipos_refeicao_recordatorio
  ON public.alimentos USING GIN (tipos_refeicao_recordatorio);

-- ---------------------------------------------------------------------
-- Backfill: reproduz o mapeamento que estava em alimentosPorRefeicao.ts,
-- pra não perder o que já foi cadastrado via alimentosBasicos.sql.
-- Rodar uma vez, depois do ALTER acima. Se algum nome não existir mais
-- (foi renomeado/excluído pelo admin), a linha simplesmente não casa
-- com nada e não dá erro.
-- ---------------------------------------------------------------------

UPDATE public.alimentos SET tipos_refeicao_recordatorio = tipos_refeicao_recordatorio || '{CAFE_DA_MANHA}'
WHERE nome IN (
  'Pão francês', 'Pão de forma', 'Pão de queijo', 'Tapioca', 'Cuscuz',
  'Leite', 'Café com leite', 'Iogurte', 'Queijo', 'Manteiga/margarina',
  'Ovo', 'Fruta (banana, maçã, mamão...)', 'Suco natural', 'Cereal matinal',
  'Mel', 'Geleia'
);

UPDATE public.alimentos SET tipos_refeicao_recordatorio = tipos_refeicao_recordatorio || '{LANCHE_MANHA}'
WHERE nome IN (
  'Fruta (banana, maçã, mamão...)', 'Iogurte', 'Barra de cereal',
  'Bolacha/biscoito', 'Suco natural', 'Castanhas/amendoim', 'Sanduíche natural'
);

UPDATE public.alimentos SET tipos_refeicao_recordatorio = tipos_refeicao_recordatorio || '{ALMOCO}'
WHERE nome IN (
  'Arroz', 'Feijão', 'Macarrão', 'Batata', 'Mandioca/aipim',
  'Carne bovina', 'Frango', 'Carne suína', 'Peixe', 'Ovo frito/mexido',
  'Salada (alface, tomate...)', 'Legumes cozidos', 'Miojo/macarrão instantâneo',
  'Refrigerante', 'Suco natural'
);

UPDATE public.alimentos SET tipos_refeicao_recordatorio = tipos_refeicao_recordatorio || '{LANCHE_TARDE}'
WHERE nome IN (
  'Salgado (coxinha, pastel...)', 'Bolo', 'Sorvete', 'Balas/doces',
  'Chocolate', 'Salgadinho de pacote', 'Açaí', 'Suco natural', 'Refrigerante'
);

UPDATE public.alimentos SET tipos_refeicao_recordatorio = tipos_refeicao_recordatorio || '{JANTAR}'
WHERE nome IN (
  'Arroz', 'Feijão', 'Macarrão', 'Batata', 'Carne bovina', 'Frango',
  'Carne suína', 'Peixe', 'Ovo frito/mexido', 'Salada (alface, tomate...)',
  'Legumes cozidos', 'Miojo/macarrão instantâneo', 'Sanduíche natural'
);

UPDATE public.alimentos SET tipos_refeicao_recordatorio = tipos_refeicao_recordatorio || '{CEIA}'
WHERE nome IN (
  'Leite', 'Chá', 'Vitamina de fruta', 'Fruta (banana, maçã, mamão...)',
  'Bolacha/biscoito', 'Iogurte'
);
