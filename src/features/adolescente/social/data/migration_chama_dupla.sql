-- MIGRAÇÃO: CHAMA EM DUPLA (sequência colaborativa entre dois amigos)
-- Execute no SQL Editor do Supabase. Idempotente. Requer migration_amizades.sql.
--
-- Regras:
--  * só amigos (amizade aceita) podem formar uma dupla; um convite precisa ser aceito;
--  * cada pessoa pode ter no máximo UMA dupla ativa;
--  * o dia da dupla só conta se OS DOIS cumprirem o dia (ultimo_dia_* de cada um == dia);
--  * dia perdido gasta 1 "vida" automaticamente (a sequência é mantida, sem avançar);
--    sem vidas para cobrir os dias perdidos, a sequência zera e as 3 vidas voltam;
--  * o banco NUNCA guarda nem devolve quem falhou: o aviso é neutro para os dois;
--  * desfazer a amizade apaga a dupla (on delete cascade);
--  * tabela sem acesso direto (RLS ligado, sem políticas); tudo via funções chama_dupla_*.

begin;

create table if not exists public.chamas_dupla (
  id uuid primary key default gen_random_uuid(),
  amizade_id uuid not null references public.amizades(id) on delete cascade,
  convidante_id uuid not null references public.profiles(id) on delete cascade,
  convidado_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'ativa', 'encerrada')),
  sequencia_atual integer not null default 0 check (sequencia_atual >= 0),
  maior_sequencia integer not null default 0 check (maior_sequencia >= 0),
  vidas_restantes integer not null default 3 check (vidas_restantes between 0 and 3),
  -- último dia em que cada um cumpriu o dia (para a sincronia da dupla)
  ultimo_dia_convidante date,
  ultimo_dia_convidado date,
  -- último dia (ou dia coberto por vida) já resolvido para a dupla
  ultimo_dia_dupla date,
  -- aviso neutro pendente: VIDA_USADA | ENCERRADA (visto separadamente por cada um)
  aviso text check (aviso in ('VIDA_USADA', 'ENCERRADA')),
  aviso_visto_convidante boolean not null default true,
  aviso_visto_convidado boolean not null default true,
  criado_em timestamptz not null default now(),
  iniciada_em timestamptz,
  check (convidante_id <> convidado_id)
);
-- um convite/dupla aberto por amizade
create unique index if not exists chamas_dupla_amizade_aberta_uq
  on public.chamas_dupla (amizade_id) where status in ('pendente', 'ativa');
-- no máximo uma dupla ativa por pessoa
create unique index if not exists chamas_dupla_ativa_convidante_uq
  on public.chamas_dupla (convidante_id) where status = 'ativa';
create unique index if not exists chamas_dupla_ativa_convidado_uq
  on public.chamas_dupla (convidado_id) where status = 'ativa';
create index if not exists chamas_dupla_convidado_idx on public.chamas_dupla (convidado_id, status);

