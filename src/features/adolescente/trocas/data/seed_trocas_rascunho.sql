-- seed_trocas_rascunho.sql — trocas iniciais (7 categorias), TODAS EM RASCUNHO, para a nutricionista revisar.
-- O texto é sugestão e NÃO substitui a validação dela. Idempotente.
-- Rodar DEPOIS de migration_trocas.sql e migration_trocas_categorias.sql.
-- Destino buscado pelo INÍCIO do nome (o mais curto); linha sem alimento correspondente é ignorada.
--
-- Se você já rodou a versão antiga deste seed, limpe antes (a versão antiga casava "Fruta" errado):
--   delete from public.alimento_trocas;
insert into public.alimento_trocas (categoria, origem_id, destino_id, tipos_refeicao, frase, rapida, ordem)
select v.categoria, null, d.id, v.tipos::public.enum_tipo_refeicao[], v.frase, v.rapida, v.ordem
from (values
  -- Bebidas
  ('REFRIGERANTE_BEBIDA','Suco natural','{}','Suco feito na hora com a fruta, sem açúcar, acompanha bem a refeição.',false,1),
  ('REFRIGERANTE_BEBIDA','Água de coco','{}','Naturalmente docinha e refrescante.',false,2),
  ('REFRIGERANTE_BEBIDA','Água','{}','A água acompanha qualquer refeição e é fácil de levar.',true,3),
  ('REFRIGERANTE_BEBIDA','Leite','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE,CEIA}','Um copo de leite combina com o lanche.',false,4),
  ('REFRIGERANTE_BEBIDA','Limonada','{}','Limão espremido com água e pouco açúcar (ou nenhum).',false,5),
  -- Doces
  ('DOCE','Banana','{LANCHE_MANHA,LANCHE_TARDE}','A banana adoça a vontade de doce e vai fácil na mochila.',true,1),
  ('DOCE','Fruta','{LANCHE_MANHA,LANCHE_TARDE,CEIA}','Uma fruta inteira é um doce que a natureza já embalou.',true,2),
  ('DOCE','Iogurte','{LANCHE_TARDE,CEIA}','Iogurte natural com pedaços de fruta lembra sobremesa.',false,3),
  ('DOCE','Maçã','{LANCHE_MANHA,LANCHE_TARDE}','Crocante e docinha, resiste bem na mochila.',true,4),
  ('DOCE','Mamão','{}','Mamão com um fio de mel ou aveia vira sobremesa.',false,5),
  ('DOCE','Castanhas','{LANCHE_MANHA,LANCHE_TARDE}','Um punhado com uma frutinha seca mata a vontade de doce.',true,6),
  -- Embutidos
  ('EMBUTIDO','Ovo','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Ovo cozido ou mexido enche o pão tão bem quanto o embutido.',false,1),
  ('EMBUTIDO','Queijo','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Uma fatia de queijo no pão também resolve o lanche.',true,2),
  ('EMBUTIDO','Frango','{ALMOCO,JANTAR,LANCHE_TARDE}','Frango desfiado no pão é prático e rende.',false,3),
  ('EMBUTIDO','Carne','{ALMOCO,JANTAR}','Carne moída ou em pedaços, feita em casa.',false,4),
  ('EMBUTIDO','Feijão','{ALMOCO,JANTAR}','Feijão com arroz sustenta mais e cabe no bolso.',false,5),
  -- Lanches
  ('LANCHE','Sanduíche natural','{LANCHE_MANHA,LANCHE_TARDE}','Pão com ovo, queijo ou frango desfiado e folhas: lanche completo.',true,1),
  ('LANCHE','Vitamina de fruta','{LANCHE_MANHA,LANCHE_TARDE}','Fruta batida com leite: mata a fome e refresca.',false,2),
  ('LANCHE','Tapioca','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Recheie com queijo, ovo ou fruta, do jeito que você preferir.',false,3),
  ('LANCHE','Pão de queijo','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Assado e quentinho, é prático de levar.',true,4),
  ('LANCHE','Iogurte','{LANCHE_MANHA,LANCHE_TARDE}','Iogurte natural com fruta picada e um pouco de aveia.',true,5),
  ('LANCHE','Cuscuz','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Cuscuz com ovo ou queijo sustenta por mais tempo.',false,6),
  -- Refeições (combinações)
  ('REFEICAO','Feijão','{ALMOCO,JANTAR}','Arroz com feijão: dupla clássica que sustenta e cabe no bolso.',false,1),
  ('REFEICAO','Salada','{ALMOCO,JANTAR}','Ocupe uma parte do prato com salada colorida.',false,2),
  ('REFEICAO','Ovo','{ALMOCO,JANTAR}','Ovo mexido ou cozido completa o prato com proteína.',false,3),
  ('REFEICAO','Macarrão','{ALMOCO,JANTAR}','Macarrão com legumes e um ovo vira refeição completa.',false,4),
  ('REFEICAO','Cuscuz','{CAFE_DA_MANHA,JANTAR}','Cuscuz com ovo e legumes resolve a refeição.',false,5),
  -- Biscoitos
  ('BISCOITO','Bolo','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Um bolo simples feito em casa tem menos aditivos que o biscoito de pacote.',false,1),
  ('BISCOITO','Pão de queijo','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Assado e quentinho, sacia mais.',true,2),
  ('BISCOITO','Tapioca','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Crocante por fora e leve; recheie com o que tiver.',false,3),
  ('BISCOITO','Fruta','{LANCHE_MANHA,LANCHE_TARDE}','Uma fruta ao lado do lanche já muda o jogo.',true,4),
  ('BISCOITO','Iogurte','{LANCHE_MANHA,LANCHE_TARDE}','Iogurte natural com aveia ou granola caseira.',true,5),
  -- Salgadinhos
  ('SALGADINHO','Pipoca','{LANCHE_MANHA,LANCHE_TARDE}','Pipoca estourada em casa, com pouco sal, também é crocante.',true,1),
  ('SALGADINHO','Castanhas','{LANCHE_MANHA,LANCHE_TARDE}','Dá crocância e sustenta por mais tempo.',true,2),
  ('SALGADINHO','Pão de queijo','{CAFE_DA_MANHA,LANCHE_MANHA,LANCHE_TARDE}','Salgado de verdade, assado e quentinho.',false,3),
  ('SALGADINHO','Mandioca','{ALMOCO,JANTAR,LANCHE_TARDE}','Mandioca cozida ou assada em tirinhas lembra batata frita.',false,4)
) as v(categoria, destino, tipos, frase, rapida, ordem)
join lateral (select id from public.alimentos where nome ilike v.destino||'%' order by length(nome) limit 1) d on true
on conflict do nothing;

-- conferir quantas entraram por categoria:
-- select categoria, count(*) from public.alimento_trocas group by 1 order by 1;
