-- migration_receita_atomica.sql
--
-- Gravação ATÔMICA de uma receita completa pelo editor do painel: dados da receita + ingredientes
-- (receita_ingredientes: alimento + quantidade) + passo a passo (receita_passos). Antes o painel
-- gravava a receita e cada passo em chamadas separadas (falha no meio = receita pela metade) e
-- não gravava ingredientes nem foto.
--
-- Decisão de modelo (conferida no código): os ingredientes COM QUANTIDADE de uma receita vivem em
-- receita_ingredientes (alimento_id + quantidade_texto, ex.: "2 xícaras"). prato_ingredientes
-- (prato_id, ingrediente_id, proporcao) é outra coisa: a composição nutricional do prato, usada
-- na classificação, e continua sendo mantida na tela de Alimentos. Esta migration NÃO mexe nela.
-- receita_ingredientes não tem coluna de ordem: a ordem de exibição é a alfabética pelo nome.
--
-- Segurança (mesmo padrão de conteudo_salvar_licao / substituir_passos_receita): security definer
-- + checagem de papel DENTRO da função (só NUTRICIONISTA/ADMINISTRADOR); não desliga a RLS. Os
-- triggers do fluxo continuam valendo: receita nova nasce RASCUNHO; editar receita enviada ou
-- publicada volta o Admin para rascunho e mantém o status da nutricionista (sobe a versão, uma vez).
--
-- Rodar DEPOIS de migration_revisao_trilhas.sql (papel_atual) e das migrations de fluxo. Idempotente.

