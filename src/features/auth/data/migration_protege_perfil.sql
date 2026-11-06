-- PROTEÇÃO DO PERFIL (achado crítico da revisão de RLS, 06/11/2026)
--
-- A policy "profiles: usuário vê e edita o próprio perfil" é FOR ALL com (auth.uid() = id).
-- Sem mais nada, qualquer usuário logado consegue, pela API pública do Supabase:
--   update profiles set papel = 'ADMINISTRADOR' where id = auth.uid();
-- (e também inserir o próprio perfil já com papel de administrador no cadastro).
-- Isso dá acesso ao painel admin e a dados de todos os participantes.
--
-- Esta migração fecha isso com um trigger: quem não é ADMINISTRADOR não consegue definir
-- nem alterar `papel` e `codigo_participante`. Chamadas sem usuário (SQL Editor, service role)
-- continuam livres, então criar nutricionista/administrador pelo painel do Supabase segue igual.
--
-- Idempotente. Rodar no SQL Editor. Requer papel_atual() (migration_painel_dashboard.sql).
--
-- ANTES (só leitura): confirme se já existe algum trigger em profiles:
--   select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid = 'public.profiles'::regclass and not tgisinternal;

create or replace function public.profiles_protege_campos()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_eh_admin boolean;
begin
  -- sem usuário logado (SQL Editor / service role / jobs): não interfere
  if auth.uid() is null then
    return new;
  end if;

  v_eh_admin := coalesce(public.papel_atual(), '') = 'ADMINISTRADOR';
  if v_eh_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- cadastro pelo app: sempre ADOLESCENTE, sem código escolhido pela pessoa
    new.papel := 'ADOLESCENTE';
    new.codigo_participante := null;   -- gerado pelo banco/painel, se houver rotina para isso
  else
    if new.papel is distinct from old.papel then
      raise exception 'campo_protegido: papel' using errcode = '42501';
    end if;
    if new.codigo_participante is distinct from old.codigo_participante then
      raise exception 'campo_protegido: codigo_participante' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protege_campos_trg on public.profiles;
create trigger profiles_protege_campos_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_protege_campos();

-- Teste (logado como adolescente, no app/REST): deve falhar com 42501
--   update profiles set papel = 'ADMINISTRADOR' where id = auth.uid();
