-- src/features/adolescente/social/data/migration_amizades.sql
--
-- Amizades (RF046, RF061, RF062, RF064, RF065). Rodar uma vez no SQL Editor
-- do Supabase.
--
-- Decisões de desenho:
--  * UMA linha por par de pessoas (índice único em least/greatest), seja qual
--    for quem convidou. Impede pedido duplicado e pedido cruzado.
--  * status só tem 'pendente' e 'aceita'. Recusar, cancelar pedido e desfazer
--    amizade = apagar a linha (RF064). Não existe "recusada": ninguém vê que
--    foi recusado.
--  * O app NUNCA escreve na tabela direto. Toda escrita passa pelas funções
--    abaixo (security definer), que aplicam as regras. Sem policy de
--    insert/update/delete = o cliente não consegue burlar.
--  * Amizade só nasce com consentimento mútuo (RF061): quem convida cria
--    'pendente'; só o destinatário aceita.
--  * As funções devolvem só id + PRIMEIRO nome. Nenhuma métrica do outro
--    (pontos, sequência, mascote) passa por aqui (RF062), e a quantidade de
--    amigos não dá vantagem em nada (RF065).
--  * Só papel ADOLESCENTE participa.

create table if not exists public.amizades (
  id uuid primary key default gen_random_uuid(),
  solicitante_id uuid not null references public.profiles(id) on delete cascade,
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'aceita')),
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  constraint amizades_nao_consigo_mesmo check (solicitante_id <> destinatario_id)
);

create unique index if not exists amizades_par_unico
  on public.amizades (least(solicitante_id, destinatario_id), greatest(solicitante_id, destinatario_id));

create index if not exists amizades_destinatario_idx on public.amizades (destinatario_id);
create index if not exists amizades_solicitante_idx on public.amizades (solicitante_id);

alter table public.amizades enable row level security;

-- cada pessoa só enxerga as linhas em que participa
drop policy if exists amizades_select_proprias on public.amizades;
create policy amizades_select_proprias on public.amizades
  for select to authenticated
  using (auth.uid() in (solicitante_id, destinatario_id));

-- sem policy de escrita de propósito; reforça tirando o privilégio
revoke insert, update, delete on public.amizades from anon, authenticated;
revoke all on public.amizades from anon;

-- ---------------------------------------------------------------------
-- helper: o usuário é adolescente?
-- ---------------------------------------------------------------------
create or replace function public._amizade_eh_adolescente(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = p_id and papel::text = 'ADOLESCENTE');
$$;

