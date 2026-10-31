-- migration_scanner_fotos.sql — bucket público "scanner" (foto da embalagem e foto do rótulo dos produtos).
-- Idempotente. Rodar uma vez no SQL Editor. Depende de public.papel_atual().
-- Leitura: qualquer pessoa (a foto da embalagem aparece para o adolescente; o link do rótulo só é usado pela equipe).
-- Escrita/troca/remoção: só NUTRICIONISTA e ADMINISTRADOR. Limite de 3 MB por foto. Só fotos de produto: nunca de pessoas.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('scanner', 'scanner', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 3145728,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists scanner_fotos_leitura on storage.objects;
create policy scanner_fotos_leitura on storage.objects for select
  using (bucket_id = 'scanner');

drop policy if exists scanner_fotos_escrita on storage.objects;
create policy scanner_fotos_escrita on storage.objects for insert to authenticated
  with check (bucket_id = 'scanner' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

drop policy if exists scanner_fotos_atualiza on storage.objects;
create policy scanner_fotos_atualiza on storage.objects for update to authenticated
  using (bucket_id = 'scanner' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'))
  with check (bucket_id = 'scanner' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));

drop policy if exists scanner_fotos_apaga on storage.objects;
create policy scanner_fotos_apaga on storage.objects for delete to authenticated
  using (bucket_id = 'scanner' and public.papel_atual() in ('ADMINISTRADOR','NUTRICIONISTA'));
