-- migration_trocas_avaliacao.sql — "Testei?" das trocas (HANDOFF_REBRAND, fase 3).
-- Idempotente. Rodar DEPOIS de migration_trocas.sql, migration_trocas_categorias.sql e
-- migration_trocas_justificativas.sql (esta recria trocas_listar a partir da versão de lá).
-- Depois desta, rodar src/features/adolescente/perfil/data/migration_xp_rebrand.sql (XP do "Testei?").
--
--  1. troca_respostas.resposta aceita as avaliações: CURTI, MEIO, NAO_ROLOU (NAO_TENHO já existia).
--  2. trocas_listar() devolve dois desempates novos e usa o "não tinha em casa" como acessibilidade:
--       curtida_recente   -> curtiu (60 dias) uma troca com o mesmo destino ou da mesma categoria
--       nao_rolou_recente -> disse "não rolou" para ESTA troca nos últimos 30 dias
--       destino_acessivel -> além da EBIA, fica falso se disse "não tinha em casa" para o mesmo
--                            destino nos últimos 30 dias (ordena, nunca exclui)
--  3. trocas_avaliacao_resumo(): contagens AGREGADAS por troca para a nutricionista revisar o
--     conteúdo (quantas pessoas guardaram, curtiram etc.). Nenhum id de pessoa sai do banco.
begin;

-- 1. Valores aceitos (acha a constraint pelo conteúdo: o nome pode variar entre bancos) ----------
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.troca_respostas'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%TENTAR%' loop
    execute format('alter table public.troca_respostas drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.troca_respostas add constraint troca_respostas_resposta_check
  check (resposta in ('TENTAR','NAO_TENHO','CURTI','MEIO','NAO_ROLOU'));

create index if not exists troca_respostas_troca_idx on public.troca_respostas (troca_id, resposta);

-- 2. RPC do adolescente (muda o tipo de retorno, então precisa recriar) --------------------------
drop function if exists public.trocas_listar(text);
create function public.trocas_listar(p_categoria text default null)
returns table (
  id uuid, categoria text, origem_id uuid, origem_nome text,
  destino_id uuid, destino_nome text, tipos_refeicao text[],
  frase text, rapida boolean, ordem integer,
  destino_acessivel boolean, destino_recente boolean, respondida_recente boolean,
  dica text, destino_nutrientes text[],
  curtida_recente boolean, nao_rolou_recente boolean
) language sql stable security definer set search_path = public as $$
  with eu as (
    select public._ebia_rank(p.classificacao_ebia_atual::text) as rank_ebia
    from public.profiles p where p.id = auth.uid()
  ),
  recentes as (   -- destinos que o aluno registrou nos últimos 30 dias
    select distinct ra.alimento_id
    from public.registros_diarios rd
    join public.refeicoes r on r.registro_diario_id = rd.id
    join public.refeicao_alimentos ra on ra.refeicao_id = r.id
    where rd.user_id = auth.uid() and rd.data >= (now() at time zone 'America/Sao_Paulo')::date - 30
  ),
  minhas as (     -- respostas do próprio aluno, com destino e categoria da troca
    select tr.troca_id, tr.resposta, tr.criado_em, x.destino_id, x.categoria
    from public.troca_respostas tr
    join public.alimento_trocas x on x.id = tr.troca_id
    where tr.user_id = auth.uid() and tr.criado_em > now() - interval '60 days'
  )
  select t.id, t.categoria, t.origem_id, o.nome, t.destino_id, d.nome,
         t.tipos_refeicao::text[], t.frase, t.rapida, t.ordem,
         coalesce((select rank_ebia from eu) is null
                  or public._ebia_rank(d.nivel_maximo_ebia::text) >= (select rank_ebia from eu), true)
           and not exists (select 1 from minhas m
                            where m.resposta = 'NAO_TENHO' and m.destino_id = t.destino_id
                              and m.criado_em > now() - interval '30 days'),
         d.id in (select alimento_id from recentes),
         exists (select 1 from public.troca_respostas tr
                 where tr.user_id = auth.uid() and tr.troca_id = t.id
                   and tr.criado_em > now() - interval '3 days'),
         t.dica,
         coalesce((
           select array_agg(e.key order by e.key)
           from public.alimento_nutrientes n, jsonb_each_text(to_jsonb(n)) e
           where n.alimento_id = d.id
             and e.key in ('proteina','fibra','calcio','ferro','zinco','magnesio','vitamina_a','vitamina_c','vitamina_d')
             and e.value in ('FONTE','ALTO_TEOR')
         ), '{}'::text[]),
         exists (select 1 from minhas m
                  where m.resposta = 'CURTI' and (m.destino_id = t.destino_id or m.categoria = t.categoria)),
         exists (select 1 from minhas m
                  where m.resposta = 'NAO_ROLOU' and m.troca_id = t.id
                    and m.criado_em > now() - interval '30 days')
  from public.alimento_trocas t
  join public.conteudo_fluxo f on f.tipo = 'TROCA' and f.conteudo_id = t.id and f.status = 'PUBLICADO'
  join public.alimentos d on d.id = t.destino_id
  left join public.alimentos o on o.id = t.origem_id
  where auth.uid() is not null and (p_categoria is null or t.categoria = p_categoria)
$$;
revoke all on function public.trocas_listar(text) from public, anon;
grant execute on function public.trocas_listar(text) to authenticated;

-- 3. Resumo para revisão de conteúdo (nutricionista e administração) -----------------------------
-- Conta PESSOAS distintas por troca. A taxa só aparece no app com 5 ou mais pessoas.
create or replace function public.trocas_avaliacao_resumo(p_categoria text default null)
returns table (
  troca_id uuid, categoria text,
  guardaram bigint, curti bigint, meio bigint, nao_rolou bigint, nao_tenho bigint
) language plpgsql stable security definer set search_path = public as $$
begin
  if coalesce(public.papel_atual()::text, '') not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'acesso negado' using errcode = '42501';
  end if;
  return query
  select t.id, t.categoria,
         count(distinct r.user_id) filter (where r.resposta = 'TENTAR'),
         count(distinct r.user_id) filter (where r.resposta = 'CURTI'),
         count(distinct r.user_id) filter (where r.resposta = 'MEIO'),
         count(distinct r.user_id) filter (where r.resposta = 'NAO_ROLOU'),
         -- "não tinha em casa" só conta como avaliação quando veio depois de guardar
         count(distinct r.user_id) filter (where r.resposta = 'NAO_TENHO' and exists (
           select 1 from public.troca_respostas g
            where g.user_id = r.user_id and g.troca_id = r.troca_id
              and g.resposta = 'TENTAR' and g.criado_em < r.criado_em))
  from public.alimento_trocas t
  left join public.troca_respostas r on r.troca_id = t.id
  where p_categoria is null or t.categoria = p_categoria
  group by t.id, t.categoria;
end;
$$;
revoke all on function public.trocas_avaliacao_resumo(text) from public, anon;
grant execute on function public.trocas_avaliacao_resumo(text) to authenticated;

commit;
