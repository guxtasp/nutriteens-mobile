-- migration_exclusao_conta.sql — "Apagar meus dados" (HANDOFF_REBRAND, fase 5; LGPD art. 18, VI).
-- Idempotente. Rodar ANTES de publicar a Edge Function excluir-conta. Depende de public.papel_atual()
-- e da tabela public.consentimentos (migration_consentimentos_reaceite.sql).
--
-- Quem apaga é a Edge Function supabase/functions/excluir-conta, com a service_role (que nunca entra
-- no app). Ela chama as duas funções abaixo e depois auth.admin.deleteUser(). O app só invoca a função.
--
-- CASCATA (conferida nos .sql do repositório; profiles e as tabelas do núcleo — refeições, água,
-- atividade, progresso_licao, missoes_diarias, xp_usuario, consentimentos, respostas da triagem —
-- foram criadas no painel e NÃO estão aqui, por isso a função não confia só na cascata):
--   on delete cascade  -> eventos_app, cartas_usuario, xp_lancamentos, scanner_solicitacao_pedidos,
--                         amizades, chamas_dupla, receitas_compartilhadas, codigos_amizade, bloqueios,
--                         denuncias_sociais (denunciante/denunciado), tentativas_codigo, cartinhas,
--                         cartinhas_preferencias, desafio_grupo_membros, desafio_grupo_dias,
--                         desafio_trofeus, feed_eventos, feed_reacoes, jardim_membros, troca_respostas
--   on delete set null -> desafios_grupo.criado_por/convidado_por, jardins.criado_por/convidado_por,
--                         denuncias_sociais.resolvido_por
--   SEM ação (bloqueava o delete) -> missoes_periodicas_resgates.user_id; e colunas da equipe
--                         (scanner resolvido_por, alimento_trocas.criado_por, conteudo_fluxo.*_por,
--                         conteudo_auditoria.ator_id, trilha_revisoes.revisor_id) que nunca apontam
--                         para um adolescente.
--   SEM FK, de propósito, sobrevive -> acessos_dados_log (leitor_id, participante_id): é a prova de
--                         quem leu dados de quem; exportacoes_log.usuario_id (é da equipe).
--
-- Para conferir no seu banco o que aponta para profiles/auth.users e com que regra:
--   select conrelid::regclass as tabela, conname, confrelid::regclass as alvo,
--          case confdeltype when 'c' then 'cascade' when 'n' then 'set null'
--               when 'a' then 'no action' when 'r' then 'restrict' else confdeltype::text end as regra
--     from pg_constraint
--    where contype = 'f' and confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)
--    order by 4, 1;
begin;

-- 1. registro mínimo de que o pedido foi atendido: SEM nome, e-mail ou id (não dá para ligar a ninguém).
--    A data é só o dia (sem hora) para não permitir cruzar com outros logs.
create table if not exists public.exclusoes_conta_log (
  codigo        text primary key,
  excluida_em   date not null default ((now() at time zone 'America/Sao_Paulo')::date),
  versao_termo  text
);

alter table public.exclusoes_conta_log enable row level security;
-- sem policy de propósito: authenticated não lê nem escreve; só a função (service_role) grava
-- e o Administrador lê pela RPC listar_exclusoes_conta.
revoke all on public.exclusoes_conta_log from public, anon, authenticated;

