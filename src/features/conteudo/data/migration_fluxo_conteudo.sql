-- Etapa 2: fluxo de aprovação, versão e auditoria (trilhas e receitas).
-- Idempotente. Rodar no SQL Editor DEPOIS de migration_revisao_trilhas.sql
-- (usa papel_atual() e trilha_revisoes).
--
-- Decisões:
--  * Não mexe no enum trilha_status nem em policies existentes. trilhas.status
--    continua sendo o "portão" do app do adolescente: 'aprovada' = visível.
--    Ele só vira 'aprovada' quando o fluxo chega em PUBLICADO.
--  * Estado do fluxo fica em conteudo_fluxo; toda mudança passa pela função
--    conteudo_transicionar (security definer). Ninguém escreve direto na tabela.
--  * Receitas passam a exigir PUBLICADO para o adolescente (policy RESTRICTIVE,
--    somada às policies atuais). Receitas já existentes entram como PUBLICADO.
--  * Alterar conteúdo já enviado/aprovado/publicado volta para RASCUNHO e sobe a versão.

-- 1. Estado do fluxo ---------------------------------------------------------
create table if not exists public.conteudo_fluxo (
  id               uuid primary key default gen_random_uuid(),
  tipo             text not null check (tipo in ('TRILHA', 'RECEITA')),
  conteudo_id      uuid not null,
  status           text not null default 'RASCUNHO'
                   check (status in ('RASCUNHO','AGUARDANDO_APROVACAO','APROVADO','PUBLICADO','REJEITADO','ARQUIVADO')),
  versao           integer not null default 1 check (versao >= 1),
  criado_por       uuid references public.profiles(id),
  criado_em        timestamptz not null default now(),
  enviado_por      uuid references public.profiles(id),
  enviado_em       timestamptz,
  revisado_por     uuid references public.profiles(id),
  revisado_em      timestamptz,
  motivo_rejeicao  text check (motivo_rejeicao is null or char_length(motivo_rejeicao) <= 2000),
  publicado_por    uuid references public.profiles(id),
  publicado_em     timestamptz,
  atualizado_em    timestamptz not null default now(),
  unique (tipo, conteudo_id),
  constraint rejeicao_exige_motivo
    check (status <> 'REJEITADO' or char_length(btrim(coalesce(motivo_rejeicao, ''))) > 0)
);
create index if not exists conteudo_fluxo_status_idx on public.conteudo_fluxo (status, atualizado_em desc);

-- 2. Auditoria (imutável) ----------------------------------------------------
create table if not exists public.conteudo_auditoria (
  id               uuid primary key default gen_random_uuid(),
  tipo             text not null,
  conteudo_id      uuid not null,
  titulo           text,
  versao           integer,
  acao             text not null,
  status_anterior  text,
  status_novo      text,
  ator_id          uuid references public.profiles(id),
  ator_papel       text,
  motivo           text,
  criado_em        timestamptz not null default now()
);
create index if not exists conteudo_auditoria_criado_idx on public.conteudo_auditoria (criado_em desc);
create index if not exists conteudo_auditoria_conteudo_idx on public.conteudo_auditoria (tipo, conteudo_id, criado_em desc);

alter table public.conteudo_fluxo enable row level security;
alter table public.conteudo_auditoria enable row level security;

drop policy if exists "fluxo_leitura_staff" on public.conteudo_fluxo;
create policy "fluxo_leitura_staff" on public.conteudo_fluxo
  for select to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'));

drop policy if exists "auditoria_leitura_staff" on public.conteudo_auditoria;
create policy "auditoria_leitura_staff" on public.conteudo_auditoria
  for select to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'));

-- sem policy de escrita + revoke: só as funções security definer escrevem
revoke insert, update, delete on public.conteudo_fluxo from anon, authenticated;
revoke insert, update, delete on public.conteudo_auditoria from anon, authenticated;
revoke all on public.conteudo_fluxo from anon;
revoke all on public.conteudo_auditoria from anon;

