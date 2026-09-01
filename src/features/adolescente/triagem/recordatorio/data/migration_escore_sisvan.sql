-- =====================================================================
-- MIGRATION: Escore Sisvan no recordatório alimentar
-- Rodar uma vez no SQL Editor do Supabase.
-- Adiciona só duas colunas em recordatorios_alimentares (nenhuma tabela
-- nova, nenhum campo novo em `alimentos`). Os dois escores são calculados
-- em código (recordatorioService.ts) a partir de grupos_alimentares +
-- classificacao_nova já existentes, e gravados aqui quando o recordatório
-- daquele dia é concluído.
-- =====================================================================

ALTER TABLE public.recordatorios_alimentares
  ADD COLUMN escore_saudavel integer,      -- 0 a 3 (feijão, frutas, verduras/legumes)
  ADD COLUMN escore_nao_saudavel integer;  -- 0 a 4 (embutidos, bebida açucarada, salgadinho/instantâneo, doce/biscoito)
