-- verificar_painel.sql  — SOMENTE LEITURA. Rode no SQL Editor do Supabase.
--
-- Mostra, em uma tabela, o que do painel Admin/Nutricionista está faltando ou
-- fora do lugar no seu banco. Linhas com ok = false vêm primeiro; o texto de
-- "detalhe" diz o que fazer. Não altera nada.

with
rpcs(nome, migration) as (values
  ('papel_atual',                    'migration_revisao_trilhas.sql'),
  ('painel_dashboard',               'migration_painel_dashboard.sql'),
  ('analytics_painel',               'migration_analytics_eventos.sql'),
  ('conteudo_listar',                'migration_fluxo_conteudo.sql'),
  ('conteudo_transicionar',          'migration_fluxo_conteudo.sql'),
  ('conteudo_auditoria_listar',      'migration_fluxo_conteudo.sql'),
  ('conteudo_detalhe',               'migration_permissoes_conteudo.sql'),
  ('conteudo_licao_detalhe',         'migration_permissoes_conteudo.sql'),
  ('painel_usuarios_listar',         'migration_painel_gestao.sql'),
  ('painel_usuario_detalhe',         'migration_painel_gestao.sql'),
  ('painel_nutricionistas_listar',   'migration_painel_gestao.sql'),
  ('painel_moderacao',               'migration_painel_gestao.sql'),
  ('painel_desafios_listar',         'migration_painel_gestao.sql'),
  ('painel_desafio_definir_ativo',   'migration_painel_gestao.sql'),
  ('painel_participantes_listar',    'migration_painel_gestao.sql'),
  ('painel_participante_detalhe',    'migration_painel_gestao.sql'),
  ('painel_trilha_temas',            'migration_painel_gestao.sql'),
  ('substituir_ingredientes_prato',  'migration_funcoes_substituir.sql'),
  ('substituir_passos_receita',      'migration_funcoes_substituir.sql')
),
fn as (
  select r.nome, r.migration, p.oid as oid
    from rpcs r
    left join pg_proc p on p.proname = r.nome and p.pronamespace = 'public'::regnamespace
),
tabelas(nome, migration) as (values
  ('conteudo_fluxo',    'migration_fluxo_conteudo.sql'),
  ('conteudo_auditoria','migration_fluxo_conteudo.sql'),
  ('trilha_revisoes',   'migration_revisao_trilhas.sql'),
  ('eventos_app',       'migration_analytics_eventos.sql')
),
gatilhos(nome, tabela, migration) as (values
  ('trilhas_guarda_aprovacao', 'trilhas',   'migration_revisao_trilhas.sql'),
  ('trilhas_fluxo_criar',      'trilhas',   'migration_fluxo_conteudo.sql'),
  ('receitas_fluxo_criar',     'receitas',  'migration_fluxo_conteudo.sql'),
  ('trilhas_fluxo_remover',    'trilhas',   'migration_fluxo_conteudo.sql'),
  ('receitas_fluxo_remover',   'receitas',  'migration_fluxo_conteudo.sql'),
  ('fluxo_alteracao',          'licoes',    'migration_fluxo_conteudo.sql'),
  ('fluxo_alteracao',          'receita_passos', 'migration_permissoes_conteudo.sql'),
  ('eventos_app_carimbar',     'eventos_app','migration_analytics_eventos.sql')
),
politicas(tabela, nome, migration) as (values
  ('receitas',            'receitas_so_publicadas',            'migration_fluxo_conteudo.sql'),
  ('receita_passos',      'receita_passos_so_publicadas',      'migration_endurece_rls.sql'),
  ('receita_ingredientes','receita_ingredientes_so_publicadas','migration_endurece_rls.sql'),
  ('eventos_app',         'eventos_insere_proprio',            'migration_analytics_eventos.sql')
),
checks as (
  select '1 funções'::text as grupo, nome as item, (oid is not null) as ok,
         case when oid is null then 'não existe — rode ' || migration else 'ok' end as detalhe
    from fn
  union all
  select '2 funções protegidas', nome,
         (oid is null or not has_function_privilege('anon', oid, 'execute')),
         case when oid is not null and has_function_privilege('anon', oid, 'execute')
              then 'o papel anon consegue executar — faltou "revoke all ... from public, anon"' else 'ok' end
    from fn
   where nome <> 'papel_atual'
  union all
  select '3 tabelas e RLS', t.nome,
         (c.oid is not null and c.relrowsecurity),
         case when c.oid is null then 'não existe — rode ' || t.migration
              when not c.relrowsecurity then 'existe mas SEM row level security'
              else 'ok' end
    from tabelas t
    left join pg_class c on c.relname = t.nome and c.relnamespace = 'public'::regnamespace
  union all
  select '4 triggers', g.nome || ' em ' || g.tabela,
         exists (select 1 from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
                  where tg.tgname = g.nome and c.relname = g.tabela and not tg.tgisinternal),
         case when exists (select 1 from pg_trigger tg join pg_class c on c.oid = tg.tgrelid
                            where tg.tgname = g.nome and c.relname = g.tabela and not tg.tgisinternal)
              then 'ok' else 'não existe — rode ' || g.migration end
    from gatilhos g
  union all
  select '5 policies', p.tabela || ' / ' || p.nome,
         exists (select 1 from pg_policies pp where pp.schemaname = 'public' and pp.tablename = p.tabela and pp.policyname = p.nome),
         case when exists (select 1 from pg_policies pp where pp.schemaname = 'public' and pp.tablename = p.tabela and pp.policyname = p.nome)
              then 'ok' else 'não existe — rode ' || p.migration end
    from politicas p
),
dados as (
  select '6 dados'::text as grupo, 'trilhas sem registro em conteudo_fluxo' as item,
         (n = 0) as ok, case when n = 0 then 'ok' else n || ' trilha(s) — o painel não as lista; rode o backfill de migration_fluxo_conteudo.sql' end as detalhe
    from (select count(*) n from public.trilhas t
           where not exists (select 1 from public.conteudo_fluxo f where f.tipo = 'TRILHA' and f.conteudo_id = t.id)) x
  union all
  select '6 dados', 'receitas sem registro em conteudo_fluxo', (n = 0),
         case when n = 0 then 'ok' else n || ' receita(s) — o adolescente deixa de ver (policy só-publicadas); rode o backfill de migration_fluxo_conteudo.sql' end
    from (select count(*) n from public.receitas r
           where not exists (select 1 from public.conteudo_fluxo f where f.tipo = 'RECEITA' and f.conteudo_id = r.id)) x
  union all
  select '6 dados', 'trilha "aprovada" que o fluxo não considera PUBLICADA', (n = 0),
         case when n = 0 then 'ok' else n || ' trilha(s) visíveis ao adolescente sem estar publicadas no fluxo' end
    from (select count(*) n from public.trilhas t join public.conteudo_fluxo f on f.tipo = 'TRILHA' and f.conteudo_id = t.id
           where t.status::text = 'aprovada' and f.status <> 'PUBLICADO') x
  union all
  select '6 dados', 'fluxo PUBLICADO com trilha que não está "aprovada"', (n = 0),
         case when n = 0 then 'ok' else n || ' trilha(s) publicadas no painel mas ocultas no app' end
    from (select count(*) n from public.trilhas t join public.conteudo_fluxo f on f.tipo = 'TRILHA' and f.conteudo_id = t.id
           where f.status = 'PUBLICADO' and t.status::text <> 'aprovada') x
  union all
  select '6 dados', 'perfis sem papel', (n = 0), case when n = 0 then 'ok' else n || ' perfil(is) com papel nulo' end
    from (select count(*) n from public.profiles where papel is null) x
)
select grupo, item, ok, detalhe from checks
union all
select grupo, item, ok, detalhe from dados
order by ok, grupo, item;