-- 3. Helpers -----------------------------------------------------------------
create or replace function public.fluxo_titulo(p_tipo text, p_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case p_tipo
    when 'TRILHA'  then (select titulo from public.trilhas  where id = p_id)
    when 'RECEITA' then (select titulo from public.receitas where id = p_id)
  end
$$;
revoke all on function public.fluxo_titulo(text, uuid) from public;

-- usada pela policy de receitas (o adolescente não lê conteudo_fluxo)
create or replace function public.receita_publicada(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.conteudo_fluxo
                 where tipo = 'RECEITA' and conteudo_id = p_id and status = 'PUBLICADO')
$$;
revoke all on function public.receita_publicada(uuid) from public;
grant execute on function public.receita_publicada(uuid) to authenticated;

-- 4. Guarda da trilha: status/aprovação só mudam pelo fluxo -------------------
--    (substitui a função de migration_revisao_trilhas.sql; o trigger é o mesmo)
create or replace function public.trilhas_guarda_aprovacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or current_setting('app.fluxo', true) = '1' then
    return new; -- SQL Editor / seed / função do fluxo
  end if;

  if tg_op = 'INSERT' then
    if new.status::text <> 'rascunho' then
      raise exception 'Conteúdo novo nasce como rascunho; publicação só pelo fluxo de aprovação.' using errcode = '42501';
    end if;
    new.aprovado_por := null;
    new.aprovado_em  := null;
  else
    if new.status::text is distinct from old.status::text
       or new.aprovado_por is distinct from old.aprovado_por
       or new.aprovado_em  is distinct from old.aprovado_em then
      raise exception 'O status da trilha só muda pelo fluxo de aprovação.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trilhas_guarda_aprovacao on public.trilhas;
create trigger trilhas_guarda_aprovacao
  before insert or update on public.trilhas
  for each row execute function public.trilhas_guarda_aprovacao();

-- 5. Criação: toda trilha/receita nova entra no fluxo -------------------------
create or replace function public.fluxo_criar()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tipo   text := tg_argv[0];
  v_r      jsonb := to_jsonb(new);
  v_autor  uuid := coalesce(auth.uid(), nullif(v_r->>'criado_por', '')::uuid);
  v_status text := 'RASCUNHO';
begin
  -- seed/SQL Editor (sem usuário): trilha 'aprovada' e receita nascem publicadas
  if auth.uid() is null and (v_tipo = 'RECEITA' or v_r->>'status' = 'aprovada') then
    v_status := 'PUBLICADO';
  end if;

  insert into public.conteudo_fluxo (tipo, conteudo_id, status, criado_por, publicado_em)
  values (v_tipo, new.id, v_status, v_autor, case when v_status = 'PUBLICADO' then now() end)
  on conflict (tipo, conteudo_id) do nothing;

  insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_novo, ator_id, ator_papel)
  values (v_tipo, new.id, v_r->>'titulo', 1, 'CRIACAO', v_status, auth.uid(), public.papel_atual());
  return new;
end;
$$;

create or replace function public.fluxo_remover()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.conteudo_fluxo where tipo = tg_argv[0] and conteudo_id = old.id;
  insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, acao, ator_id, ator_papel)
  values (tg_argv[0], old.id, to_jsonb(old)->>'titulo', 'EXCLUSAO', auth.uid(), public.papel_atual());
  return old;
end;
$$;

drop trigger if exists trilhas_fluxo_criar on public.trilhas;
create trigger trilhas_fluxo_criar after insert on public.trilhas
  for each row execute function public.fluxo_criar('TRILHA');
drop trigger if exists receitas_fluxo_criar on public.receitas;
create trigger receitas_fluxo_criar after insert on public.receitas
  for each row execute function public.fluxo_criar('RECEITA');
drop trigger if exists trilhas_fluxo_remover on public.trilhas;
create trigger trilhas_fluxo_remover after delete on public.trilhas
  for each row execute function public.fluxo_remover('TRILHA');
drop trigger if exists receitas_fluxo_remover on public.receitas;
create trigger receitas_fluxo_remover after delete on public.receitas
  for each row execute function public.fluxo_remover('RECEITA');

-- 6. Backfill do que já existe ------------------------------------------------
insert into public.conteudo_fluxo (tipo, conteudo_id, status, criado_por, criado_em,
                                   revisado_por, revisado_em, publicado_por, publicado_em)
select 'TRILHA', t.id,
       case when t.status::text = 'aprovada' then 'PUBLICADO' else 'RASCUNHO' end,
       t.criado_por, t.criado_em,
       t.aprovado_por, t.aprovado_em,
       case when t.status::text = 'aprovada' then t.aprovado_por end,
       case when t.status::text = 'aprovada' then coalesce(t.aprovado_em, t.atualizado_em) end
