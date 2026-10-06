-- Corrige: "new row violates row-level security policy for table alimento_nutrientes" (42501)
-- ao cadastrar um alimento novo pelo app (criarAlimento grava a inferência por grupo).
-- Idempotente. Rodar no SQL Editor do Supabase.

-- 1. Adolescente pode gravar a inferência SÓ dos alimentos que ele mesmo criou,
--    e só com fonte = 'INFERIDO_POR_GRUPO' (nunca dado "curado").
alter table public.alimento_nutrientes enable row level security;

drop policy if exists "alimento_nutrientes_insert_inferido_proprio" on public.alimento_nutrientes;
create policy "alimento_nutrientes_insert_inferido_proprio" on public.alimento_nutrientes
  for insert to authenticated
  with check (
    fonte = 'INFERIDO_POR_GRUPO'
    and exists (
      select 1 from public.alimentos a
      where a.id = alimento_id and a.criado_por = auth.uid()
    )
  );

-- 2. Backfill: alimentos já criados por usuários que ficaram sem linha.
--    Espelha utils/nutrientesPorGrupo.ts (grupo = 1º de grupos_alimentares).
--    (o app já funciona sem isso por causa do fallback em alimentoEBoaFonte;
--     o backfill só deixa o banco consistente.)
insert into public.alimento_nutrientes (alimento_id, fonte, zinco, ferro, magnesio, proteina)
select a.id, 'INFERIDO_POR_GRUPO', 'ALTO_TEOR', 'FONTE', 'ALTO_TEOR', 'FONTE'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'OLEAGINOSAS_E_SEMENTES'
on conflict (alimento_id) do nothing;

insert into public.alimento_nutrientes (alimento_id, fonte, vitamina_a, vitamina_c)
select a.id, 'INFERIDO_POR_GRUPO', 'FONTE', 'FONTE'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'LEGUMES_E_VERDURAS'
on conflict (alimento_id) do nothing;

insert into public.alimento_nutrientes (alimento_id, fonte, vitamina_c)
select a.id, 'INFERIDO_POR_GRUPO', 'ALTO_TEOR'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'FRUTAS'
on conflict (alimento_id) do nothing;

insert into public.alimento_nutrientes (alimento_id, fonte, ferro, zinco, proteina)
select a.id, 'INFERIDO_POR_GRUPO', 'ALTO_TEOR', 'FONTE', 'ALTO_TEOR'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'CARNES_E_OVOS'
on conflict (alimento_id) do nothing;

insert into public.alimento_nutrientes (alimento_id, fonte, calcio, proteina)
select a.id, 'INFERIDO_POR_GRUPO', 'ALTO_TEOR', 'FONTE'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'LEITE_E_DERIVADOS'
on conflict (alimento_id) do nothing;

insert into public.alimento_nutrientes (alimento_id, fonte, ferro, zinco, proteina, fibra)
select a.id, 'INFERIDO_POR_GRUPO', 'FONTE', 'FONTE', 'FONTE', 'FONTE'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'LEGUMINOSAS'
on conflict (alimento_id) do nothing;

insert into public.alimento_nutrientes (alimento_id, fonte, lipideos)
select a.id, 'INFERIDO_POR_GRUPO', 'ALTO'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'OLEOS_E_GORDURAS'
on conflict (alimento_id) do nothing;

insert into public.alimento_nutrientes (alimento_id, fonte, carboidrato)
select a.id, 'INFERIDO_POR_GRUPO', 'ALTO'
from public.alimentos a
where a.criado_por is not null and a.grupos_alimentares[1]::text = 'ACUCARES_E_DOCES'
on conflict (alimento_id) do nothing;