-- 2. apaga os dados do usuário (chamada só pela Edge Function, com service_role). Tudo numa transação:
--    ou apaga tudo, ou nada. Devolve o código curto do registro.
create or replace function public.excluir_conta_dados(p_usuario uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  r         record;
  v_versao  text;
  v_codigo  text;
  v_nullable boolean;
begin
  if p_usuario is null then
    raise exception 'exclusao_parametro_invalido' using errcode = '22023';
  end if;
  if not exists (select 1 from profiles where id = p_usuario and papel = 'ADOLESCENTE') then
    raise exception 'exclusao_nao_permitida' using errcode = 'P0001';
  end if;

  -- versão dos termos que a pessoa tinha aceitado por último (antes de apagar os consentimentos)
  select c.versao_termo into v_versao
    from consentimentos c
   where c.user_id = p_usuario and c.versao_termo ~ '^[0-9]+(\.[0-9]+)*$'
   order by string_to_array(c.versao_termo, '.')::int[] desc
   limit 1;

  -- 2a. FKs para profiles/auth.users SEM cascata (no action/restrict) bloqueariam o delete.
  --     Coluna que aceita nulo: vira null (referência solta, ex.: "resolvido por").
  --     Coluna obrigatória: a linha é da pessoa, então é apagada (ex.: missoes_periodicas_resgates).
  for r in
    select c.conrelid::regclass as tabela, a.attname as coluna, a.attnotnull as obrigatoria
      from pg_constraint c
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f'
       and c.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)
       and c.confdeltype in ('a', 'r')
       and array_length(c.conkey, 1) = 1
  loop
    if r.obrigatoria then
      execute format('delete from %s where %I = $1', r.tabela, r.coluna) using p_usuario;
    else
      execute format('update %s set %I = null where %I = $1', r.tabela, r.coluna, r.coluna) using p_usuario;
    end if;
  end loop;

  -- 2b. o perfil: a cascata leva o resto (lista no topo deste arquivo)
  delete from profiles where id = p_usuario;

  -- 2c. varredura: tabelas do núcleo que tenham user_id/usuario_id SEM FK não seriam pegas pela
  --     cascata. Os logs de auditoria ficam de fora de propósito.
  for r in
    select format('%I.%I', c.table_schema, c.table_name) as tabela, c.column_name as coluna
      from information_schema.columns c
      join information_schema.tables t
        on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
     where c.table_schema = 'public'
       and c.column_name in ('user_id', 'usuario_id')
       and c.data_type = 'uuid'
       and c.table_name not in ('acessos_dados_log', 'exportacoes_log', 'exclusoes_conta_log')
  loop
    execute format('delete from %s where %I = $1', r.tabela, r.coluna) using p_usuario;
  end loop;

  -- 3. registro: código aleatório curto (8 caracteres), só data e versão
  loop
    v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    begin
      insert into exclusoes_conta_log (codigo, versao_termo) values (v_codigo, v_versao);
      exit;
    exception when unique_violation then
      -- colisão (raríssima): sorteia de novo
    end;
  end loop;

  return v_codigo;
end $$;

revoke all on function public.excluir_conta_dados(uuid) from public, anon, authenticated;
grant execute on function public.excluir_conta_dados(uuid) to service_role;

-- 4. arquivos que a pessoa enviou ao Storage (hoje adolescentes não enviam nenhum: scanner, receitas
--    e jogos são só da equipe). Fica para não deixar sobra se isso mudar. A remoção é feita pela
--    Edge Function pela API do Storage (o Supabase não deixa apagar de storage.objects por SQL).
create or replace function public.excluir_conta_arquivos(p_usuario uuid)
returns table (bucket text, caminho text)
language sql security definer set search_path = public, storage as $$
  select o.bucket_id::text, o.name::text from storage.objects o where o.owner = p_usuario;
$$;

revoke all on function public.excluir_conta_arquivos(uuid) from public, anon, authenticated;
grant execute on function public.excluir_conta_arquivos(uuid) to service_role;

-- 5. leitura do registro: só o Administrador (painel; a tela ainda não existe)
create or replace function public.listar_exclusoes_conta()
returns table (codigo text, excluida_em date, versao_termo text)
language plpgsql security definer set search_path = public as $$
begin
  if public.papel_atual() is distinct from 'ADMINISTRADOR' then
    raise exception 'acesso_negado' using errcode = '42501';
  end if;
  return query select e.codigo, e.excluida_em, e.versao_termo
                 from exclusoes_conta_log e order by e.excluida_em desc, e.codigo;
end $$;

revoke all on function public.listar_exclusoes_conta() from public, anon;
grant execute on function public.listar_exclusoes_conta() to authenticated;

commit;
