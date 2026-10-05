-- RESET DO CONTEÚDO E DO PROGRESSO DA TRILHA (ambiente de teste)
-- Execute no SQL Editor do Supabase ANTES do seed_trilha_completa.sql.
--
-- APAGA: todas as trilhas, módulos, lições, passos/exercícios e o progresso
--        de lições de TODOS os usuários.
-- MANTÉM: contas, perfis, triagem (EBIA e recordatório), alimentos, registros
--        de água/atividade/refeição, sequência e XP.
-- Tudo roda numa transação: se qualquer comando falhar, nada é apagado.

begin;

delete from public.progresso_licao;
delete from public.opcoes_quiz;
delete from public.questoes_quiz;

-- tabela criada por um seed antigo; nunca foi lida pelo app (pode não existir)
do $$
begin
  if to_regclass('public.licao_componentes') is not null then
    execute 'delete from public.licao_componentes';
  end if;
end $$;

delete from public.licoes;
delete from public.modulos_trilha;
delete from public.trilhas;

-- OPCIONAL — recomeçar também o XP e a sequência (tire o "--" para usar).
-- Sem isso o XP que já veio das lições apagadas continua somado.
-- update public.xp_usuario set xp_total = 0;
-- update public.profiles set sequencia_atual = 0, maior_sequencia = 0, ultimo_dia_mantido = null;

commit;
