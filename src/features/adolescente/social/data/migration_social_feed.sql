-- MIGRAÇÃO: FEED SOCIAL (atividades dos amigos + reações prontas)
-- Rode DEPOIS de migration_social_amizades.sql, migration_chama_dupla.sql e
-- migration_social_perfil_amigo.sql, no SQL Editor do Supabase.
-- É idempotente: pode rodar de novo sem erro.
--
-- Princípios (mesmos do resto do social, ver requisitos-social.md):
--  * SEM texto livre: o feed só mostra eventos de COMPORTAMENTO gerados pelo
--    próprio sistema (insígnia, lição, fase do Broxis, sequência, receita feita,
--    Chama em Dupla) e reações de um conjunto fixo (parabéns, força, bora, fogo).
--  * NUNCA entram no feed: refeições, alimentos, trocas de alimento, água/atividade
--    em quantidade, peso, altura, EBIA, nome real, escola, nascimento, gênero.
--  * Compartilhar é OPT-IN: profiles.feed_visivel nasce NULL (= ainda não
--    perguntado) e só gera eventos se for TRUE. Desligar apaga os eventos da pessoa.
--  * Só amigos ACEITOS e não bloqueados veem os eventos (e só se o autor deixou
--    visível). Quem recebe a reação vê quem reagiu; os outros veem só a contagem.
--  * Tabelas fechadas (RLS ligado, sem políticas); tudo por funções
--    SECURITY DEFINER que filtram por auth.uid().
--  * Os gatilhos NUNCA podem quebrar a ação original (ganhar insígnia, concluir
--    lição…): qualquer erro dentro deles é engolido.

begin;

-- ---------------------------------------------------------------------------
-- 1) Consentimento: NULL = não perguntou, TRUE = compartilha, FALSE = recusou
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists feed_visivel boolean;

-- ---------------------------------------------------------------------------
-- 2) Tabelas
-- ---------------------------------------------------------------------------
create table if not exists public.feed_eventos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (tipo in ('INSIGNIA', 'LICAO', 'FASE', 'SEQUENCIA', 'RECEITA', 'CHAMA_DUPLA')),
  ref_id uuid,
  ref_texto text check (ref_texto is null or char_length(ref_texto) <= 60),
  props jsonb not null default '{}'::jsonb
    check (jsonb_typeof(props) = 'object' and octet_length(props::text) <= 300),
  -- "dia" no fuso do Brasil: serve para juntar eventos repetitivos do mesmo dia
  dia date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  criado_em timestamptz not null default now()
);
create index if not exists feed_eventos_usuario_idx on public.feed_eventos (usuario_id, criado_em desc);
create index if not exists feed_eventos_recentes_idx on public.feed_eventos (criado_em desc);

-- um evento por dia para o que se repete muito (lições, receitas, sequência)
create unique index if not exists feed_eventos_dia_uq
  on public.feed_eventos (usuario_id, tipo, dia)
  where tipo in ('LICAO', 'RECEITA', 'SEQUENCIA');
-- e uma única vez para o que acontece uma vez só
create unique index if not exists feed_eventos_insignia_uq
  on public.feed_eventos (usuario_id, ref_id) where tipo in ('INSIGNIA', 'CHAMA_DUPLA');
create unique index if not exists feed_eventos_fase_uq
  on public.feed_eventos (usuario_id, ref_texto) where tipo = 'FASE';

