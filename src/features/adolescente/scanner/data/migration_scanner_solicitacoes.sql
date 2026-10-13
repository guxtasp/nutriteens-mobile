-- migration_scanner_solicitacoes.sql — pedidos de cadastro de produtos que o scanner não achou.
-- Idempotente. Rodar DEPOIS de migration_scanner.sql (usa produtos_scanner e public.papel_atual()).
--
--  * scanner_solicitacoes: UM pedido PENDENTE por código de barras (vários usuários só aumentam `pedidos`).
--  * scanner_solicitacao_pedidos: quem pediu (evita um usuário inflar a contagem e limita abuso diário).
--    A equipe NUNCA enxerga quem pediu: as RPCs de listagem não devolvem user_id (LGPD / menores).
--  * Nenhum acesso direto às tabelas: tudo por RPC security definer.
--      - app (qualquer autenticado): scanner_solicitar_cadastro
--      - equipe (NUTRICIONISTA/ADMINISTRADOR): listar, contar e resolver
--  * Aprovar grava em produtos_scanner com fonte 'EQUIPE' (sobrescreve cache da OFF ou ficha incompleta).
begin;

create table if not exists public.scanner_solicitacoes (
  id               uuid primary key default gen_random_uuid(),
  codigo_barras    text not null check (codigo_barras ~ '^[0-9]{8,14}$'),
  motivo           text not null check (motivo in ('NAO_ENCONTRADO','FICHA_INCOMPLETA')),
  nome_informado   text check (nome_informado is null or char_length(nome_informado) between 1 and 200),
  marca_informada  text check (marca_informada is null or char_length(marca_informada) <= 120),
  candidato_codigo text check (candidato_codigo is null or candidato_codigo ~ '^[0-9]{8,14}$'),
  candidato_nome   text check (candidato_nome is null or char_length(candidato_nome) <= 200),
  pedidos          integer not null default 1 check (pedidos >= 1),
  status           text not null default 'PENDENTE' check (status in ('PENDENTE','APROVADA','REJEITADA')),
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  resolvido_por    uuid references public.profiles(id),
  resolvido_em     timestamptz,
  nota_equipe      text check (nota_equipe is null or char_length(nota_equipe) <= 500)
);

create unique index if not exists scanner_solicitacoes_pendente_uk
  on public.scanner_solicitacoes (codigo_barras) where status = 'PENDENTE';
create index if not exists scanner_solicitacoes_status_idx
  on public.scanner_solicitacoes (status, pedidos desc, criado_em);