-- ---------------------------------------------------------------------
-- buscar_perfil_por_codigo: acha alguém pelo código (NT-000001) e diz a
-- relação atual. Só devolve id + primeiro nome.
-- relacao: nenhuma | enviado | recebido | amigos
-- ---------------------------------------------------------------------
create or replace function public.buscar_perfil_por_codigo(p_codigo text)
returns table (id uuid, nome text, relacao text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_eu uuid := auth.uid();
  v_outro_id uuid;
  v_outro_nome text;
  v_am public.amizades;
begin
  if v_eu is null or not public._amizade_eh_adolescente(v_eu) then
    return;
  end if;

  select p.id, split_part(trim(p.nome), ' ', 1)
    into v_outro_id, v_outro_nome
  from public.profiles p
  where upper(p.codigo_participante) = upper(trim(p_codigo))
    and p.papel::text = 'ADOLESCENTE'
    and p.id <> v_eu;

  if v_outro_id is null then
    return; -- código inexistente, de outro papel ou o próprio: resposta igual
  end if;

  select a.* into v_am
  from public.amizades a
  where least(a.solicitante_id, a.destinatario_id) = least(v_eu, v_outro_id)
    and greatest(a.solicitante_id, a.destinatario_id) = greatest(v_eu, v_outro_id);

  id := v_outro_id;
  nome := v_outro_nome;
  relacao := case
    when v_am.id is null then 'nenhuma'
    when v_am.status = 'aceita' then 'amigos'
    when v_am.solicitante_id = v_eu then 'enviado'
    else 'recebido'
  end;
  return next;
end;
$$;

-- ---------------------------------------------------------------------
-- enviar_pedido_amizade: resultado em texto (o app traduz em mensagem).
--   enviado | aceito_automaticamente | ja_amigos | ja_enviado |
--   limite_pedidos | codigo_invalido
-- Se a outra pessoa JÁ tinha convidado você, o pedido cruzado vira amizade.
-- ---------------------------------------------------------------------
create or replace function public.enviar_pedido_amizade(p_codigo text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eu uuid := auth.uid();
  v_outro uuid;
  v_am public.amizades;
  v_pendentes_enviados integer;
  c_limite_pedidos constant integer := 20;
begin
  if v_eu is null or not public._amizade_eh_adolescente(v_eu) then
    return 'codigo_invalido';
  end if;

  select p.id into v_outro
  from public.profiles p
  where upper(p.codigo_participante) = upper(trim(p_codigo))
    and p.papel::text = 'ADOLESCENTE'
    and p.id <> v_eu;

  if v_outro is null then
    return 'codigo_invalido';
  end if;

  select a.* into v_am
  from public.amizades a
  where least(a.solicitante_id, a.destinatario_id) = least(v_eu, v_outro)
    and greatest(a.solicitante_id, a.destinatario_id) = greatest(v_eu, v_outro)
  for update;

  if v_am.id is not null then
    if v_am.status = 'aceita' then
      return 'ja_amigos';
    elsif v_am.solicitante_id = v_eu then
      return 'ja_enviado';
    else
      -- a outra pessoa já tinha me convidado: os dois querem, então fecha
      update public.amizades
         set status = 'aceita', respondido_em = now()
       where id = v_am.id;
      return 'aceito_automaticamente';
    end if;
  end if;

  select count(*) into v_pendentes_enviados
  from public.amizades
  where solicitante_id = v_eu and status = 'pendente';

  if v_pendentes_enviados >= c_limite_pedidos then
    return 'limite_pedidos';
  end if;

  begin
    insert into public.amizades (solicitante_id, destinatario_id) values (v_eu, v_outro);
  exception when unique_violation then
    return 'ja_enviado'; -- corrida: dois cliques/dois aparelhos ao mesmo tempo
  end;

  return 'enviado';
end;
$$;

-- ---------------------------------------------------------------------
-- responder_pedido_amizade: só o DESTINATÁRIO de um pedido pendente.
-- aceitar -> vira 'aceita'. recusar -> apaga a linha.
-- ---------------------------------------------------------------------
create or replace function public.responder_pedido_amizade(p_amizade_id uuid, p_aceitar boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eu uuid := auth.uid();
  v_linhas integer;
begin
  if v_eu is null or not public._amizade_eh_adolescente(v_eu) then
    return false;
  end if;

  if p_aceitar then
    update public.amizades
       set status = 'aceita', respondido_em = now()
     where id = p_amizade_id and destinatario_id = v_eu and status = 'pendente';
  else
    delete from public.amizades
     where id = p_amizade_id and destinatario_id = v_eu and status = 'pendente';
  end if;

  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end;
$$;

-- ---------------------------------------------------------------------
-- remover_amizade: qualquer um dos dois lados, a qualquer momento (RF064).
-- Serve para desfazer amizade e para cancelar pedido que você enviou.
-- ---------------------------------------------------------------------
create or replace function public.remover_amizade(p_amizade_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eu uuid := auth.uid();
  v_linhas integer;
begin
  if v_eu is null then
    return false;
  end if;

  delete from public.amizades
   where id = p_amizade_id and v_eu in (solicitante_id, destinatario_id);

  get diagnostics v_linhas = row_count;
  return v_linhas > 0;
end;
$$;

-- ---------------------------------------------------------------------
-- listar_amizades: amigos + pedidos recebidos + pedidos enviados, numa
-- chamada. Só id e primeiro nome do outro lado (RF062).
-- situacao: amigo | recebido | enviado
-- ---------------------------------------------------------------------
create or replace function public.listar_amizades()
returns table (amizade_id uuid, outro_id uuid, nome text, situacao text, desde timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select a.id,
         p.id,
         split_part(trim(p.nome), ' ', 1),
         case
           when a.status = 'aceita' then 'amigo'
           when a.destinatario_id = auth.uid() then 'recebido'
           else 'enviado'
         end,
         coalesce(a.respondido_em, a.criado_em)
  from public.amizades a
  join public.profiles p
    on p.id = case when a.solicitante_id = auth.uid() then a.destinatario_id else a.solicitante_id end
  where auth.uid() in (a.solicitante_id, a.destinatario_id)
    and public._amizade_eh_adolescente(auth.uid())
  order by coalesce(a.respondido_em, a.criado_em) desc;
$$;

-- só usuário logado executa; anônimo não
revoke all on function public._amizade_eh_adolescente(uuid) from public, anon, authenticated;
revoke all on function public.buscar_perfil_por_codigo(text) from public, anon;
revoke all on function public.enviar_pedido_amizade(text) from public, anon;
revoke all on function public.responder_pedido_amizade(uuid, boolean) from public, anon;
revoke all on function public.remover_amizade(uuid) from public, anon;
revoke all on function public.listar_amizades() from public, anon;

grant execute on function public.buscar_perfil_por_codigo(text) to authenticated;
grant execute on function public.enviar_pedido_amizade(text) to authenticated;
grant execute on function public.responder_pedido_amizade(uuid, boolean) to authenticated;
grant execute on function public.remover_amizade(uuid) to authenticated;
grant execute on function public.listar_amizades() to authenticated;
