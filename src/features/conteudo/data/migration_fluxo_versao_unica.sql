-- migration_fluxo_versao_unica.sql
--
-- Corrige: a versão do conteúdo (e a auditoria) subia uma vez por LINHA alterada
-- quando a nutricionista editava conteúdo já enviado/aprovado/publicado — salvar
-- uma receita com 8 passos (delete 8 + insert 8) virava versão +16 e 16 linhas de
-- auditoria. Agora conta uma vez por (conteúdo, transação).
-- Idempotente. Rodar DEPOIS de migration_permissoes_conteudo.sql.

create or replace function public.fluxo_alteracao_relevante()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_row    jsonb := to_jsonb(coalesce(new, old));
  v_tipo   text;
  v_id     uuid;
  v_ant    text;
  v_versao integer;
begin
  if auth.uid() is null or current_setting('app.fluxo', true) = '1' then
    return coalesce(new, old);
  end if;

  -- mudar só a ordem (organizar) não é alteração de conteúdo
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'ordem' - 'atualizado_em') = (to_jsonb(old) - 'ordem' - 'atualizado_em') then
    return new;
  end if;

  case tg_table_name
    when 'trilhas' then
      v_tipo := 'TRILHA'; v_id := (v_row->>'id')::uuid;
    when 'modulos_trilha' then
      v_tipo := 'TRILHA'; v_id := (v_row->>'trilha_id')::uuid;
    when 'licoes' then
      v_tipo := 'TRILHA';
      select trilha_id into v_id from public.modulos_trilha where id = (v_row->>'modulo_id')::uuid;
    when 'licao_componentes' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id
        where l.id = (v_row->>'licao_id')::uuid;
    when 'questoes_quiz' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.licoes l join public.modulos_trilha m on m.id = l.modulo_id
        where l.id = (v_row->>'licao_id')::uuid;
    when 'opcoes_quiz' then
      v_tipo := 'TRILHA';
      select m.trilha_id into v_id from public.questoes_quiz q
        join public.licoes l on l.id = q.licao_id join public.modulos_trilha m on m.id = l.modulo_id
        where q.id = (v_row->>'questao_id')::uuid;
    when 'receitas' then
      v_tipo := 'RECEITA'; v_id := (v_row->>'id')::uuid;
    else -- receita_ingredientes, receita_passos
      v_tipo := 'RECEITA'; v_id := (v_row->>'receita_id')::uuid;
  end case;

  if v_id is null then return coalesce(new, old); end if;

  select status into v_ant from public.conteudo_fluxo
    where tipo = v_tipo and conteudo_id = v_id for update;

  -- nutricionista (responsável técnica) edita livremente: o status é mantido,
  -- só sobe a versão e fica na auditoria. Edição do Admin volta para rascunho.
  if v_ant in ('AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO') and public.papel_atual() = 'NUTRICIONISTA' then
    -- o trigger roda POR LINHA: salvar uma receita com 8 passos subia a versão 16x.
    -- Marca (tipo:id) na transação e só conta a primeira alteração de cada salvamento.
    if position(v_tipo || ':' || v_id::text || ';' in coalesce(current_setting('app.fluxo_edicao', true), '')) > 0 then
      return coalesce(new, old);
    end if;
    perform set_config('app.fluxo_edicao', coalesce(current_setting('app.fluxo_edicao', true), '') || v_tipo || ':' || v_id::text || ';', true);
    update public.conteudo_fluxo set versao = versao + 1, atualizado_em = now()
     where tipo = v_tipo and conteudo_id = v_id
     returning versao into v_versao;
    insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_anterior, status_novo, ator_id, ator_papel, motivo)
    values (v_tipo, v_id, public.fluxo_titulo(v_tipo, v_id), v_versao, 'EDICAO', v_ant, v_ant,
            auth.uid(), 'NUTRICIONISTA', 'Editado pela nutricionista responsável.');
  elsif v_ant in ('AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO') then
    update public.conteudo_fluxo
       set status = 'RASCUNHO', versao = versao + 1, motivo_rejeicao = null, atualizado_em = now()
     where tipo = v_tipo and conteudo_id = v_id
     returning versao into v_versao;

    if v_tipo = 'TRILHA' then
      perform set_config('app.fluxo', '1', true);
      update public.trilhas set status = 'rascunho', aprovado_por = null, aprovado_em = null where id = v_id;
      perform set_config('app.fluxo', '', true);
    end if;

    insert into public.conteudo_auditoria (tipo, conteudo_id, titulo, versao, acao, status_anterior, status_novo, ator_id, ator_papel, motivo)
    values (v_tipo, v_id, public.fluxo_titulo(v_tipo, v_id), v_versao, 'ALTERACAO_RELEVANTE', v_ant, 'RASCUNHO',
            auth.uid(), public.papel_atual(), 'Conteúdo alterado: precisa de nova aprovação.');
  end if;

  return coalesce(new, old);
end;
$$;
