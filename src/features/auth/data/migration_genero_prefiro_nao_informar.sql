-- Decisão 3.2 (cadastro em 2 etapas): o app passa a enviar profiles.genero com
-- um dos valores FEMININO, MASCULINO ou PREFIRO_NAO_INFORMAR.
--
-- RODAR NO SUPABASE (SQL Editor) ANTES de liberar a versão nova do app.
-- Se o valor não existir, o cadastro cria a conta no Auth mas falha ao gravar
-- o perfil ("Conta criada, mas houve um erro ao salvar seu perfil").
--
-- profiles.genero é um enum (USER-DEFINED) sem CHECK. O nome do tipo não está
-- no repositório, então o bloco abaixo descobre sozinho. Seguro de rodar mais
-- de uma vez (se o valor já existe, só avisa).

-- 1) Diagnóstico opcional: valores que o enum tem hoje.
--    select e.enumlabel
--      from pg_enum e
--      join pg_type t on t.oid = e.enumtypid
--     where t.typname = (select udt_name from information_schema.columns
--                         where table_schema = 'public' and table_name = 'profiles'
--                           and column_name = 'genero')
--     order by e.enumsortorder;

-- 2) Adiciona o valor que falta.
do $$
declare
  v_tipo   text;
  v_schema text;
begin
  select c.udt_schema, c.udt_name
    into v_schema, v_tipo
    from information_schema.columns c
   where c.table_schema = 'public'
     and c.table_name   = 'profiles'
     and c.column_name  = 'genero'
     and c.data_type    = 'USER-DEFINED';

  if v_tipo is null then
    raise exception 'profiles.genero não é um enum: confira o tipo da coluna antes de continuar.';
  end if;

  if exists (
    select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = v_schema
       and t.typname = v_tipo
       and e.enumlabel = 'PREFIRO_NAO_INFORMAR'
  ) then
    raise notice 'Valor PREFIRO_NAO_INFORMAR já existe no tipo %.%', v_schema, v_tipo;
  else
    execute format('alter type %I.%I add value %L', v_schema, v_tipo, 'PREFIRO_NAO_INFORMAR');
    raise notice 'Valor PREFIRO_NAO_INFORMAR adicionado ao tipo %.%', v_schema, v_tipo;
  end if;
end
$$;

-- 3) Conferência: o valor novo deve aparecer na lista do diagnóstico (passo 1).
--    Depois de um cadastro de teste com "Prefiro não informar":
--    select distinct genero::text from public.profiles;
