-- Revisão e aprovação de trilhas (lado nutricionista/admin).
-- Idempotente. Rodar no SQL Editor do Supabase.
--
-- REGRA DE NEGÓCIO (garantida AQUI, no banco — a tela só reflete):
--   * conteúdo criado/editado pelo ADMINISTRADOR nasce como 'rascunho' e só vira
--     'aprovada' quando uma NUTRICIONISTA aprova;
--   * conteúdo criado pela NUTRICIONISTA pode nascer 'aprovada' (ela é a revisora);
--   * ninguém além da nutricionista consegue gravar status 'aprovada' pelo app;
--   * SQL Editor / service role (auth.uid() nulo) não é afetado — seeds continuam OK.
--
-- Não cria valor novo no enum trilha_status: "devolvida" = continua 'rascunho' +
-- uma linha em trilha_revisoes com decisao 'DEVOLVIDA' e o comentário.

-- 1. Papel de quem está logado (security definer: evita recursão de RLS em profiles)
create or replace function public.papel_atual()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel::text from public.profiles where id = auth.uid()
$$;
revoke all on function public.papel_atual() from public;
grant execute on function public.papel_atual() to authenticated;

-- 2. Histórico de revisões
create table if not exists public.trilha_revisoes (
  id          uuid primary key default gen_random_uuid(),
  trilha_id   uuid not null references public.trilhas(id) on delete cascade,
  revisor_id  uuid not null references public.profiles(id),
  decisao     text not null check (decisao in ('APROVADA', 'DEVOLVIDA')),
  comentario  text check (comentario is null or char_length(comentario) <= 2000),
  criado_em   timestamptz not null default now(),
  -- devolver sem dizer o motivo não ajuda quem criou
  constraint devolucao_exige_comentario
    check (decisao <> 'DEVOLVIDA' or char_length(btrim(coalesce(comentario, ''))) > 0)
);
create index if not exists trilha_revisoes_trilha_idx on public.trilha_revisoes (trilha_id, criado_em desc);

alter table public.trilha_revisoes enable row level security;

drop policy if exists "revisoes_leitura_staff" on public.trilha_revisoes;
create policy "revisoes_leitura_staff" on public.trilha_revisoes
  for select to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'));

drop policy if exists "revisoes_insert_nutricionista" on public.trilha_revisoes;
create policy "revisoes_insert_nutricionista" on public.trilha_revisoes
  for insert to authenticated
  with check (public.papel_atual() = 'NUTRICIONISTA' and revisor_id = auth.uid());

-- sem update/delete: o histórico é imutável
revoke update, delete on public.trilha_revisoes from anon, authenticated;

-- 3. Leitura do conteúdo COMPLETO (inclusive rascunho) para a equipe.
--    Policies são somadas (OR) às que já existem — a do adolescente não muda.
do $$
declare t text;
begin
  foreach t in array array['trilhas', 'modulos_trilha', 'licoes', 'questoes_quiz', 'opcoes_quiz']
  loop
    execute format('drop policy if exists "staff_le_%1$s" on public.%1$I', t);
    execute format(
      'create policy "staff_le_%1$s" on public.%1$I for select to authenticated using (public.papel_atual() in (''NUTRICIONISTA'', ''ADMINISTRADOR''))',
      t);
  end loop;
end $$;

-- 4. Nutricionista pode mudar o status da trilha (aprovar / devolver / despublicar)
drop policy if exists "nutricionista_atualiza_trilhas" on public.trilhas;
create policy "nutricionista_atualiza_trilhas" on public.trilhas
  for update to authenticated
  using (public.papel_atual() = 'NUTRICIONISTA')
  with check (public.papel_atual() = 'NUTRICIONISTA');

-- 5. Trava: só nutricionista grava/mantém 'aprovada'
create or replace function public.trilhas_guarda_aprovacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_papel text;
begin
  if auth.uid() is null then
    return new; -- SQL Editor / service role / seed
  end if;

  v_papel := public.papel_atual();

  -- virar 'aprovada' (INSERT já aprovado ou UPDATE vindo de outro status)
  if new.status::text = 'aprovada'
     and (tg_op = 'INSERT' or old.status::text is distinct from 'aprovada') then
    if v_papel is distinct from 'NUTRICIONISTA' then
      raise exception 'Somente a nutricionista pode aprovar conteúdo.' using errcode = '42501';
    end if;
    new.aprovado_por := auth.uid();
    new.aprovado_em  := now();
  end if;

  -- despublicar (aprovada -> outro status) também é decisão da nutricionista
  if tg_op = 'UPDATE'
     and old.status::text = 'aprovada'
     and new.status::text is distinct from 'aprovada'
     and v_papel is distinct from 'NUTRICIONISTA' then
    raise exception 'Somente a nutricionista pode despublicar conteúdo aprovado.' using errcode = '42501';
  end if;

  -- saiu de 'aprovada': limpa quem/quando aprovou
  if tg_op = 'UPDATE' and new.status::text is distinct from 'aprovada' then
    new.aprovado_por := null;
    new.aprovado_em  := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trilhas_guarda_aprovacao on public.trilhas;
create trigger trilhas_guarda_aprovacao
  before insert or update on public.trilhas
  for each row execute function public.trilhas_guarda_aprovacao();

-- PRÓXIMA FATIA (editor): quando o admin editar módulo/lição/questão de uma trilha
-- 'aprovada', a trilha deve voltar a 'rascunho' para nova revisão.
