-- Validação manual de RLS para o módulo Minha jornada (rodar no SQL Editor do Supabase).
-- 1) RLS ligada nas tabelas que o módulo lê? Esperado: rls_ativa = true em todas.
select c.relname as tabela, c.relrowsecurity as rls_ativa
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in (
  'registros_diarios','registros_agua','registros_atividade_fisica','refeicoes','refeicao_alimentos',
  'missoes_diarias','progresso_licao','xp_lancamentos','insignias_usuario','cartas_usuario','profiles','trilhas')
order by 1;

-- 2) Políticas de SELECT: nenhuma pode usar "true" nas tabelas de dado pessoal.
select tablename, policyname, cmd, qual
from pg_policies
where tablename in ('registros_diarios','registros_agua','registros_atividade_fisica','refeicoes','refeicao_alimentos',
  'missoes_diarias','progresso_licao','xp_lancamentos','insignias_usuario','cartas_usuario')
  and cmd in ('SELECT','ALL')
order by tablename;

-- 3) Teste de isolamento (substitua pelos UUIDs de dois adolescentes de teste).
-- Logado como A, a contagem de linhas de B deve ser 0:
--   set local role authenticated;
--   select set_config('request.jwt.claims', '{"sub":"<UUID_A>"}', true);
--   select count(*) from progresso_licao where usuario_id = '<UUID_B>';   -- esperado: 0
--   select count(*) from xp_lancamentos  where usuario_id = '<UUID_B>';   -- esperado: 0
