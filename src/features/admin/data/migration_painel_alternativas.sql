-- migration_painel_alternativas.sql
-- P2: excluir Alternativa (troca) pelo painel. Criar já funciona: o trigger trocas_fluxo_criar
-- (migration_trocas.sql) põe a nova alternativa em RASCUNHO e a RLS trocas_staff deixa a equipe inserir.
-- Regras da exclusão: só RASCUNHO, REJEITADO ou ARQUIVADO; se algum adolescente já respondeu à
-- alternativa ("Vou tentar"/"Não tenho"), ela não é excluída (mantenha arquivada: o histórico fica).
-- A exclusão entra na auditoria com o título "Bebidas → Suco natural" (antes ficava sem título).
-- Roda DEPOIS de migration_painel_excluir_conteudo.sql e migration_trocas_painel.sql. Idempotente.
begin;

create or replace function public.fluxo_remover()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.conteudo_fluxo where tipo = tg_argv[0] and conteudo_id = old.id;
  insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, acao, ator_id, ator_papel)
  values (tg_argv[0], old.id,
          coalesce(to_jsonb(old)->>'titulo', nullif(current_setting('app.excluindo_titulo', true), '')),
          'EXCLUSAO', auth.uid(), public.papel_atual());
  return old;
end;
$$;

create or replace function public.conteudo_excluir(p_tipo text, p_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_papel text := public.papel_atual();
  v_status text;
  v_concluidas integer;
  v_respostas integer;
begin
  if v_papel is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_tipo not in ('TRILHA', 'RECEITA', 'TROCA') then
    raise exception 'Tipo inválido.' using errcode = '22023';
  end if;

  select status into v_status from public.conteudo_fluxo where tipo = p_tipo and conteudo_id = p_id;
  if v_status is null then raise exception 'Conteúdo não encontrado.' using errcode = 'P0002'; end if;
  if v_status not in ('RASCUNHO', 'REJEITADO', 'ARQUIVADO') then
    raise exception 'Só dá para excluir conteúdo em rascunho, rejeitado ou arquivado. Arquive este conteúdo primeiro.' using errcode = '23514';
  end if;

  if p_tipo = 'TRILHA' then
    select count(*) into v_concluidas
      from public.progresso_licao pl
      join public.licoes l on l.id = pl.licao_id
      join public.modulos_trilha m on m.id = l.modulo_id
     where m.trilha_id = p_id;
    if v_concluidas > 0 then
      raise exception 'Esta trilha já tem % conclusão(ões) de lições por adolescentes e não pode ser excluída. Mantenha-a arquivada.', v_concluidas
        using errcode = '23503';
    end if;
    delete from public.opcoes_quiz where questao_id in (
      select q.id from public.questoes_quiz q
        join public.licoes l on l.id = q.licao_id
        join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = p_id);
    delete from public.questoes_quiz where licao_id in (
      select l.id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = p_id);
    delete from public.licao_componentes where licao_id in (
      select l.id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id where m.trilha_id = p_id);
    delete from public.licoes where modulo_id in (select id from public.modulos_trilha where trilha_id = p_id);
    delete from public.modulos_trilha where trilha_id = p_id;
    delete from public.trilhas where id = p_id;
  elsif p_tipo = 'RECEITA' then
    delete from public.receitas where id = p_id;
  else
    -- troca_respostas apagaria em cascata: preferimos preservar o histórico e pedir para arquivar
    select count(*) into v_respostas from public.troca_respostas where troca_id = p_id;
    if v_respostas > 0 then
      raise exception 'Esta alternativa já tem % resposta(s) de adolescentes e não pode ser excluída. Mantenha-a arquivada.', v_respostas
        using errcode = '23503';
    end if;
    perform set_config('app.excluindo_titulo', coalesce(public.fluxo_titulo('TROCA', p_id), ''), true);
    delete from public.alimento_trocas where id = p_id;
    perform set_config('app.excluindo_titulo', '', true);
  end if;
exception
  when foreign_key_violation then
    raise exception 'Este conteúdo está ligado a outros registros e não pode ser excluído. Mantenha-o arquivado.' using errcode = '23503';
end;
$$;
revoke all on function public.conteudo_excluir(text, uuid) from public, anon;
grant execute on function public.conteudo_excluir(text, uuid) to authenticated;

commit;
