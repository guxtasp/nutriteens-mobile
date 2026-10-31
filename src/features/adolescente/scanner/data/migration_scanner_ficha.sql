-- migration_scanner_ficha.sql — a equipe passa a cadastrar a FICHA COMPLETA do produto (Raio-X do rótulo).
-- Idempotente. Rodar DEPOIS de migration_scanner.sql e migration_scanner_solicitacoes.sql.
--
--  * scanner_resolver_solicitacao ganha p_detalhes (açúcar, sal, gordura saturada, fibra, proteína, aditivos,
--    ingredientes e imagem, a cada 100 g). Antes só gravava nome, marca, nível NOVA e categoria.
--  * scanner_listar_solicitacoes passa a devolver a ficha que já está na base (cache da Open Food Facts),
--    para a equipe completar o que faltou em vez de digitar tudo de novo.
--  * Sem calorias, de propósito (igual ao resto do scanner).
begin;

-- 1. Resolver: nova assinatura (remove a antiga para não ficar duas sobrecargas) ----------------------
drop function if exists public.scanner_resolver_solicitacao(uuid, text, text, text, text, text, text);

create or replace function public.scanner_resolver_solicitacao(
  p_id        uuid,
  p_acao      text,                  -- 'APROVAR' | 'REJEITAR'
  p_nome      text default null,
  p_marca     text default null,
  p_nova      text default null,
  p_categoria text default null,
  p_nota      text default null,
  p_detalhes  jsonb default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  s public.scanner_solicitacoes;
  v_nome text := left(nullif(btrim(coalesce(p_nome, '')), ''), 200);
begin
  if coalesce(public.papel_atual()::text, '') not in ('NUTRICIONISTA','ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  if p_acao not in ('APROVAR','REJEITAR') then raise exception 'Ação inválida.' using errcode = '22023'; end if;
  if p_detalhes is not null and jsonb_typeof(p_detalhes) <> 'object' then
    raise exception 'Ficha inválida.' using errcode = '22023';
  end if;

  select * into s from public.scanner_solicitacoes where id = p_id for update;
  if not found then raise exception 'Solicitação não encontrada.' using errcode = 'P0002'; end if;
  if s.status <> 'PENDENTE' then raise exception 'Solicitação já resolvida.' using errcode = 'P0001'; end if;

  if p_acao = 'APROVAR' then
    if v_nome is null then raise exception 'Informe o nome do produto.' using errcode = '22023'; end if;
    insert into public.produtos_scanner (codigo_barras, nome, marca, classificacao_nova, categoria_troca, fonte, detalhes)
    values (s.codigo_barras, v_nome, left(nullif(btrim(coalesce(p_marca, '')), ''), 120), p_nova, p_categoria, 'EQUIPE', p_detalhes)
    on conflict (codigo_barras) do update set
      nome = excluded.nome, marca = excluded.marca,
      classificacao_nova = excluded.classificacao_nova, categoria_troca = excluded.categoria_troca,
      detalhes = excluded.detalhes,
      fonte = 'EQUIPE';
  end if;

  update public.scanner_solicitacoes set
    status = case p_acao when 'APROVAR' then 'APROVADA' else 'REJEITADA' end,
    resolvido_por = auth.uid(), resolvido_em = now(), atualizado_em = now(),
    nota_equipe = left(nullif(btrim(coalesce(p_nota, '')), ''), 500)
  where id = p_id;
end;
$$;
revoke all on function public.scanner_resolver_solicitacao(uuid, text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.scanner_resolver_solicitacao(uuid, text, text, text, text, text, text, jsonb) to authenticated;

-- 2. Listar: devolve também o que já existe na base --------------------------------------------------
drop function if exists public.scanner_listar_solicitacoes(text);

create or replace function public.scanner_listar_solicitacoes(p_status text default 'PENDENTE')
returns table (
  id uuid, codigo_barras text, motivo text, nome_informado text, marca_informada text,
  candidato_codigo text, candidato_nome text, pedidos integer, status text,
  criado_em timestamptz, nota_equipe text,
  produto_atual_nome text, produto_atual_fonte text,
  produto_atual_marca text, produto_atual_nova text, produto_atual_categoria text, produto_atual_detalhes jsonb
)
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.papel_atual()::text, '') not in ('NUTRICIONISTA','ADMINISTRADOR') then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;
  return query
    select s.id, s.codigo_barras, s.motivo, s.nome_informado, s.marca_informada,
           s.candidato_codigo, s.candidato_nome, s.pedidos, s.status, s.criado_em, s.nota_equipe,
           p.nome, p.fonte, p.marca, p.classificacao_nova, p.categoria_troca, p.detalhes
      from public.scanner_solicitacoes s
      left join public.produtos_scanner p on p.codigo_barras = s.codigo_barras
     where s.status = p_status
     order by s.pedidos desc, s.criado_em
     limit 200;
end;
$$;
revoke all on function public.scanner_listar_solicitacoes(text) from public, anon;
grant execute on function public.scanner_listar_solicitacoes(text) to authenticated;

commit;