create or replace function public.conteudo_salvar_receita(
  p_receita_id uuid,
  p_alimento_id uuid,
  p_receita jsonb,
  p_ingredientes jsonb,
  p_passos jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_papel   text := public.papel_atual();
  v_id      uuid := p_receita_id;
  v_ingr    jsonb := coalesce(p_ingredientes, '[]'::jsonb);
  v_passos  jsonb := coalesce(p_passos, '[]'::jsonb);
  v_titulo  text;
  v_modo    text;
  v_tempo   integer;
  v_porcoes integer;
  v_dif     text;
  v_foto    text;
  v_item    jsonb;
  v_n       integer;
  v_txt     text;
begin
  if v_papel is null or v_papel not in ('NUTRICIONISTA', 'ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_receita is null or jsonb_typeof(p_receita) <> 'object' then
    raise exception 'Dados da receita inválidos.' using errcode = '22023';
  end if;
  if jsonb_typeof(v_ingr) <> 'array' or jsonb_typeof(v_passos) <> 'array' then
    raise exception 'Lista de ingredientes ou de passos inválida.' using errcode = '22023';
  end if;

  -- dados da receita
  v_titulo := btrim(coalesce(p_receita->>'titulo', ''));
  if char_length(v_titulo) < 3 or char_length(v_titulo) > 120 then
    raise exception 'O título deve ter de 3 a 120 letras.' using errcode = '22023';
  end if;
  v_modo := btrim(coalesce(p_receita->>'modo_preparo', ''));
  if char_length(v_modo) < 10 or char_length(v_modo) > 4000 then
    raise exception 'O modo de preparo deve ter de 10 a 4000 letras.' using errcode = '22023';
  end if;
  if coalesce(p_receita->>'tempo_preparo_min', '') <> '' then
    if (p_receita->>'tempo_preparo_min') !~ '^\d+$' or (p_receita->>'tempo_preparo_min')::numeric not between 1 and 1440 then
      raise exception 'O tempo de preparo vai de 1 a 1440 minutos.' using errcode = '22023';
    end if;
    v_tempo := (p_receita->>'tempo_preparo_min')::integer;
  end if;
  if coalesce(p_receita->>'porcoes', '') <> '' then
    if (p_receita->>'porcoes') !~ '^\d+$' or (p_receita->>'porcoes')::numeric not between 1 and 99 then
      raise exception 'As porções vão de 1 a 99.' using errcode = '22023';
    end if;
    v_porcoes := (p_receita->>'porcoes')::integer;
  end if;
  v_dif := coalesce(p_receita->>'dificuldade', 'FACIL');
  if v_dif not in ('FACIL', 'MEDIO', 'DIFICIL') then
    raise exception 'Dificuldade inválida.' using errcode = '22023';
  end if;
  v_foto := nullif(btrim(coalesce(p_receita->>'foto_url', '')), '');
  if v_foto is not null and (v_foto !~* '^https?://\S+$' or char_length(v_foto) > 500) then
    raise exception 'O link da foto deve começar com http:// ou https:// (máximo de 500 letras).' using errcode = '22023';
  end if;

  -- qual receita / prato
  if v_id is not null then
    perform 1 from public.receitas where id = v_id for update;
    if not found then raise exception 'Receita não encontrada.' using errcode = 'P0002'; end if;
  else
    if p_alimento_id is null or not exists (select 1 from public.alimentos where id = p_alimento_id and eh_prato_composto) then
      raise exception 'Escolha um prato composto do catálogo de alimentos.' using errcode = '22023';
    end if;
  end if;

  -- valida ingredientes
  if jsonb_array_length(v_ingr) > 40 then raise exception 'No máximo 40 ingredientes.' using errcode = '22023'; end if;
  for v_item, v_n in select i.valor, i.n from jsonb_array_elements(v_ingr) with ordinality as i(valor, n) loop
    if coalesce(v_item->>'alimento_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or not exists (select 1 from public.alimentos where id = (v_item->>'alimento_id')::uuid) then
      raise exception 'Ingrediente %: alimento não encontrado.', v_n using errcode = '22023';
    end if;
    v_txt := btrim(coalesce(v_item->>'quantidade_texto', ''));
    if v_txt = '' or char_length(v_txt) > 60 then
      raise exception 'Ingrediente %: informe a quantidade (até 60 letras).', v_n using errcode = '22023';
    end if;
  end loop;
  if (select count(distinct x->>'alimento_id') from jsonb_array_elements(v_ingr) x) <> jsonb_array_length(v_ingr) then
    raise exception 'Há ingrediente repetido na lista.' using errcode = '22023';
  end if;

  -- valida passos
  if jsonb_array_length(v_passos) > 30 then raise exception 'No máximo 30 passos.' using errcode = '22023'; end if;
  for v_item, v_n in select p.valor, p.n from jsonb_array_elements(v_passos) with ordinality as p(valor, n) loop
    if char_length(btrim(coalesce(v_item->>'titulo', ''))) not between 1 and 80 then
      raise exception 'Passo %: o título deve ter de 1 a 80 letras.', v_n using errcode = '22023';
    end if;
    if char_length(btrim(coalesce(v_item->>'descricao', ''))) not between 1 and 1500 then
      raise exception 'Passo %: a descrição deve ter de 1 a 1500 letras.', v_n using errcode = '22023';
    end if;
    v_txt := nullif(btrim(coalesce(v_item->>'foto_url', '')), '');
    if v_txt is not null and (v_txt !~* '^https?://\S+$' or char_length(v_txt) > 500) then
      raise exception 'Passo %: o link da foto deve começar com http:// ou https://.', v_n using errcode = '22023';
    end if;
  end loop;

  -- grava a receita
  if v_id is null then
    insert into public.receitas (alimento_resultante_id, titulo, modo_preparo, tempo_preparo_min, porcoes, dificuldade, foto_url)
    values (p_alimento_id, v_titulo, v_modo, v_tempo, coalesce(v_porcoes, 1), v_dif::enum_nivel_dificuldade, v_foto)
    returning id into v_id;
  else
    update public.receitas
       set titulo = v_titulo, modo_preparo = v_modo, tempo_preparo_min = v_tempo,
           porcoes = coalesce(v_porcoes, 1), dificuldade = v_dif::enum_nivel_dificuldade, foto_url = v_foto
     where id = v_id;
  end if;

  -- substitui ingredientes e passos (a lista enviada é a lista completa)
  delete from public.receita_ingredientes where receita_id = v_id;
  insert into public.receita_ingredientes (receita_id, alimento_id, quantidade_texto)
  select v_id, (x->>'alimento_id')::uuid, btrim(x->>'quantidade_texto')
    from jsonb_array_elements(v_ingr) x;

  delete from public.receita_passos where receita_id = v_id;
  insert into public.receita_passos (receita_id, ordem, titulo, descricao, foto_url)
  select v_id, p.n, btrim(p.valor->>'titulo'), btrim(p.valor->>'descricao'),
         nullif(btrim(coalesce(p.valor->>'foto_url', '')), '')
    from jsonb_array_elements(v_passos) with ordinality as p(valor, n);

  return v_id;
end;
$$;

revoke all on function public.conteudo_salvar_receita(uuid, uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.conteudo_salvar_receita(uuid, uuid, jsonb, jsonb, jsonb) to authenticated;

-- Conferência rápida:
--   select proname from pg_proc where proname = 'conteudo_salvar_receita';
