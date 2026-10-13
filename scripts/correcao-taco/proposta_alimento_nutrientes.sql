-- PROPOSTA — NÃO RODAR SEM REVISÃO. Gerada por gerar_proposta.py (mapeamento explícito catálogo -> TACO).
-- Limiares: RDC 269/2005 (IDR adulto) + RDC 54/2012 (fonte >=15%, alto teor >=30% por 100 g; líquidos metade).
-- Só colunas com valor na TACO são gravadas (NULL = não sabemos). Rodar primeiro com ROLLBACK, conferir, e só então trocar por COMMIT.
-- Não toca: Cenoura, Batata doce, Grão-de-bico, Aveia, linhas INFERIDO_POR_GRUPO e itens fora do mapa.
-- Não mapeados (ambíguos): Peixe (espécie indefinida); Macarrão (cozido não existe na TACO); Tapioca; Suco natural (fruta indefinida); Fruta (banana, maçã, mamão...) (genérico); Pratos compostos (usar prato_ingredientes); Hambúrguer/Bolo/Geleia/Chocolate etc. (processados/ultra)

begin;

-- Feijão  <-  TACO #561 Feijão, carioca, cozido  (confiança media)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('00552594-d1bf-4e77-b64d-01ce30bc1d01', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'FONTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Arroz  <-  TACO #3 Arroz, tipo 1, cozido  (confiança media)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, calcio, ferro, zinco, magnesio)
values ('d0ae824d-fcd9-4265-ae5c-1524d655e7b7', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Leite  <-  TACO #458 Leite, de vaca, integral  (confiança alta)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('2aec7740-f93c-4a9b-bbf0-3f5960f33d6b', 'TACO_4ED', now(), 'AUSENTE', 'FONTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Ovo  <-  TACO #488 Ovo, de galinha, inteiro, cozido/10minutos  (confiança media)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, calcio, ferro, zinco, magnesio)
values ('99e2d0e6-a6cf-43b4-b846-9957fe166b41', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'FONTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Ovo cozido  <-  TACO #488 Ovo, de galinha, inteiro, cozido/10minutos  (confiança alta)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, calcio, ferro, zinco, magnesio)
values ('e4dd0fbf-76f0-473b-9486-eadbb766ac49', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'FONTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Ovo frito/mexido  <-  TACO #490 Ovo, de galinha, inteiro, frito  (confiança media)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('059cb970-5908-4963-ab34-d85820fc4a83', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'FONTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Frango  <-  TACO #408 Frango, peito, sem pele, cozido  (confiança baixa)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_a, calcio, ferro, zinco, magnesio)
values ('269547b9-c2ed-40c6-85bb-71709cc8f6de', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_a = excluded.vitamina_a, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Batata  <-  TACO #91 Batata, inglesa, cozida  (confiança alta)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('da7814e6-e8f9-49ce-961e-a507f4a759cd', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Batata doce cozida  <-  TACO #88 Batata, doce, cozida  (confiança alta)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('cd8d4647-b4e4-4e3c-8b0a-12865acdc99e', 'TACO_4ED', now(), 'ALTO_TEOR', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Açaí  <-  TACO #168 Açaí, polpa, congelada  (confiança media)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('1956c16f-461e-4a19-982d-faaf64c93e8e', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Carne bovina  <-  TACO #326 Carne, bovina, acém, moído, cozido  (confiança baixa)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_a, calcio, ferro, zinco, magnesio)
values ('4abdc2d0-15e0-4bfc-bb2b-6b862419b556', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'FONTE', 'ALTO_TEOR', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_a = excluded.vitamina_a, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Carne suína  <-  TACO #432 Porco, lombo, assado  (confiança baixa)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_a, calcio, ferro, zinco, magnesio)
values ('65e731d6-a632-4ca5-a97f-8729ca5eedbb', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'FONTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_a = excluded.vitamina_a, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Pão francês  <-  TACO #53 Pão, trigo, francês  (confiança alta)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, calcio, ferro, zinco, magnesio)
values ('0a045fee-f690-47e1-923a-d5d9c6693eae', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Cuscuz  <-  TACO #533 Cuscuz, de milho, cozido com sal  (confiança alta)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('0a63c74d-e4d1-419f-983c-38acc2d045bd', 'TACO_4ED', now(), 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Mandioca/aipim  <-  TACO #129 Mandioca, cozida  (confiança alta)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('81b1062a-f551-43c5-a0e7-3befdb415d4b', 'TACO_4ED', now(), 'FONTE', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- Abóbora/purê de abóbora  <-  TACO #64 Abóbora, cabotian, cozida  (confiança media)
insert into public.alimento_nutrientes (alimento_id, fonte, atualizado_em, vitamina_c, calcio, ferro, zinco, magnesio)
values ('73004825-126d-4fc4-a38b-5186a671c7d1', 'TACO_4ED', now(), 'FONTE', 'AUSENTE', 'AUSENTE', 'AUSENTE', 'AUSENTE')
on conflict (alimento_id) do update set fonte = 'TACO_4ED', atualizado_em = now(), vitamina_c = excluded.vitamina_c, calcio = excluded.calcio, ferro = excluded.ferro, zinco = excluded.zinco, magnesio = excluded.magnesio;

-- conferência:
select a.nome, n.* from public.alimento_nutrientes n join public.alimentos a on a.id = n.alimento_id where n.fonte = 'TACO_4ED' order by a.nome;

rollback;  -- trocar por commit; depois de revisar