from public.trilhas t
on conflict (tipo, conteudo_id) do nothing;

insert into public.conteudo_fluxo (tipo, conteudo_id, status, criado_em, publicado_em)
select 'RECEITA', r.id, 'PUBLICADO', coalesce(r.created_at, now()), coalesce(r.created_at, now())
from public.receitas r
on conflict (tipo, conteudo_id) do nothing;

-- 7. Alteração relevante => volta a RASCUNHO e sobe a versão ------------------
create or replace function public.fluxo_alteracao_relevante()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_row    jsonb := to_jsonb(coalesce(new, old));
  v_tipo   text;
  v_id     uuid;
  v_ant    text;
  v_versao integer;
begin
  if auth.uid() is null or current_setting('app.fluxo', true) = '1' then
    return coalesce(new, old);
  end if;

  -- mudar só a ordem (organizar) não é alteração de conteúdo
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'ordem' - 'atualizado_em') = (to_jsonb(old) - 'ordem' - 'atualizado_em') then
    return new;
  end if;

  case tg_table_name
    when 'trilhas' then
      v_tipo := 'TRILHA'; v_id := (v_row->>'id')::uuid;
    when 'modulos_trilha' then
      v_tipo := 'TRILHA'; v_id := (v_row->>'trilha_id')::uuid;
    when 'licoes' then
      v_tipo := 'TRILHA';
      select trilha_id into v_id from public.modulos_trilha where id = (v_row->>'modulo_id')::uuid;
    when 'licao_componentes' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id
        where l.id = (v_row->>'licao_id')::uuid;
    when 'questoes_quiz' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id
        where l.id = (v_row->>'licao_id')::uuid;
    when 'opcoes_quiz' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.questoes_quiz q
        join public.licoes l on l.id = q.licao_id join public.modulos_trilha m on m.id = l.modulo_id
        where q.id = (v_row->>'questao_id')::uuid;
    when 'receitas' then
      v_tipo := 'RECEITA'; v_id := (v_row->>'id')::uuid;
    else -- receita_ingredientes, receita_passos
      v_tipo := 'RECEITA'; v_id := (v_row->>'receita_id')::uuid;
  end case;

  if v_id is null then return coalesce(new, old); end if;

  select status into v_ant from public.conteudo_fluxo
    where tipo = v_tipo and conteudo_id = v_id for update;

  if v_ant in ('AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO') then
    update public.conteudo_fluxo
       set status = 'RASCUNHO', versao = versao + 1, motivo_rejeicao = null, atualizado_em = now()
     where tipo = v_tipo and conteudo_id = v_id
     returning versao into v_versao;

    if v_tipo = 'TRILHA' then
      perform set_config('app.fluxo', '1', true);
      update public.trilhas set status = 'rascunho', aprovado_por = null, aprovado_em = null where id = v_id;
      perform set_config('app.fluxo', '', true);
    end if;

    insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_anterior, status_novo, ator_id, ator_papel, motivo)
    values (v_tipo, v_id, public.fluxo_titulo(v_tipo, v_id), v_versao, 'ALTERACAO_RELEVANTE', v_ant, 'RASCUNHO',
            auth.uid(), public.papel_atual(), 'Conteúdo alterado: precisa de nova aprovação.');
  end if;

  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['modulos_trilha','licoes','licao_componentes','questoes_quiz','opcoes_quiz','receitas','receita_ingredientes','receita_passos']
  loop
    execute format('drop trigger if exists fluxo_alteracao on public.%I', t);
    execute format('create trigger fluxo_alteracao after insert or update or delete on public.%I for each row execute function public.fluxo_alteracao_relevante()', t);
  end loop;
end $$;

-- trilhas: só edição de conteúdo (título/descrição/tema), não status nem ordem
drop trigger if exists fluxo_alteracao on public.trilhas;
create trigger fluxo_alteracao after update of titulo, descricao, tema on public.trilhas
  for each row execute function public.fluxo_alteracao_relevante();