create table if not exists public.feed_reacoes (
  evento_id uuid not null references public.feed_eventos(id) on delete cascade,
  usuario_id uuid not null references public.profiles(id) on delete cascade,
  reacao text not null check (reacao in ('PARABENS', 'FORCA', 'BORA', 'FOGO')),
  criado_em timestamptz not null default now(),
  primary key (evento_id, usuario_id)   -- uma reação por pessoa por evento
);
create index if not exists feed_reacoes_usuario_idx on public.feed_reacoes (usuario_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- 3) Geração dos eventos (interna)
-- ---------------------------------------------------------------------------
create or replace function public._feed_registrar(
  p_uid uuid, p_tipo text, p_ref uuid default null, p_texto text default null, p_props jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- só quem aceitou compartilhar (e já tem apelido) gera eventos
  if not exists (
    select 1 from public.profiles p
    where p.id = p_uid and p.feed_visivel is true and p.apelido is not null
  ) then
    return;
  end if;

  -- retenção: nada com mais de 30 dias fica guardado
  delete from public.feed_eventos e where e.usuario_id = p_uid and e.criado_em < now() - interval '30 days';

  if p_tipo in ('LICAO', 'RECEITA', 'SEQUENCIA') then
    insert into public.feed_eventos (usuario_id, tipo, props)
    values (p_uid, p_tipo, coalesce(p_props, '{}'::jsonb))
    on conflict (usuario_id, tipo, dia) where tipo in ('LICAO', 'RECEITA', 'SEQUENCIA')
    do update set
      props = case
        when feed_eventos.tipo = 'SEQUENCIA' then excluded.props
        else jsonb_build_object('n', coalesce((feed_eventos.props ->> 'n')::int, 1) + 1)
      end,
      criado_em = now();
  else
    insert into public.feed_eventos (usuario_id, tipo, ref_id, ref_texto, props)
    values (p_uid, p_tipo, p_ref, p_texto, coalesce(p_props, '{}'::jsonb))
    on conflict do nothing;
  end if;
end $$;

-- 3a) insígnia, marco ou conquista obtida
create or replace function public._feed_trg_insignia()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    perform public._feed_registrar(new.usuario_id, 'INSIGNIA', new.insignia_id);
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists feed_trg_insignia on public.insignias_usuario;
create trigger feed_trg_insignia after insert on public.insignias_usuario
  for each row execute function public._feed_trg_insignia();

-- 3b) lição concluída (juntadas por dia: "concluiu 3 lições hoje")
create or replace function public._feed_trg_licao()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    perform public._feed_registrar(new.usuario_id, 'LICAO', null, null, jsonb_build_object('n', 1));
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists feed_trg_licao on public.progresso_licao;
create trigger feed_trg_licao after insert on public.progresso_licao
  for each row execute function public._feed_trg_licao();

-- 3c) subiu de fase do Broxis
create or replace function public._feed_trg_fase()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    if new.fase_atual is distinct from old.fase_atual then
      perform public._feed_registrar(new.usuario_id, 'FASE', null, new.fase_atual);
    end if;
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists feed_trg_fase on public.xp_usuario;
create trigger feed_trg_fase after update of fase_atual on public.xp_usuario
  for each row execute function public._feed_trg_fase();

-- 3d) marcos de sequência: 7, 14 e 30 dias
create or replace function public._feed_trg_sequencia()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    if new.sequencia_atual in (7, 14, 30) and new.sequencia_atual > coalesce(old.sequencia_atual, 0) then
      perform public._feed_registrar(new.id, 'SEQUENCIA', null, null, jsonb_build_object('dias', new.sequencia_atual));
    end if;
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists feed_trg_sequencia on public.profiles;
create trigger feed_trg_sequencia after update of sequencia_atual on public.profiles
  for each row execute function public._feed_trg_sequencia();

-- 3e) receita feita (o app já registra o evento receita_concluida)
create or replace function public._feed_trg_receita()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    if new.nome = 'receita_concluida' then
      perform public._feed_registrar(new.user_id, 'RECEITA', null, null, jsonb_build_object('n', 1));
    end if;
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists feed_trg_receita on public.eventos_app;
create trigger feed_trg_receita after insert on public.eventos_app
  for each row execute function public._feed_trg_receita();

-- 3f) Chama em Dupla começou (aparece para os dois, cada um respeitando o seu consentimento)
create or replace function public._feed_trg_chama()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  begin
    if new.status = 'ativa' and old.status is distinct from 'ativa' then
      perform public._feed_registrar(new.convidante_id, 'CHAMA_DUPLA', new.id);
      perform public._feed_registrar(new.convidado_id, 'CHAMA_DUPLA', new.id);
    end if;
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists feed_trg_chama on public.chamas_dupla;
create trigger feed_trg_chama after update of status on public.chamas_dupla
  for each row execute function public._feed_trg_chama();

-- ---------------------------------------------------------------------------
-- 4) Funções que o app chama
-- ---------------------------------------------------------------------------