create table if not exists public.scanner_solicitacao_pedidos (
  solicitacao_id uuid not null references public.scanner_solicitacoes(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  criado_em      timestamptz not null default now(),
  primary key (solicitacao_id, user_id)
);
create index if not exists scanner_pedidos_user_idx on public.scanner_solicitacao_pedidos (user_id, criado_em);

alter table public.scanner_solicitacoes enable row level security;
alter table public.scanner_solicitacao_pedidos enable row level security;
revoke all on public.scanner_solicitacoes from anon, authenticated;
revoke all on public.scanner_solicitacao_pedidos from anon, authenticated;
-- sem policies: só as funções abaixo (security definer) tocam nas tabelas.

-- App: pedir cadastro ------------------------------------------------------------------------
create or replace function public.scanner_solicitar_cadastro(
  p_codigo           text,
  p_motivo           text default 'NAO_ENCONTRADO',
  p_nome             text default null,
  p_marca            text default null,
  p_candidato_codigo text default null,
  p_candidato_nome   text default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_nome  text := left(nullif(btrim(coalesce(p_nome, '')), ''), 200);
  v_marca text := left(nullif(btrim(coalesce(p_marca, '')), ''), 120);
  v_cand  text := nullif(btrim(coalesce(p_candidato_codigo, '')), '');
  v_cnome text := left(nullif(btrim(coalesce(p_candidato_nome, '')), ''), 200);
  v_id    uuid;
  v_nova  boolean;
  v_linhas integer;
begin
  if v_uid is null then raise exception 'Sem permissão.' using errcode = '42501'; end if;
  if p_codigo is null or p_codigo !~ '^[0-9]{8,14}$' then
    raise exception 'Código inválido.' using errcode = '22023';
  end if;
  if p_motivo not in ('NAO_ENCONTRADO','FICHA_INCOMPLETA') then
    raise exception 'Motivo inválido.' using errcode = '22023';
  end if;
  if v_cand is not null and v_cand !~ '^[0-9]{8,14}$' then v_cand := null; v_cnome := null; end if;

  -- a equipe já cadastrou (ou o cache já tem): nada a pedir
  if exists (select 1 from public.produtos_scanner where codigo_barras = p_codigo and fonte = 'EQUIPE') then
    return jsonb_build_object('produto_existe', true);
  end if;

  -- limite diário por usuário (anti-abuso)
  if (select count(*) from public.scanner_solicitacao_pedidos
        where user_id = v_uid and criado_em > now() - interval '1 day') >= 10 then
    raise exception 'Limite diário de pedidos atingido.' using errcode = 'P0001';
  end if;

  insert into public.scanner_solicitacoes (codigo_barras, motivo, nome_informado, marca_informada, candidato_codigo, candidato_nome)
  values (p_codigo, p_motivo, v_nome, v_marca, v_cand, v_cnome)
  on conflict (codigo_barras) where status = 'PENDENTE'
  do update set
    nome_informado   = coalesce(scanner_solicitacoes.nome_informado, excluded.nome_informado),
    marca_informada  = coalesce(scanner_solicitacoes.marca_informada, excluded.marca_informada),
    candidato_codigo = coalesce(scanner_solicitacoes.candidato_codigo, excluded.candidato_codigo),
    candidato_nome   = coalesce(scanner_solicitacoes.candidato_nome, excluded.candidato_nome),
    atualizado_em    = now()
  returning id, (xmax = 0) into v_id, v_nova;

  insert into public.scanner_solicitacao_pedidos (solicitacao_id, user_id) values (v_id, v_uid)
  on conflict do nothing;
  get diagnostics v_linhas = row_count;

  if v_linhas = 1 and not v_nova then
    update public.scanner_solicitacoes set pedidos = pedidos + 1 where id = v_id;
  end if;

  return jsonb_build_object('produto_existe', false, 'ja_existia', not v_nova, 'id', v_id);
end;
$$;
revoke all on function public.scanner_solicitar_cadastro(text, text, text, text, text, text) from public, anon;
grant execute on function public.scanner_solicitar_cadastro(text, text, text, text, text, text) to authenticated;

-- Equipe: listar, contar, resolver -------------------------------------------------------------
create or replace function public.scanner_listar_solicitacoes(p_status text default 'PENDENTE')
returns table (
  id uuid, codigo_barras text, motivo text, nome_informado text, marca_informada text,
  candidato_codigo text, candidato_nome text, pedidos integer, status text,
  criado_em timestamptz, nota_equipe text,
  produto_atual_nome text, produto_atual_fonte text
)
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.papel_atual()::text, '') not in ('NUTRICIONISTA','ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return query
    select s.id, s.codigo_barras, s.motivo, s.nome_informado, s.marca_informada,
           s.candidato_codigo, s.candidato_nome, s.pedidos, s.status, s.criado_em, s.nota_equipe,
           p.nome, p.fonte
      from public.scanner_solicitacoes s
      left join public.produtos_scanner p on p.codigo_barras = s.codigo_barras
     where s.status = p_status
     order by s.pedidos desc, s.criado_em
     limit 200;
end;
$$;

create or replace function public.scanner_contar_solicitacoes() returns integer
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.papel_atual()::text, '') not in ('NUTRICIONISTA','ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return (select count(*)::integer from public.scanner_solicitacoes where status = 'PENDENTE');
end;
$$;

create or replace function public.scanner_resolver_solicitacao(
  p_id        uuid,
  p_acao      text,                  -- 'APROVAR' | 'REJEITAR'
  p_nome      text default null,
  p_marca     text default null,
  p_nova      text default null,
  p_categoria text default null,
  p_nota      text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.scanner_solicitacoes;
  v_nome text := left(nullif(btrim(coalesce(p_nome, '')), ''), 200);
begin
  if coalesce(public.papel_atual()::text, '') not in ('NUTRICIONISTA','ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_acao not in ('APROVAR','REJEITAR') then raise exception 'Ação inválida.' using errcode = '22023'; end if;

  select * into s from public.scanner_solicitacoes where id = p_id for update;
  if not found then raise exception 'Solicitação não encontrada.' using errcode = 'P0002'; end if;
  if s.status <> 'PENDENTE' then raise exception 'Solicitação já resolvida.' using errcode = 'P0001'; end if;

  if p_acao = 'APROVAR' then
    if v_nome is null then raise exception 'Informe o nome do produto.' using errcode = '22023'; end if;
    insert into public.produtos_scanner (codigo_barras, nome, marca, classificacao_nova, categoria_troca, fonte)
    values (s.codigo_barras, v_nome, left(nullif(btrim(coalesce(p_marca, '')), ''), 120), p_nova, p_categoria, 'EQUIPE')
    on conflict (codigo_barras) do update set
      nome = excluded.nome, marca = excluded.marca,
      classificacao_nova = excluded.classificacao_nova, categoria_troca = excluded.categoria_troca,
      fonte = 'EQUIPE';
  end if;

  update public.scanner_solicitacoes set
    status = case p_acao when 'APROVAR' then 'APROVADA' else 'REJEITADA' end,
    resolvido_por = auth.uid(), resolvido_em = now(), atualizado_em = now(),
    nota_equipe = left(nullif(btrim(coalesce(p_nota, '')), ''), 500)
  where id = p_id;
end;
$$;

revoke all on function public.scanner_listar_solicitacoes(text) from public, anon;
revoke all on function public.scanner_contar_solicitacoes() from public, anon;
revoke all on function public.scanner_resolver_solicitacao(uuid, text, text, text, text, text, text) from public, anon;
grant execute on function public.scanner_listar_solicitacoes(text) to authenticated;
grant execute on function public.scanner_contar_solicitacoes() to authenticated;
grant execute on function public.scanner_resolver_solicitacao(uuid, text, text, text, text, text, text) to authenticated;

commit;
