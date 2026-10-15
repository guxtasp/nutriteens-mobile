-- XP gravado só pelo servidor (RF053) + extrato de pontos (RF054).
-- Idempotente (pode rodar mais de uma vez). Rode no SQL Editor do Supabase.
--
-- ORDEM DE DEPLOY (importante):
--   1. Rode ESTE arquivo.            -> app antigo continua funcionando (ainda escreve em xp_usuario)
--   2. Publique a versão nova do app -> passa a chamar conceder_xp()
--   3. Quando a versão antiga sair de uso, rode migration_xp_servidor_bloqueio.sql
--      (tira do app a permissão de escrever em xp_usuario). Só ali o risco fecha de verdade.
--
-- ATENÇÃO: as tabelas base (xp_usuario, licoes, modulos_trilha, trilhas, progresso_licao,
-- missoes_diarias, missoes_catalogo, profiles) não têm migration no repositório; os nomes de
-- coluna abaixo foram lidos do código do app. Teste primeiro em um projeto de homologação.

-- ============================================================
-- 1. EXTRATO: um lançamento por ganho de XP
-- ============================================================
create table if not exists public.xp_lancamentos (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.profiles(id) on delete cascade,
  origem      text not null check (origem in (
    'licao', 'bonus_modulo', 'bonus_trilha', 'missao_diaria', 'missao_periodica',
    'marco_sequencia', 'saldo_anterior')),
  referencia  text not null,        -- id da lição/módulo/trilha/missão, data do marco etc.
  quantidade  integer not null check (quantidade > 0),
  descricao   text,                 -- texto pronto para o extrato (ex.: título da lição)
  criado_em   timestamptz not null default now(),
  -- o mesmo ganho nunca entra duas vezes (duplo toque, reabrir tela, outro aparelho)
  unique (usuario_id, origem, referencia)
);

create index if not exists xp_lancamentos_usuario_data_idx
  on public.xp_lancamentos (usuario_id, criado_em desc);

alter table public.xp_lancamentos enable row level security;
drop policy if exists "xp_lancamentos_leitura" on public.xp_lancamentos;
create policy "xp_lancamentos_leitura" on public.xp_lancamentos
  for select to authenticated using (usuario_id = auth.uid());
-- Sem policy de INSERT/UPDATE/DELETE: só a função conceder_xp() (security definer) escreve aqui.
revoke insert, update, delete on public.xp_lancamentos from anon, authenticated;

-- Quem já tinha XP antes do extrato entra com UMA linha de saldo anterior,
-- para o extrato fechar com o total mostrado no perfil.
insert into public.xp_lancamentos (usuario_id, origem, referencia, quantidade, descricao)
select x.usuario_id, 'saldo_anterior', 'inicial', x.xp_total, 'Pontos acumulados antes do extrato'
from public.xp_usuario x
where x.xp_total > 0
  and exists (select 1 from public.profiles p where p.id = x.usuario_id)
on conflict (usuario_id, origem, referencia) do nothing;

-- ============================================================
-- 2. CONCESSÃO: o servidor valida a ação e decide o valor
-- ============================================================
-- O app só diz QUAL ação (origem + referência). Quanto vale vem sempre do banco
-- (catálogo / lição / módulo / trilha), nunca de um número enviado pelo app.
--
--   origem            referencia                       o que o servidor confere
--   licao             id da lição                      lição está em progresso_licao do usuário
--   bonus_modulo      id do módulo                     todas as lições do módulo concluídas
--   bonus_trilha      id da trilha                     todas as lições da trilha concluídas
--   missao_diaria     id de missoes_diarias            é do usuário e de hoje (±1 dia)
--   missao_periodica  '<codigo>|<AAAA-MM-DD>'          período é o atual (semana/mês corrente)
--   marco_sequencia   'AAAA-MM-DD' (hoje)              sequência atual do perfil é um marco
--
-- Retorna o XP concedido agora (0 se já tinha sido concedido antes).
-- Lança exceção se a ação não for válida.
create or replace function public.conceder_xp(p_origem text, p_referencia text)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_uid        uuid := auth.uid();
  v_hoje       date := (now() at time zone 'America/Sao_Paulo')::date;
  v_qtd        integer;
  v_desc       text;
  v_id         uuid;
  v_lancado    uuid;
  v_data       date;
  v_codigo     text;
  v_periodo    date;
  v_tipo       text;
  v_seq        integer;
  v_pendentes  integer;