-- Estado do consentimento: NULL (não perguntado) / TRUE / FALSE.
create or replace function public.social_feed_visivel()
returns table (visivel boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if auth.uid() is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return query select p.feed_visivel from public.profiles p where p.id = auth.uid();
end $$;

-- Liga/desliga o compartilhamento. Desligar APAGA os eventos e as reações recebidas.
-- Retorna: 'ok' | 'sem_apelido' (precisa de apelido para ligar)
create or replace function public.social_definir_feed_visivel(p_visivel boolean)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_apelido text;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if p_visivel is null then return 'ok'; end if;

  select p.apelido into v_apelido from public.profiles p where p.id = v_uid;
  if p_visivel and v_apelido is null then return 'sem_apelido'; end if;

  update public.profiles set feed_visivel = p_visivel where id = v_uid;
  if not p_visivel then
    delete from public.feed_eventos where usuario_id = v_uid;  -- reações caem em cascata
  end if;
  return 'ok';
end $$;

-- O feed: eventos dos amigos aceitos (e meus), dos últimos 14 dias, no máximo 50.
-- Para eventos MEUS, "quem_reagiu" traz apelido+reação; para os dos outros, só a contagem.
create or replace function public.social_feed(p_limite integer default 50)
returns table (
  evento_id uuid,
  amizade_id uuid,
  autor_apelido text,
  autor_avatar text,
  tipo text,
  props jsonb,
  criado_em timestamptz,
  reacoes jsonb,
  minha_reacao text,
  eh_meu boolean,
  quem_reagiu jsonb
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_lim int := least(greatest(coalesce(p_limite, 50), 1), 50);
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;

  return query
    select
      e.id,
      a.id,
      p.apelido,
      p.avatar_social,
      e.tipo,
      case e.tipo
        when 'INSIGNIA' then coalesce((
          select jsonb_build_object('nome', i.nome, 'icone', i.icone, 'categoria', i.categoria)
          from public.insignias i where i.id = e.ref_id
        ), '{}'::jsonb)
        when 'FASE' then coalesce((
          select jsonb_build_object('titulo', f.titulo)
          from public.fases_mascote f where f.fase = e.ref_texto
        ), '{}'::jsonb)
        else e.props
      end,
      e.criado_em,
      coalesce((
        select jsonb_object_agg(r.reacao, r.n)
        from (select fr.reacao, count(*)::int as n from public.feed_reacoes fr
              where fr.evento_id = e.id group by fr.reacao) r
      ), '{}'::jsonb),
      (select fr.reacao from public.feed_reacoes fr where fr.evento_id = e.id and fr.usuario_id = v_uid),
      (e.usuario_id = v_uid),
      case when e.usuario_id = v_uid then coalesce((
        select jsonb_agg(jsonb_build_object('apelido', pr.apelido, 'reacao', fr.reacao) order by fr.criado_em)
        from public.feed_reacoes fr
        join public.profiles pr on pr.id = fr.usuario_id
        where fr.evento_id = e.id and pr.apelido is not null
          and not public._social_bloqueado(v_uid, fr.usuario_id)
      ), '[]'::jsonb) else null end
    from public.feed_eventos e
    join public.profiles p on p.id = e.usuario_id
    left join public.amizades a
      on a.status = 'aceita'
     and ((a.solicitante_id = v_uid and a.destinatario_id = e.usuario_id)
       or (a.destinatario_id = v_uid and a.solicitante_id = e.usuario_id))
    where p.feed_visivel is true
      and p.apelido is not null
      and e.criado_em > now() - interval '14 days'
      and (e.usuario_id = v_uid
           or (a.id is not null and not public._social_bloqueado(v_uid, e.usuario_id)))
    order by e.criado_em desc
    limit v_lim;
end $$;

-- Reage a um evento de amigo. Reagir de novo com a MESMA reação remove; com outra, troca.
-- Retorna: 'ok' | 'removida' | 'invalida' | 'indisponivel' | 'limite'
create or replace function public.social_reagir(p_evento_id uuid, p_reacao text)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_autor uuid;
  v_atual text;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  if p_reacao is null or p_reacao not in ('PARABENS', 'FORCA', 'BORA', 'FOGO') then return 'invalida'; end if;

  select e.usuario_id into v_autor
  from public.feed_eventos e
  join public.profiles p on p.id = e.usuario_id and p.feed_visivel is true
  where e.id = p_evento_id and e.criado_em > now() - interval '14 days';

  -- evento inexistente, meu, de quem não é meu amigo aceito ou bloqueado: mesma resposta
  if v_autor is null or v_autor = v_uid then return 'indisponivel'; end if;
  if not exists (
    select 1 from public.amizades a
    where a.status = 'aceita'
      and ((a.solicitante_id = v_uid and a.destinatario_id = v_autor)
        or (a.destinatario_id = v_uid and a.solicitante_id = v_autor))
  ) or public._social_bloqueado(v_uid, v_autor) then
    return 'indisponivel';
  end if;

  select r.reacao into v_atual from public.feed_reacoes r where r.evento_id = p_evento_id and r.usuario_id = v_uid;

  if v_atual = p_reacao then
    delete from public.feed_reacoes where evento_id = p_evento_id and usuario_id = v_uid;
    return 'removida';
  end if;

  -- limite diário (anti-spam): 60 reações novas por dia
  if v_atual is null and (
    select count(*) from public.feed_reacoes r
    where r.usuario_id = v_uid and r.criado_em > now() - interval '1 day'
  ) >= 60 then
    return 'limite';
  end if;

  insert into public.feed_reacoes (evento_id, usuario_id, reacao)
  values (p_evento_id, v_uid, p_reacao)
  on conflict (evento_id, usuario_id) do update set reacao = excluded.reacao, criado_em = now();
  return 'ok';
end $$;

-- Quem dos meus amigos já manteve a sequência hoje (para o anel na faixa de amigos).
-- Só devolve o que o perfil do amigo já mostra (sequência), nada além.
create or replace function public.social_amigos_hoje()
returns table (amizade_id uuid, manteve_hoje boolean)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;
  return query
    select a.id, (p.ultimo_dia_mantido is not null and p.ultimo_dia_mantido >= v_hoje)
    from public.amizades a
    join public.profiles p
      on p.id = case when a.solicitante_id = v_uid then a.destinatario_id else a.solicitante_id end
    where a.status = 'aceita'
      and (a.solicitante_id = v_uid or a.destinatario_id = v_uid)
      and not public._social_bloqueado(v_uid, p.id);
end $$;

-- ---------------------------------------------------------------------------
-- 5) eventos_app: aceitar os dois eventos novos de uso
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.eventos_app'::regclass and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%nome%scanner_lido%'
  loop
    execute format('alter table public.eventos_app drop constraint %I', r.conname);
  end loop;

  alter table public.eventos_app add constraint eventos_app_nome_check check (nome = any (array[
    'login', 'cadastro_concluido', 'onboarding_concluido', 'triagem_concluida',
    'alimentacao_registrada', 'agua_registrada', 'atividade_registrada',
    'desafio_visualizado', 'desafio_iniciado', 'desafio_concluido',
    'trilha_visualizada', 'trilha_iniciada', 'trilha_concluida', 'licao_concluida',
    'receita_visualizada', 'receita_concluida',
    'amizade_solicitada', 'amizade_aceita', 'conteudo_abandonado',
    'troca_sugerida', 'troca_aceita', 'troca_recusada',
    'scanner_lido', 'feed_visualizado', 'reacao_enviada'
  ]::text[]));
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 6) Permissões: tabelas fechadas; funções internas só do banco; social_* só logado
-- ---------------------------------------------------------------------------
alter table public.feed_eventos enable row level security;
alter table public.feed_reacoes enable row level security;
revoke all on table public.feed_eventos, public.feed_reacoes from anon, authenticated;

do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as assinatura
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.proname like '\_feed\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.assinatura);
  end loop;
  for r in
    select p.oid::regprocedure as assinatura
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('social_feed_visivel', 'social_definir_feed_visivel', 'social_feed',
                        'social_reagir', 'social_amigos_hoje')
  loop
    execute format('revoke all on function %s from public, anon', r.assinatura);
    execute format('grant execute on function %s to authenticated', r.assinatura);
  end loop;
end $$;

commit;
