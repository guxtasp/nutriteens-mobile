-- migration_xp_rebrand.sql — duas origens novas de XP para o rebranding (HANDOFF_REBRAND, fases 3 e 4).
-- Idempotente. Rodar DEPOIS de migration_xp_servidor.sql e de migration_trocas_avaliacao.sql
-- (a regra de 'troca_avaliada' lê as respostas novas de troca_respostas).
--
--   origem            referencia              o que o servidor confere
--   troca_avaliada    id da troca             guardou a troca (TENTAR) e contou como foi (CURTI/MEIO/
--                                             NAO_ROLOU/NAO_TENHO) nas últimas 24 h; 10 XP, 1x por troca
--   teste_nutriente   chave do nutriente      chave existe na lista de 13; 10 XP, 1x por nutriente
--
-- O resto de conceder_xp() é cópia EXATA de migration_xp_servidor.sql (é a única definição dela no
-- repositório). Se alguém alterou a função direto no banco, compare antes de rodar:
--   select pg_get_functiondef('public.conceder_xp(text,text)'::regprocedure);
--
-- Risco aceito: 'teste_nutriente' não tem como provar que o teste foi feito (as respostas ficam
-- no aparelho). O teto é 13 × 10 XP por pessoa, e a tela do teste está atrás de uma constante.
begin;

-- origens aceitas no extrato (recria a lista COMPLETA)
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.xp_lancamentos'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%marco_sequencia%' loop
    execute format('alter table public.xp_lancamentos drop constraint %I', c.conname);
  end loop;
  alter table public.xp_lancamentos add constraint xp_lancamentos_origem_check check (origem in (
    'licao', 'bonus_modulo', 'bonus_trilha', 'missao_diaria', 'missao_periodica',
    'marco_sequencia', 'saldo_anterior', 'troca_avaliada', 'teste_nutriente'));
end $$;

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
    -- só o período corrente (semana começa na segunda; mês no dia 1).
    -- O CASE fica entre parênteses: sem eles, o IF do PL/pgSQL para no primeiro THEN (o do CASE).
    if v_periodo <> (case v_tipo when 'SEMANAL' then date_trunc('week', v_hoje)::date
                                 else date_trunc('month', v_hoje)::date end) then
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

  elsif p_origem = 'troca_avaliada' then
    -- "Testei?" das trocas: vale o mesmo para qualquer resposta, 1x por troca (a chave única
    -- do extrato garante). Só se a pessoa guardou a troca ANTES e contou como foi há pouco.
    v_id := p_referencia::uuid;
    if not exists (select 1 from troca_respostas a
                    where a.user_id = v_uid and a.troca_id = v_id
                      and a.resposta in ('CURTI','MEIO','NAO_ROLOU','NAO_TENHO')
                      and a.criado_em >= now() - interval '1 day'
                      and exists (select 1 from troca_respostas g
                                   where g.user_id = v_uid and g.troca_id = v_id
                                     and g.resposta = 'TENTAR' and g.criado_em < a.criado_em)) then
      raise exception 'xp_troca_nao_avaliada' using errcode = 'P0001';
    end if;
    v_qtd := 10;
    select 'Contou como foi: ' || d.nome into v_desc
      from alimento_trocas t join alimentos d on d.id = t.destino_id where t.id = v_id;
    v_desc := coalesce(v_desc, 'Contou como foi uma troca');

  elsif p_origem = 'teste_nutriente' then
    -- teste rápido de vitaminas e minerais: 1x por nutriente, qualquer resultado (sem nota)
    if p_referencia not in ('vitamina_a','vitamina_c','vitamina_d','tiamina','riboflavina','niacina',
                            'piridoxina','calcio','ferro','magnesio','fosforo','potassio','zinco') then
      raise exception 'xp_nutriente_invalido' using errcode = 'P0001';
    end if;
    v_qtd := 10;
    v_desc := 'Teste rápido de vitaminas e minerais';

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

commit;
