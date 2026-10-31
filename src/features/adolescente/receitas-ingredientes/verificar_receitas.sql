-- verificar_receitas.sql — A2: por que "não dá para adicionar ingrediente" em "Receitas com o que tenho".
-- Só leitura. Rodar no SQL Editor do Supabase e me mandar o resultado.
-- A tela mostra receitas cujo PRATO resultante (alimentos.eh_prato_composto) passa na escala EBIA do adolescente
-- e que estão PUBLICADAS (policy receitas_so_publicadas). Se o número final for 0, o app não tem receita para mostrar.

-- 1. Quantas receitas existem, quantas publicadas, quantas têm prato composto ligado
select
  (select count(*) from public.receitas)                                                       as receitas_total,
  (select count(*) from public.conteudo_fluxo where tipo = 'RECEITA' and status = 'PUBLICADO') as receitas_publicadas,
  (select count(*) from public.receitas r join public.alimentos a on a.id = r.alimento_resultante_id
     where a.eh_prato_composto)                                                                 as receitas_com_prato_composto;

-- 2. Receitas publicadas por nível EBIA do prato (o adolescente só vê o seu nível ou mais acessível)
select a.nivel_maximo_ebia::text as nivel_do_prato, count(*) as receitas
  from public.receitas r
  join public.alimentos a on a.id = r.alimento_resultante_id and a.eh_prato_composto
  join public.conteudo_fluxo f on f.tipo = 'RECEITA' and f.conteudo_id = r.id and f.status = 'PUBLICADO'
 group by 1 order by 1;

-- 3. Receitas sem ingrediente nenhum (nem em receita_ingredientes nem no prato) — nunca combinam com a despensa
select r.titulo
  from public.receitas r
 where not exists (select 1 from public.receita_ingredientes i where i.receita_id = r.id)
   and not exists (select 1 from public.prato_ingredientes p where p.prato_id = r.alimento_resultante_id)
 order by r.titulo;

-- 4. Classificação EBIA dos perfis de teste (vazio = o app usa INSEGURANCA_GRAVE por padrão)
select classificacao_ebia_atual::text as classificacao, count(*) as adolescentes
  from public.profiles where papel::text = 'ADOLESCENTE' group by 1 order by 2 desc;

-- 5. Os atalhos comuns do app existem no catálogo? (cada um precisa de pelo menos 1 alimento começando com a palavra)
select t.termo, count(a.id) as alimentos_encontrados
  from unnest(array['ovo','arroz','feijão','banana','leite','pão','batata','cenoura','tomate','frango','macarrão','queijo','maçã','mandioca']) as t(termo)
  left join public.alimentos a on not a.eh_prato_composto
       and translate(lower(a.nome),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc') ~ ('^' || translate(lower(t.termo),'áàâãäéèêëíìîïóòôõöúùûüç','aaaaaeeeeiiiiooooouuuuc') || '([^a-z0-9]|$)')
 group by t.termo order by alimentos_encontrados, t.termo;
