-- migration_trocas_categorias.sql — novas categorias do protótipo "Sugestões alimentares"
-- Roda DEPOIS de migration_trocas.sql. Idempotente.
--  BISCOITO: classifica alimentos (por nome). LANCHE e REFEICAO são categorias de "ideia":
--  só existem em alimento_trocas, não classificam alimentos nem aparecem no retorno da refeição.
begin;

alter table public.alimentos drop constraint if exists alimentos_categoria_troca_check;
alter table public.alimentos add constraint alimentos_categoria_troca_check
  check (categoria_troca in ('REFRIGERANTE_BEBIDA','DOCE','SALGADINHO','EMBUTIDO','BISCOITO'));

alter table public.alimento_trocas drop constraint if exists alimento_trocas_categoria_check;
alter table public.alimento_trocas add constraint alimento_trocas_categoria_check
  check (categoria in ('REFRIGERANTE_BEBIDA','DOCE','SALGADINHO','EMBUTIDO','BISCOITO','LANCHE','REFEICAO'));

update public.alimentos set categoria_troca = 'BISCOITO'
where categoria_troca is null and nome ~* '(biscoito|bolacha|cookie)';

commit;