-- 8. Transições (único caminho para mudar o estado) ----------------------------
create or replace function public.conteudo_transicionar(
  p_tipo text, p_id uuid, p_acao text, p_motivo text default null
) returns public.conteudo_fluxo
language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_papel  text := public.papel_atual();
  v_f      public.conteudo_fluxo;
  v_ant    text;
  v_novo   text;
  v_motivo text := nullif(btrim(coalesce(p_motivo, '')), '');
begin
  if v_uid is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Sem permissão para esta ação.' using errcode = '42501';
  end if;
  if p_tipo not in ('TRILHA', 'RECEITA') then
    raise exception 'Tipo de conteúdo inválido.' using errcode = '22023';
  end if;

  select * into v_f from public.conteudo_fluxo where tipo = p_tipo and conteudo_id = p_id for update;
  if not found then
    raise exception 'Conteúdo não encontrado no fluxo.' using errcode = 'P0002';
  end if;
  v_ant := v_f.status;

  if p_acao = 'ENVIAR' then
    if v_ant not in ('RASCUNHO', 'REJEITADO') then raise exception 'Só rascunho ou rejeitado pode ser enviado.' using errcode = '22023'; end if;
    v_novo := 'AGUARDANDO_APROVACAO';
    update public.conteudo_fluxo set status = v_novo, enviado_por = v_uid, enviado_em = now(),
           motivo_rejeicao = null, atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'APROVAR' then
    if v_papel <> 'NUTRICIONISTA' then raise exception 'Somente a nutricionista pode aprovar conteúdo.' using errcode = '42501'; end if;
    if v_ant not in ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'REJEITADO') then raise exception 'Este conteúdo não está pendente de aprovação.' using errcode = '22023'; end if;
    v_novo := 'APROVADO';
    update public.conteudo_fluxo set status = v_novo, revisado_por = v_uid, revisado_em = now(),
           motivo_rejeicao = null, atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'REJEITAR' then
    if v_papel <> 'NUTRICIONISTA' then raise exception 'Somente a nutricionista pode rejeitar conteúdo.' using errcode = '42501'; end if;
    if v_ant not in ('AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO') then raise exception 'Este conteúdo não pode ser rejeitado agora.' using errcode = '22023'; end if;
    if v_motivo is null then raise exception 'Informe o motivo da rejeição.' using errcode = '22023'; end if;
    v_novo := 'REJEITADO';
    update public.conteudo_fluxo set status = v_novo, revisado_por = v_uid, revisado_em = now(),
           motivo_rejeicao = v_motivo, publicado_por = null, publicado_em = null, atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'PUBLICAR' then
    if v_papel <> 'NUTRICIONISTA' then raise exception 'Somente a nutricionista pode publicar conteúdo.' using errcode = '42501'; end if;
    if v_ant <> 'APROVADO' then raise exception 'Só conteúdo aprovado pode ser publicado.' using errcode = '22023'; end if;
    v_novo := 'PUBLICADO';
    update public.conteudo_fluxo set status = v_novo, publicado_por = v_uid, publicado_em = now(),
           atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'ARQUIVAR' then
    if v_ant = 'ARQUIVADO' then raise exception 'Já está arquivado.' using errcode = '22023'; end if;
    v_novo := 'ARQUIVADO';
    update public.conteudo_fluxo set status = v_novo, publicado_por = null, publicado_em = null,
           atualizado_em = now() where id = v_f.id;

  elsif p_acao = 'REABRIR' then
    if v_ant not in ('REJEITADO', 'ARQUIVADO') then raise exception 'Só rejeitado ou arquivado pode ser reaberto.' using errcode = '22023'; end if;
    v_novo := 'RASCUNHO';
    update public.conteudo_fluxo set status = v_novo, atualizado_em = now() where id = v_f.id;

  else
    raise exception 'Ação inválida.' using errcode = '22023';
  end if;

  -- trilha: o app do adolescente só enxerga 'aprovada'
  if p_tipo = 'TRILHA' then
    perform set_config('app.fluxo', '1', true);
    if v_novo = 'PUBLICADO' then
      update public.trilhas set status = 'aprovada', aprovado_por = v_uid, aprovado_em = now() where id = p_id;
    elsif v_ant = 'PUBLICADO' then
      update public.trilhas set status = 'rascunho', aprovado_por = null, aprovado_em = null where id = p_id;
    end if;
    perform set_config('app.fluxo', '', true);

    if p_acao in ('APROVAR', 'REJEITAR') then -- mantém o histórico das telas de revisão
      insert into public.trilha_revisoes (trilha_id, revisor_id, decisao, comentario)
      values (p_id, v_uid, case when p_acao = 'APROVAR' then 'APROVADA' else 'DEVOLVIDA' end, v_motivo);
    end if;
  end if;

  insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_anterior, status_novo, ator_id, ator_papel, motivo)
  values (p_tipo, p_id, public.fluxo_titulo(p_tipo, p_id), v_f.versao, p_acao, v_ant, v_novo, v_uid, v_papel, v_motivo);

  select * into v_f from public.conteudo_fluxo where id = v_f.id;
  return v_f;
