-- migration_funcoes_substituir.sql
--
-- O app chama estas duas RPCs (alimentosAdminService.ts) ao salvar um prato
-- composto e os passos de uma receita, mas nenhuma migration do repositório as
-- criava. Se não existirem no banco, o salvamento falha com "Could not find the
-- function ... in the schema cache". Idempotente.
--
-- Segurança: security definer + checagem de papel DENTRO da função (só
-- NUTRICIONISTA/ADMINISTRADOR). Os triggers de fluxo continuam disparando, então
-- editar os passos de uma receita já publicada volta o conteúdo para RASCUNHO.
-- Rodar DEPOIS de migration_revisao_trilhas.sql (usa papel_atual()).

-- remove variantes antigas (json x jsonb) para não criar overload ambíguo no PostgREST
drop function if exists public.substituir_ingredientes_prato(uuid, json);
drop function if exists public.substituir_ingredientes_prato(uuid, jsonb);
drop function if exists public.substituir_passos_receita(uuid, json);
drop function if exists public.substituir_passos_receita(uuid, jsonb);

create function public.substituir_ingredientes_prato(p_prato_id uuid, p_ingredientes jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.papel_atual() is null or public.papel_atual() not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.alimentos where id = p_prato_id) then
    raise exception 'Prato não encontrado.';
  end if;
  if jsonb_typeof(coalesce(p_ingredientes, '[]'::jsonb)) <> 'array' then
    raise exception 'Lista de ingredientes inválida.';
  end if;

  delete from public.prato_ingredientes where prato_id = p_prato_id;

  insert into public.prato_ingredientes (prato_id, ingrediente_id, proporcao)
  select p_prato_id,
         (x ->> 'ingrediente_id')::uuid,
         coalesce((x ->> 'proporcao')::numeric, 1.0)
    from jsonb_array_elements(coalesce(p_ingredientes, '[]'::jsonb)) as x
   where (x ->> 'ingrediente_id')::uuid <> p_prato_id; -- prato não pode conter ele mesmo
end;
$$;

create function public.substituir_passos_receita(p_receita_id uuid, p_passos jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.papel_atual() is null or public.papel_atual() not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.receitas where id = p_receita_id) then
    raise exception 'Receita não encontrada.';
  end if;
  if jsonb_typeof(coalesce(p_passos, '[]'::jsonb)) <> 'array' then
    raise exception 'Lista de passos inválida.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(coalesce(p_passos, '[]'::jsonb)) as x
     where btrim(coalesce(x ->> 'titulo', '')) = '' or btrim(coalesce(x ->> 'descricao', '')) = ''
  ) then
    raise exception 'Todo passo precisa de título e descrição.';
  end if;

  delete from public.receita_passos where receita_id = p_receita_id;

  insert into public.receita_passos (receita_id, ordem, titulo, descricao, foto_url)
  select p_receita_id,
         coalesce((t.x ->> 'ordem')::int, t.n::int),
         btrim(t.x ->> 'titulo'),
         btrim(t.x ->> 'descricao'),
         nullif(btrim(coalesce(t.x ->> 'foto_url', '')), '')
    from jsonb_array_elements(coalesce(p_passos, '[]'::jsonb)) with ordinality as t(x, n);
end;
$$;

revoke all on function public.substituir_ingredientes_prato(uuid, jsonb) from public, anon;
revoke all on function public.substituir_passos_receita(uuid, jsonb) from public, anon;
grant execute on function public.substituir_ingredientes_prato(uuid, jsonb) to authenticated;
grant execute on function public.substituir_passos_receita(uuid, jsonb) to authenticated;
