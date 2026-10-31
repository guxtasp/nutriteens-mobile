-- seed_scanner_sintetico.sql — dados SINTÉTICOS para testar o scanner (app, nutricionista e admin).
-- Rodar no SQL Editor do Supabase, DEPOIS de migration_scanner.sql e migration_scanner_solicitacoes.sql.
-- Idempotente: apaga os dados sintéticos anteriores e recria (pode rodar quantas vezes quiser).
--
-- MARCADOR: todos os códigos de barras sintéticos começam com 79990000 (EAN-13 com dígito verificador
-- válido, então o leitor e a digitação manual aceitam). Para apagar tudo: limpar_scanner_sintetico.sql.
--
-- O que cria:
--   produtos_scanner (6): 3 da EQUIPE, 2 do cache da Open Food Facts (um com Raio-X completo), 1 só com nome.
--   scanner_solicitacoes (7): 4 PENDENTES (com 7, 3, 2 e 1 pedidos), 1 APROVADA, 1 REJEITADA, 1 FICHA_INCOMPLETA pendente
--     com candidato sugerido. Nenhum pedido tem usuário associado (a equipe nunca vê quem pediu).
--
-- Como testar:
--   App (adolescente): escanear/digitar 7999000000017 (ultraprocessado + alternativas de bebida),
--     7999000000055 (Raio-X completo), 7999000000048 (natural), 7999000000130 (não existe -> pedir cadastro).
--   Nutricionista/Admin: tela de solicitações do scanner (pendentes, aprovadas e rejeitadas) e o contador de pendências.
begin;

-- 0. limpa execuções anteriores ---------------------------------------------------------------
delete from public.scanner_solicitacoes where codigo_barras like '79990000%';
delete from public.produtos_scanner     where codigo_barras like '79990000%';

-- 1. Produtos já cadastrados ------------------------------------------------------------------
insert into public.produtos_scanner (codigo_barras, nome, marca, classificacao_nova, categoria_troca, fonte, detalhes) values
  ('7999000000017', 'Refrigerante de cola 2 L (TESTE)',     'Marca Teste', 'ULTRAPROCESSADO',      'REFRIGERANTE_BEBIDA', 'EQUIPE', null),
  ('7999000000024', 'Salgadinho de milho sabor queijo (TESTE)', 'Marca Teste', 'ULTRAPROCESSADO',  'SALGADINHO',          'EQUIPE', null),
  ('7999000000031', 'Biscoito recheado de chocolate (TESTE)',   'Marca Teste', 'ULTRAPROCESSADO',  'BISCOITO',            'EQUIPE', null),
  ('7999000000048', 'Arroz branco tipo 1 (TESTE)',          'Marca Teste', 'IN_NATURA',            null,                  'OPEN_FOOD_FACTS',
     '{"acucarG":0,"salG":0,"gorduraSatG":0.1,"fibraG":1.6,"proteinaG":7.1,"aditivos":0,"ingredientes":["arroz"]}'::jsonb),
  ('7999000000055', 'Achocolatado em pó (TESTE)',           'Marca Teste', 'ULTRAPROCESSADO',      'DOCE',                'OPEN_FOOD_FACTS',
     '{"acucarG":68,"salG":0.2,"gorduraSatG":1.8,"fibraG":3.5,"proteinaG":4.2,"aditivos":3,"ingredientes":["açúcar","cacau em pó","maltodextrina","sal","aromatizante"]}'::jsonb),
  ('7999000000062', 'Produto cadastrado só com nome (TESTE)', null,        null,                  null,                  'EQUIPE', null);

-- 2. Solicitações de cadastro -----------------------------------------------------------------
-- PENDENTES (ordem da fila: mais pedidos primeiro)
insert into public.scanner_solicitacoes
  (codigo_barras, motivo, nome_informado, marca_informada, candidato_codigo, candidato_nome, pedidos, status, criado_em, atualizado_em) values
  ('7999000000079', 'NAO_ENCONTRADO',  'Bolacha recheada de morango', 'Marca Teste', null, null, 7, 'PENDENTE', now() - interval '6 days', now() - interval '1 day'),
  ('7999000000086', 'NAO_ENCONTRADO',  null,                          null,          null, null, 3, 'PENDENTE', now() - interval '3 days', now() - interval '3 days'),
  ('7999000000093', 'FICHA_INCOMPLETA','Suco de laranja em caixa',    'Marca Teste', '7999000000017', 'Refrigerante de cola 2 L (TESTE)', 2, 'PENDENTE', now() - interval '2 days', now() - interval '2 days'),
  ('7999000000109', 'NAO_ENCONTRADO',  'Pão de forma integral',       null,          null, null, 1, 'PENDENTE', now() - interval '2 hours', now() - interval '2 hours');

-- RESOLVIDAS (para testar as abas/filtros de aprovadas e rejeitadas)
insert into public.scanner_solicitacoes
  (codigo_barras, motivo, nome_informado, marca_informada, pedidos, status, criado_em, atualizado_em, resolvido_em, nota_equipe) values
  ('7999000000116', 'NAO_ENCONTRADO', 'Biscoito de água e sal', 'Marca Teste', 4, 'APROVADA',  now() - interval '9 days', now() - interval '8 days', now() - interval '8 days', 'Cadastrado pela equipe (teste).'),
  ('7999000000123', 'NAO_ENCONTRADO', 'Detergente líquido',     null,          1, 'REJEITADA', now() - interval '7 days', now() - interval '7 days', now() - interval '7 days', 'Produto não alimentício (teste).');

-- o produto da solicitação APROVADA existe com fonte EQUIPE
insert into public.produtos_scanner (codigo_barras, nome, marca, classificacao_nova, categoria_troca, fonte) values
  ('7999000000116', 'Biscoito de água e sal (TESTE)', 'Marca Teste', 'PROCESSADO', 'BISCOITO', 'EQUIPE');

commit;

-- Conferência (opcional):
-- select codigo_barras, nome, fonte, classificacao_nova from public.produtos_scanner where codigo_barras like '79990000%' order by 1;
-- select codigo_barras, motivo, pedidos, status from public.scanner_solicitacoes where codigo_barras like '79990000%' order by status, pedidos desc;