end;
$$;
revoke all on function public.conteudo_transicionar(text, uuid, text, text) from public;
grant execute on function public.conteudo_transicionar(text, uuid, text, text) to authenticated;

-- 9. Leituras para o painel (nomes só de equipe; nada de dados de adolescente) -
create or replace function public.conteudo_listar(p_tipo text default null, p_status text[] default null)
returns table (
  id uuid, tipo text, conteudo_id uuid, titulo text, status text, versao integer,
  criador_nome text, criado_em timestamptz, revisor_nome text, revisado_em timestamptz,
  motivo_rejeicao text, publicado_em timestamptz, atualizado_em timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if public.papel_atual() not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return query
    select f.id, f.tipo, f.conteudo_id,
           coalesce(public.fluxo_titulo(f.tipo, f.conteudo_id), '(conteúdo removido)'),
           f.status, f.versao, c.nome, f.criado_em, r.nome, f.revisado_em,
           f.motivo_rejeicao, f.publicado_em, f.atualizado_em
      from public.conteudo_fluxo f
      left join public.profiles c on c.id = f.criado_por
      left join public.profiles r on r.id = f.revisado_por
     where (p_tipo is null or f.tipo = p_tipo)
       and (p_status is null or f.status = any (p_status))
     order by f.atualizado_em desc
     limit 300;
end;
$$;
revoke all on function public.conteudo_listar(text, text[]) from public;
grant execute on function public.conteudo_listar(text, text[]) to authenticated;

create or replace function public.conteudo_auditoria_listar(p_limite integer default 100, p_tipo text default null)
returns table (
  id uuid, tipo text, conteudo_id uuid, titulo text, versao integer, acao text,
  status_anterior text, status_novo text, ator_nome text, ator_papel text, motivo text, criado_em timestamptz
) language plpgsql stable security definer set search_path = public as $$
begin
  if public.papel_atual() not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return query
    select a.id, a.tipo, a.conteudo_id, a.titulo, a.versao, a.acao, a.status_anterior, a.status_novo,
           p.nome, a.ator_papel, a.motivo, a.criado_em
      from public.conteudo_auditoria a
      left join public.profiles p on p.id = a.ator_id
     where (p_tipo is null or a.tipo = p_tipo)
     order by a.criado_em desc
     limit least(greatest(coalesce(p_limite, 100), 1), 500);
end;
$$;
revoke all on function public.conteudo_auditoria_listar(integer, text) from public;
grant execute on function public.conteudo_auditoria_listar(integer, text) to authenticated;

-- 10. Receitas: adolescente só vê PUBLICADO ------------------------------------
do $$
declare v_rls boolean;
begin
  select relrowsecurity into v_rls from pg_class where oid = 'public.receitas'::regclass;
  if not v_rls then
    -- RLS estava desligado: liga, mantendo leitura geral e escrita da equipe
    alter table public.receitas enable row level security;
    drop policy if exists "receitas_leitura_autenticados" on public.receitas;
    create policy "receitas_leitura_autenticados" on public.receitas
      for select to authenticated using (true);
    drop policy if exists "receitas_escrita_staff" on public.receitas;
    create policy "receitas_escrita_staff" on public.receitas
      for all to authenticated
      using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'))
      with check (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR'));
    raise notice 'RLS de receitas estava desligado e foi ligado com policies básicas.';
  end if;
end $$;

drop policy if exists "receitas_so_publicadas" on public.receitas;
create policy "receitas_so_publicadas" on public.receitas
  as restrictive for select to authenticated
  using (public.papel_atual() in ('NUTRICIONISTA', 'ADMINISTRADOR') or public.receita_publicada(id));
