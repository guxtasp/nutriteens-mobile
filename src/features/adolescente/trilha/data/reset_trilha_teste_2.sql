-- RESET DA 2ª TRILHA DE TESTE ("Hidratação e Bebidas")
-- Remove SÓ a trilha marcada com [TESTE_TRILHA_2] (conteúdo + progresso dela).
-- Não mexe nas outras trilhas, nem em XP/sequência.

begin;

do $$
declare
  v_trilha uuid;
begin
  select id into v_trilha from public.trilhas where descricao like '[TESTE_TRILHA_2]%' limit 1;
  if v_trilha is null then
    raise notice 'Nenhuma 2ª trilha de teste encontrada.';
    return;
  end if;

  delete from public.progresso_licao
   where licao_id in (select l.id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = v_trilha);
  delete from public.opcoes_quiz
   where questao_id in (select q.id from public.questoes_quiz q join public.licoes l on l.id = q.licao_id join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = v_trilha);
  delete from public.questoes_quiz
   where licao_id in (select l.id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = v_trilha);
  if to_regclass('public.licao_componentes') is not null then
    execute 'delete from public.licao_componentes where licao_id in (select l.id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = $1)' using v_trilha;
  end if;
  delete from public.licoes where modulo_id in (select id from public.modulos_trilha where trilha_id = v_trilha);
  delete from public.modulos_trilha where trilha_id = v_trilha;
  delete from public.trilha_revisoes where trilha_id = v_trilha;
  delete from public.trilhas where id = v_trilha;
end $$;

commit;
