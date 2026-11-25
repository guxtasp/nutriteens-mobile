-- migration_consentimentos_reaceite.sql — garante o que o reaceite dos termos (v2.0) precisa.
-- Idempotente. Não depende de outra migration do repositório: a tabela `consentimentos` foi
-- criada direto no painel do Supabase (não está em nenhum .sql daqui). Rodar ANTES de publicar
-- o app com VERSAO_TERMOS = '2.0'.
--
-- O app só usa as colunas id, user_id, aceite_termos, versao_termo e conteudo (useSignup,
-- CompletarCadastroScreen e consentimentoService). O reaceite precisa de três coisas:
--   1. o adolescente LER os próprios aceites (para saber se já aceitou a versão atual);
--   2. o adolescente INSERIR um novo aceite (uma linha por versão; a da 1.0 fica como histórico);
--   3. não existir unicidade só em user_id (senão o 2º aceite dá 23505).
-- Não criamos UPDATE nem DELETE: o histórico de consentimento é imutável pelo app.
--
-- Antes de rodar, confira no SQL Editor:
--   select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'consentimentos';
--   select polname, polcmd from pg_policy where polrelid = 'public.consentimentos'::regclass;
begin;

alter table public.consentimentos enable row level security;

drop policy if exists consentimentos_select_proprio on public.consentimentos;
create policy consentimentos_select_proprio on public.consentimentos
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists consentimentos_insert_proprio on public.consentimentos;
create policy consentimentos_insert_proprio on public.consentimentos
  for insert to authenticated
  with check (user_id = auth.uid() and aceite_termos is true);

grant select, insert on public.consentimentos to authenticated;
revoke all on public.consentimentos from anon;

-- 3. remove unicidade que tenha SÓ user_id (um aceite por pessoa impediria o reaceite).
do $$
declare
  r record;
begin
  for r in
    select c.conname
      from pg_constraint c
     where c.conrelid = 'public.consentimentos'::regclass
       and c.contype = 'u'
       and array_length(c.conkey, 1) = 1
       and c.conkey[1] = (select attnum from pg_attribute
                           where attrelid = 'public.consentimentos'::regclass and attname = 'user_id')
  loop
    raise notice 'Removendo unicidade só em user_id: %', r.conname;
    execute format('alter table public.consentimentos drop constraint %I', r.conname);
  end loop;
end $$;

commit;

-- Teste rápido (logado como adolescente no app, não no SQL Editor):
--   o reaceite aparece na Home para quem só tem aceite '1.0'; "CONCORDO" grava uma linha '2.0'.
