-- Verificações de segurança para antes de liberar (SÓ LEITURA). Rodar no SQL Editor e me mandar o resultado.

-- 1. Tabelas do schema public SEM RLS (qualquer usuário logado lê/escreve tudo, pela API)
select c.relname as tabela
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
order by 1;

-- 2. Escrita direta que o app autenticado ainda tem (deveria ser vazio para xp_*, resgates, conquistas)
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
  and privilege_type in ('INSERT', 'UPDATE', 'DELETE')
  and table_name in ('xp_usuario', 'xp_lancamentos', 'progresso_licao', 'insignias_usuario',
                     'missoes_periodicas_resgates', 'cartas_usuario', 'desafio_trofeus', 'profiles')
group by 1, 2 order by 1, 2;

-- 3. Triggers em profiles (procure um que proteja `papel`; se não houver, rode migration_protege_perfil.sql)
select tgname, pg_get_triggerdef(oid) from pg_trigger
where tgrelid = 'public.profiles'::regclass and not tgisinternal;

-- 4. Funções SECURITY DEFINER que o papel anon consegue executar (deveria ser vazio)
select p.proname
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and has_function_privilege('anon', p.oid, 'EXECUTE')
order by 1;

-- 5. Unicidade em progresso_licao (usuário + lição)
select indexname, indexdef from pg_indexes where tablename = 'progresso_licao';
