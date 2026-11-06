-- ALIMENTO CRIADO PELO ADOLESCENTE É PRIVADO (decisão de 06/11/2026)
--
-- Regra: um alimento que o adolescente cadastra aparece SÓ para ele. Nenhum outro adolescente,
-- nem a equipe (administrador/nutricionista) o vê, e não há fila de revisão. O catálogo da equipe
-- continua visível para todos.
--
-- Antes desta migração, a policy "alimentos: leitura liberada para autenticados" deixava todo
-- usuário logado ler TODOS os alimentos (inclusive os criados por outros adolescentes).
--
-- Idempotente. Rodar no SQL Editor do Supabase.
--
-- DIAGNÓSTICO (só leitura), antes:
--   select policyname, cmd, qual from pg_policies where tablename = 'alimentos';
--   select conname, contype from pg_constraint where conrelid = 'public.alimentos'::regclass and contype = 'u';
--   select lower(btrim(nome)), criado_por, count(*) from public.alimentos group by 1, 2 having count(*) > 1;

-- 1. Quem é equipe? (função só devolve verdadeiro/falso; usada para o catálogo criado por staff)
create or replace function public.usuario_eh_staff(p_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_id and p.papel::text in ('ADMINISTRADOR', 'NUTRICIONISTA')
  )
$$;
revoke all on function public.usuario_eh_staff(uuid) from public, anon;
grant execute on function public.usuario_eh_staff(uuid) to authenticated;

-- 2. Leitura: catálogo (sem dono ou criado pela equipe) + os próprios.
drop policy if exists "alimentos: leitura liberada para autenticados" on public.alimentos;
drop policy if exists "alimentos_select_catalogo_e_proprios" on public.alimentos;
create policy "alimentos_select_catalogo_e_proprios" on public.alimentos
  for select to authenticated
  using (
    criado_por is null
    or criado_por = auth.uid()
    or public.usuario_eh_staff(criado_por)
  );
-- (a policy "alimentos_select_proprio" da migração anterior continua valendo e é redundante com esta)

-- 3. Cadastro: só a policy restrita (a antiga deixava escolher nível EBIA, prato composto e nome de qualquer tamanho).
drop policy if exists "alimentos: adolescente pode cadastrar o proprio" on public.alimentos;
-- (mantém "alimentos: administrador pode inserir" e "alimentos_insert_proprio")

-- 4. O nome deixa de ser único no banco inteiro e passa a ser único POR DONO.
--    Se fosse global, o adolescente A criar "Pamonha" impediria o B de criar a dele e ainda
--    revelaria que existe. Sem diferenciar maiúsculas/minúsculas.
alter table public.alimentos drop constraint if exists alimentos_nome_key;
create unique index if not exists alimentos_nome_por_dono_uk
  on public.alimentos (lower(btrim(nome)), coalesce(criado_por, '00000000-0000-0000-0000-000000000000'::uuid));

-- Teste: logado como adolescente A, criar "Pamonha"; como B, buscar "Pamonha" (não aparece) e criar a sua (funciona).
-- As telas do painel de revisão de alimentos de adolescentes ficam vazias (a equipe não vê esses alimentos).