alter table public.chamas_dupla enable row level security;
revoke all on public.chamas_dupla from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Interno: "hoje" no fuso do Brasil
-- ---------------------------------------------------------------------------
create or replace function public._chama_hoje()
returns date language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- ---------------------------------------------------------------------------
-- Interno: aplica dias perdidos (vidas / zerar). Chamada antes de ler/gravar.
-- ---------------------------------------------------------------------------
create or replace function public._chama_reconciliar(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  c public.chamas_dupla%rowtype;
  v_hoje date := public._chama_hoje();
  v_perdidos integer;
begin
  select * into c from public.chamas_dupla where id = p_id for update;
  if not found or c.status <> 'ativa' then return; end if;

  v_perdidos := (v_hoje - 1) - c.ultimo_dia_dupla;
  if v_perdidos <= 0 then return; end if;

  if c.sequencia_atual = 0 then
    -- nada a perder: só avança a referência
    update public.chamas_dupla set ultimo_dia_dupla = v_hoje - 1 where id = c.id;
  elsif c.vidas_restantes >= v_perdidos then
    update public.chamas_dupla
       set vidas_restantes = c.vidas_restantes - v_perdidos,
           ultimo_dia_dupla = v_hoje - 1,
           aviso = 'VIDA_USADA',
           aviso_visto_convidante = false,
           aviso_visto_convidado = false
     where id = c.id;
  else
    update public.chamas_dupla
       set sequencia_atual = 0,
           vidas_restantes = 3,
           ultimo_dia_dupla = v_hoje - 1,
           aviso = 'ENCERRADA',
           aviso_visto_convidante = false,
           aviso_visto_convidado = false
     where id = c.id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Convidar: recebe o id da AMIZADE (o app nunca vê o id do amigo)
-- retorno: enviado | sem_amizade | ja_existe | ocupado | limite
-- ---------------------------------------------------------------------------
create or replace function public.chama_dupla_convidar(p_amizade_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := auth.uid();
  a public.amizades%rowtype;
  v_outro uuid;
begin
  if v_eu is null or not public._amizade_eh_adolescente(v_eu) then return 'sem_amizade'; end if;

  select * into a from public.amizades
   where id = p_amizade_id and status = 'aceita' and v_eu in (solicitante_id, destinatario_id);
  if not found then return 'sem_amizade'; end if;

  v_outro := case when a.solicitante_id = v_eu then a.destinatario_id else a.solicitante_id end;

  if exists (select 1 from public.bloqueios
              where (bloqueador_id = v_eu and bloqueado_id = v_outro)
                 or (bloqueador_id = v_outro and bloqueado_id = v_eu)) then
    return 'sem_amizade';
  end if;

  if exists (select 1 from public.chamas_dupla where amizade_id = a.id and status in ('pendente', 'ativa')) then
    return 'ja_existe';
  end if;
  if exists (select 1 from public.chamas_dupla
              where status = 'ativa' and v_eu in (convidante_id, convidado_id)) then
    return 'ocupado';
  end if;
  if exists (select 1 from public.chamas_dupla
              where status = 'ativa' and v_outro in (convidante_id, convidado_id)) then
    return 'ocupado';
  end if;
  if (select count(*) from public.chamas_dupla where convidante_id = v_eu and status = 'pendente') >= 3 then
    return 'limite';
  end if;

  insert into public.chamas_dupla (amizade_id, convidante_id, convidado_id)
  values (a.id, v_eu, v_outro);
  return 'enviado';
end;
$$;

-- ---------------------------------------------------------------------------
-- Responder (só o convidado). Aceitar ativa a dupla; recusar apaga o convite.
-- retorno: true se algo mudou
-- ---------------------------------------------------------------------------
create or replace function public.chama_dupla_responder(p_id uuid, p_aceitar boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := auth.uid();
  c public.chamas_dupla%rowtype;
begin
  select * into c from public.chamas_dupla
   where id = p_id and status = 'pendente' and convidado_id = v_eu for update;
  if not found then return false; end if;

  if not p_aceitar then
    delete from public.chamas_dupla where id = c.id;
    return true;
  end if;

  -- se um dos dois já entrou em outra dupla ativa, o convite perde o sentido
  if exists (select 1 from public.chamas_dupla
              where status = 'ativa' and id <> c.id
                and (convidante_id in (c.convidante_id, c.convidado_id)
                  or convidado_id in (c.convidante_id, c.convidado_id))) then
    return false;
  end if;

  update public.chamas_dupla
     set status = 'ativa',
         iniciada_em = now(),
         ultimo_dia_dupla = public._chama_hoje() - 1
   where id = c.id;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Cancelar convite enviado, recusar ou sair da dupla (qualquer lado)
-- ---------------------------------------------------------------------------
create or replace function public.chama_dupla_encerrar(p_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_eu uuid := auth.uid();
begin
  update public.chamas_dupla
     set status = 'encerrada'
   where id = p_id and status in ('pendente', 'ativa')
     and v_eu in (convidante_id, convidado_id);
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- Registrar que EU cumpri o dia de hoje. Se os dois cumpriram, a sequência avança.
-- Idempotente: pode ser chamada várias vezes no dia.
-- ---------------------------------------------------------------------------
create or replace function public.chama_dupla_registrar_hoje()
returns void language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._chama_hoje();
  c record;
begin
  if v_eu is null then return; end if;

  for c in select id from public.chamas_dupla
            where status = 'ativa' and v_eu in (convidante_id, convidado_id) loop
    perform public._chama_reconciliar(c.id);

    update public.chamas_dupla
       set ultimo_dia_convidante = case when convidante_id = v_eu then v_hoje else ultimo_dia_convidante end,
           ultimo_dia_convidado  = case when convidado_id  = v_eu then v_hoje else ultimo_dia_convidado end
     where id = c.id and status = 'ativa';

    -- os dois cumpriram hoje e hoje ainda não foi contado
    update public.chamas_dupla
       set sequencia_atual = sequencia_atual + 1,
           maior_sequencia = greatest(maior_sequencia, sequencia_atual + 1),
           ultimo_dia_dupla = v_hoje
     where id = c.id and status = 'ativa'
       and ultimo_dia_convidante = v_hoje and ultimo_dia_convidado = v_hoje
       and ultimo_dia_dupla < v_hoje;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Listar minhas duplas (ativas + convites). Nada que identifique quem falhou.
-- situacao: ativa | recebido | enviado
-- ---------------------------------------------------------------------------
create or replace function public.chama_dupla_listar()
returns table (
  id uuid, situacao text, amizade_id uuid, apelido text, avatar text,
  sequencia_atual integer, maior_sequencia integer, vidas_restantes integer,
  eu_fiz_hoje boolean, dupla_fez_hoje boolean, concluida_hoje boolean, aviso text
)
language plpgsql security definer set search_path = public as $$
declare
  v_eu uuid := auth.uid();
  v_hoje date := public._chama_hoje();
  c record;
begin
  if v_eu is null or not public._amizade_eh_adolescente(v_eu) then return; end if;

  for c in select x.id from public.chamas_dupla x
            where x.status = 'ativa' and v_eu in (x.convidante_id, x.convidado_id) loop
    perform public._chama_reconciliar(c.id);
  end loop;

  return query
  select d.id,
         case when d.status = 'ativa' then 'ativa'
              when d.convidado_id = v_eu then 'recebido' else 'enviado' end,
         d.amizade_id,
         p.apelido,
         p.avatar_social,
         d.sequencia_atual,
         d.maior_sequencia,
         d.vidas_restantes,
         coalesce(case when d.convidante_id = v_eu then d.ultimo_dia_convidante else d.ultimo_dia_convidado end = v_hoje, false),
         coalesce(case when d.convidante_id = v_eu then d.ultimo_dia_convidado else d.ultimo_dia_convidante end = v_hoje, false),
         (d.ultimo_dia_dupla = v_hoje),
         case when d.status = 'ativa'
               and not (case when d.convidante_id = v_eu then d.aviso_visto_convidante else d.aviso_visto_convidado end)
              then d.aviso end
    from public.chamas_dupla d
    join public.profiles p
      on p.id = case when d.convidante_id = v_eu then d.convidado_id else d.convidante_id end
   where d.status in ('pendente', 'ativa') and v_eu in (d.convidante_id, d.convidado_id)
   order by d.status, d.criado_em desc;
end;
$$;

create or replace function public.chama_dupla_aviso_visto(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.chamas_dupla
     set aviso_visto_convidante = aviso_visto_convidante or convidante_id = auth.uid(),
         aviso_visto_convidado  = aviso_visto_convidado  or convidado_id  = auth.uid()
   where id = p_id and auth.uid() in (convidante_id, convidado_id);
$$;

revoke all on function public._chama_hoje() from public, anon, authenticated;
revoke all on function public._chama_reconciliar(uuid) from public, anon, authenticated;
revoke all on function public.chama_dupla_convidar(uuid) from public, anon;
revoke all on function public.chama_dupla_responder(uuid, boolean) from public, anon;
revoke all on function public.chama_dupla_encerrar(uuid) from public, anon;
revoke all on function public.chama_dupla_registrar_hoje() from public, anon;
revoke all on function public.chama_dupla_listar() from public, anon;
revoke all on function public.chama_dupla_aviso_visto(uuid) from public, anon;
grant execute on function public.chama_dupla_convidar(uuid) to authenticated;
grant execute on function public.chama_dupla_responder(uuid, boolean) to authenticated;
grant execute on function public.chama_dupla_encerrar(uuid) to authenticated;
grant execute on function public.chama_dupla_registrar_hoje() to authenticated;
grant execute on function public.chama_dupla_listar() to authenticated;
grant execute on function public.chama_dupla_aviso_visto(uuid) to authenticated;

commit;