begin
  if v_uid is null then
    raise exception 'xp_nao_autenticado' using errcode = '28000';
  end if;
  if p_origem is null or p_referencia is null then
    raise exception 'xp_parametros_invalidos' using errcode = '22023';
  end if;

  -- já concedido? (resposta rápida; a garantia real é a chave única no insert abaixo)
  if exists (select 1 from xp_lancamentos
             where usuario_id = v_uid and origem = p_origem and referencia = p_referencia) then
    return 0;
  end if;

  if p_origem = 'licao' then
    v_id := p_referencia::uuid;
    -- janela de 1 dia: o app concede logo depois de gravar o progresso; lições antigas
    -- (já pagas pelo app anterior, sem lançamento) não podem ser "re-resgatadas"
    if not exists (select 1 from progresso_licao
                   where usuario_id = v_uid and licao_id = v_id
                     and concluida_em >= now() - interval '1 day') then
      raise exception 'xp_licao_nao_concluida' using errcode = 'P0001';
    end if;
    select coalesce(l.xp_recompensa, 0), l.titulo into v_qtd, v_desc from licoes l where l.id = v_id;
    if not found then raise exception 'xp_licao_inexistente' using errcode = 'P0001'; end if;

  elsif p_origem = 'bonus_modulo' then
    v_id := p_referencia::uuid;
    select coalesce(m.xp_bonus, 100), 'Módulo concluído: ' || m.titulo
      into v_qtd, v_desc from modulos_trilha m where m.id = v_id;
    if not found then raise exception 'xp_modulo_inexistente' using errcode = 'P0001'; end if;
    select count(*) into v_pendentes from licoes l
      where l.modulo_id = v_id
        and not exists (select 1 from progresso_licao p where p.licao_id = l.id and p.usuario_id = v_uid);
    if v_pendentes > 0 or not exists (select 1 from licoes where modulo_id = v_id) then
      raise exception 'xp_modulo_incompleto' using errcode = 'P0001';
    end if;
    -- só vale se o módulo fechou agora (bônus antigos já foram pagos pelo app anterior)
    if not exists (select 1 from progresso_licao p join licoes l on l.id = p.licao_id
                   where l.modulo_id = v_id and p.usuario_id = v_uid
                     and p.concluida_em >= now() - interval '1 day') then
      raise exception 'xp_modulo_incompleto' using errcode = 'P0001';
    end if;

  elsif p_origem = 'bonus_trilha' then
    v_id := p_referencia::uuid;
    select coalesce(t.xp_bonus, 125), 'Trilha concluída: ' || t.titulo
      into v_qtd, v_desc from trilhas t where t.id = v_id;
    if not found then raise exception 'xp_trilha_inexistente' using errcode = 'P0001'; end if;
    select count(*) into v_pendentes from licoes l
      join modulos_trilha m on m.id = l.modulo_id
      where m.trilha_id = v_id
        and not exists (select 1 from progresso_licao p where p.licao_id = l.id and p.usuario_id = v_uid);
    if v_pendentes > 0 or not exists (
         select 1 from licoes l join modulos_trilha m on m.id = l.modulo_id where m.trilha_id = v_id) then
      raise exception 'xp_trilha_incompleta' using errcode = 'P0001';
    end if;
    if not exists (select 1 from progresso_licao p
                   join licoes l on l.id = p.licao_id
                   join modulos_trilha m on m.id = l.modulo_id
                   where m.trilha_id = v_id and p.usuario_id = v_uid
                     and p.concluida_em >= now() - interval '1 day') then
      raise exception 'xp_trilha_incompleta' using errcode = 'P0001';
    end if;

  elsif p_origem = 'missao_diaria' then
    v_id := p_referencia::uuid;
    select d.data, c.pontos_recompensa, 'Missão do dia: ' || c.titulo
      into v_data, v_qtd, v_desc
      from missoes_diarias d join missoes_catalogo c on c.id = d.missao_id
      where d.id = v_id and d.user_id = v_uid;
    if not found then raise exception 'xp_missao_inexistente' using errcode = 'P0001'; end if;
    if v_data < v_hoje - 1 or v_data > v_hoje + 1 then
      raise exception 'xp_missao_fora_do_prazo' using errcode = 'P0001';
    end if;
    -- mantém o flag que o resto do app (histórico, insígnias, painel) já lê. Se o flag já
    -- estava ligado (app antigo já pagou), não paga de novo.
    update missoes_diarias set xp_concedido = true
      where id = v_id and user_id = v_uid and xp_concedido = false
      returning id into v_lancado;
    if v_lancado is null then return 0; end if;
    v_lancado := null;

  elsif p_origem = 'missao_periodica' then
    v_codigo  := split_part(p_referencia, '|', 1);
    v_periodo := nullif(split_part(p_referencia, '|', 2), '')::date;
    select c.pontos_recompensa, c.periodo, 'Missão ' || lower(c.periodo) || ': ' || c.titulo
      into v_qtd, v_tipo, v_desc
      from missoes_periodicas_catalogo c where c.codigo = v_codigo and c.ativa;
    if not found or v_periodo is null then
      raise exception 'xp_missao_inexistente' using errcode = 'P0001';
    end if;
    -- só o período corrente (semana começa na segunda; mês no dia 1)
    if v_periodo <> case v_tipo when 'SEMANAL' then date_trunc('week', v_hoje)::date
                                else date_trunc('month', v_hoje)::date end then
      raise exception 'xp_periodo_invalido' using errcode = 'P0001';
    end if;
    insert into missoes_periodicas_resgates (user_id, codigo, periodo_inicio, pontos)
    values (v_uid, v_codigo, v_periodo, v_qtd)
    on conflict (user_id, codigo, periodo_inicio) do nothing
    returning id into v_lancado;
    -- resgate já existia (app antigo já pagou): nada a conceder
    if v_lancado is null then return 0; end if;
    v_lancado := null;

  elsif p_origem = 'marco_sequencia' then
    v_data := p_referencia::date;
    if v_data < v_hoje - 1 or v_data > v_hoje + 1 then
      raise exception 'xp_data_invalida' using errcode = 'P0001';
    end if;
    select coalesce(sequencia_atual, 0) into v_seq from profiles where id = v_uid;
    -- mesmos marcos de celebracaoSequencia.ts
    v_qtd := case v_seq when 3 then 5 when 7 then 10 when 14 then 20
                        when 30 then 50 when 60 then 100 when 100 then 200 else 0 end;
    if v_qtd = 0 then return 0; end if;     -- não é dia de marco: nada a conceder
    v_desc := 'Sequência de ' || v_seq || ' dias';

  else
    raise exception 'xp_origem_invalida' using errcode = '22023';
  end if;

  if coalesce(v_qtd, 0) <= 0 then return 0; end if;

  -- quem "ganha a corrida" deste insert é o único que soma o XP
  insert into xp_lancamentos (usuario_id, origem, referencia, quantidade, descricao)
  values (v_uid, p_origem, p_referencia, v_qtd, v_desc)
  on conflict (usuario_id, origem, referencia) do nothing
  returning id into v_lancado;
  if v_lancado is null then return 0; end if;

  insert into xp_usuario (usuario_id, xp_total) values (v_uid, v_qtd)
  on conflict (usuario_id) do update set xp_total = xp_usuario.xp_total + excluded.xp_total;

  return v_qtd;
end $$;

revoke all on function public.conceder_xp(text, text) from public, anon;
grant execute on function public.conceder_xp(text, text) to authenticated;
