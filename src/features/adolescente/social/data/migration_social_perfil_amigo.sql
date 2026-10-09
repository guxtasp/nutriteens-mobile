-- MIGRAÇÃO: PERFIL DO AMIGO
-- Rode DEPOIS de migration_social_amizades.sql, no SQL Editor do Supabase.
-- É idempotente: pode rodar de novo sem erro.
--
-- O que um amigo vê no perfil do outro (e SÓ isso):
--   apelido, avatar, "amigos desde", XP total (a fase do Broxis sai do XP no app),
--   sequência atual e maior sequência, nº de lições concluídas e as insígnias,
--   marcos e conquistas JÁ GANHAS (as bloqueadas nunca vão para o app do amigo).
-- Nome real, escola, nascimento, gênero, peso/altura, EBIA, refeições, água,
-- atividade física e codigo_participante nunca saem desta função.
--
-- Mesmo princípio do resto do social: tabelas fechadas, tudo por função
-- SECURITY DEFINER filtrando por auth.uid(). Quem não é amigo aceito (pedido
-- pendente, recusado, inexistente, bloqueado) recebe ZERO linhas, igual a
-- "amizade não existe", sem revelar o motivo.

begin;

create or replace function public.social_perfil_amigo(p_amizade_id uuid)
returns table (
  apelido text,
  avatar text,
  desde timestamptz,
  xp_total integer,
  sequencia_atual integer,
  maior_sequencia integer,
  licoes_concluidas integer,
  insignias jsonb
)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_am public.amizades%rowtype;
  v_amigo uuid;
  -- "hoje" no fuso do Brasil: a sequência só vale se foi mantida hoje ou ontem
  v_hoje date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if v_uid is null then raise exception 'Não autenticado.' using errcode = '28000'; end if;

  select a.* into v_am
  from public.amizades a
  where a.id = p_amizade_id
    and a.status = 'aceita'
    and (a.solicitante_id = v_uid or a.destinatario_id = v_uid);
  if not found then return; end if;

  v_amigo := case when v_am.solicitante_id = v_uid then v_am.destinatario_id else v_am.solicitante_id end;
  if public._social_bloqueado(v_uid, v_amigo) then return; end if;

  return query
    select
      p.apelido,
      p.avatar_social,
      v_am.respondido_em,
      coalesce((select x.xp_total from public.xp_usuario x where x.usuario_id = p.id), 0),
      -- profiles.sequencia_atual só é atualizada quando a própria pessoa abre o app;
      -- se ela já deixou passar um dia, a sequência real é 0
      case when p.ultimo_dia_mantido is not null and p.ultimo_dia_mantido >= v_hoje - 1
           then p.sequencia_atual else 0 end,
      p.maior_sequencia,
      (select count(distinct pl.licao_id)::int from public.progresso_licao pl where pl.usuario_id = p.id),
      coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', i.id,
                 'codigo', i.codigo,
                 'categoria', i.categoria,
                 'valor', i.criterio -> 'min',
                 'nome', i.nome,
                 'descricao', i.descricao,
                 'icone', i.icone
               ) order by i.ordem, iu.obtida_em)
        from public.insignias_usuario iu
        join public.insignias i on i.id = iu.insignia_id and i.ativa
        where iu.usuario_id = p.id
      ), '[]'::jsonb)
    from public.profiles p
    where p.id = v_amigo;
end $$;

revoke all on function public.social_perfil_amigo(uuid) from public, anon;
grant execute on function public.social_perfil_amigo(uuid) to authenticated;

commit;
