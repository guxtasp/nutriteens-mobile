-- =====================================================================
-- MIGRATION: bucket de imagens das receitas (foto da receita e fotos dos passos)
-- Rodar uma vez no SQL Editor do Supabase. Idempotente.
-- Leitura: qualquer pessoa (as fotos aparecem para o adolescente).
-- Escrita/troca/remoção: só ADMINISTRADOR e NUTRICIONISTA. Limite de 3 MB por foto.
-- Depende de papel_atual() (migration_painel_dashboard.sql).
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receitas', 'receitas', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists receitas_leitura on storage.objects;
create policy receitas_leitura on storage.objects for select
  using (bucket_id = 'receitas');

drop policy if exists receitas_escrita on storage.objects;
create policy receitas_escrita on storage.objects for insert to authenticated
  with check (bucket_id = 'receitas' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

drop policy if exists receitas_atualiza on storage.objects;
create policy receitas_atualiza on storage.objects for update to authenticated
  using (bucket_id = 'receitas' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'))
  with check (bucket_id = 'receitas' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

drop policy if exists receitas_apaga on storage.objects;
create policy receitas_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'receitas' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));
