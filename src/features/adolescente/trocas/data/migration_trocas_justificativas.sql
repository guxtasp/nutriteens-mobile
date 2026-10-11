-- migration_trocas_justificativas.sql — justificativas específicas das trocas.
-- Roda DEPOIS de migration_trocas.sql e migration_trocas_categorias.sql. Idempotente.
--
--  1. alimento_trocas.dica: passo prático ("como fazer"), mostrado no detalhe da troca.
--  2. trocas_listar() passa a devolver também:
--       dica               -> o texto acima
--       destino_nutrientes -> nutrientes em que o DESTINO é FONTE/ALTO_TEOR (vem de alimento_nutrientes,
--                             então a tela mostra "fonte de cálcio" só quando o dado existe)
--  3. Reescreve frase + dica das trocas do seed (mesma chave: categoria + destino pelo início do nome).
--     A frase agora diz o que aquele destino tem de concreto; "o que muda" em relação ao item de
--     pacote é texto por categoria, no app (CONTEXTO_CATEGORIA).
--
-- ATENÇÃO: é texto educativo. A nutricionista precisa revisar antes de publicar em produção.
begin;

alter table public.alimento_trocas add column if not exists dica text;
alter table public.alimento_trocas drop constraint if exists alimento_trocas_dica_check;
alter table public.alimento_trocas add constraint alimento_trocas_dica_check
  check (dica is null or char_length(dica) between 1 and 220);

-- 2. RPC (muda o tipo de retorno, então precisa recriar) --------------------------
drop function if exists public.trocas_listar(text);
create function public.trocas_listar(p_categoria text default null)
returns table (
  id uuid, categoria text, origem_id uuid, origem_nome text,
  destino_id uuid, destino_nome text, tipos_refeicao text[],
  frase text, rapida boolean, ordem integer,
  destino_acessivel boolean, destino_recente boolean, respondida_recente boolean,
  dica text, destino_nutrientes text[]
) language sql stable security definer set search_path = public as $$
  with eu as (
    select public._ebia_rank(p.classificacao_ebia_atual::text) as rank_ebia
    from public.profiles p where p.id = auth.uid()
  ),
  recentes as (   -- destinos que o aluno registrou nos últimos 30 dias
    select distinct ra.alimento_id
    from public.registros_diarios rd
    join public.refeicoes r on r.registro_diario_id = rd.id
    join public.refeicao_alimentos ra on ra.refeicao_id = r.id
    where rd.user_id = auth.uid() and rd.data >= (now() at time zone 'America/Sao_Paulo')::date - 30
  )
  select t.id, t.categoria, t.origem_id, o.nome, t.destino_id, d.nome,
         t.tipos_refeicao::text[], t.frase, t.rapida, t.ordem,
         coalesce((select rank_ebia from eu) is null
                  or public._ebia_rank(d.nivel_maximo_ebia::text) >= (select rank_ebia from eu), true),
         d.id in (select alimento_id from recentes),
         exists (select 1 from public.troca_respostas tr
                 where tr.user_id = auth.uid() and tr.troca_id = t.id
                   and tr.criado_em > now() - interval '3 days'),
         t.dica,
         coalesce((
           select array_agg(e.key order by e.key)
           from public.alimento_nutrientes n, jsonb_each_text(to_jsonb(n)) e
           where n.alimento_id = d.id
             and e.key in ('proteina','fibra','calcio','ferro','zinco','magnesio','vitamina_a','vitamina_c','vitamina_d')
             and e.value in ('FONTE','ALTO_TEOR')
         ), '{}'::text[])
  from public.alimento_trocas t
  join public.conteudo_fluxo f on f.tipo = 'TROCA' and f.conteudo_id = t.id and f.status = 'PUBLICADO'
  join public.alimentos d on d.id = t.destino_id
  left join public.alimentos o on o.id = t.origem_id
  where auth.uid() is not null and (p_categoria is null or t.categoria = p_categoria)
$$;
revoke all on function public.trocas_listar(text) from public, anon;
grant execute on function public.trocas_listar(text) to authenticated;

-- 3. Frases e dicas -----------------------------------------------------------------
update public.alimento_trocas t
   set frase = v.frase, dica = v.dica, atualizado_em = now()
  from (values
  -- Bebidas
  ('REFRIGERANTE_BEBIDA','Suco natural','A fruta espremida traz a vitamina C e outras vitaminas da própria fruta, coisa que o refrigerante não tem.','Bata a fruta com água e gelo e não coe: fica com mais fibra. Manga, abacaxi e morango bem maduros quase não precisam de açúcar.'),
  ('REFRIGERANTE_BEBIDA','Água de coco','Repõe água e potássio, o mineral que a gente perde no calor e no exercício, e já é naturalmente docinha.','Boa depois da educação física ou do futebol. Prefira a de coco verde ou a 100% natural: algumas de caixinha levam açúcar.'),
  ('REFRIGERANTE_BEBIDA','Água','Mata a sede sem nenhum açúcar. Muitas vezes a vontade de refri é só sede, e beber água ajuda no foco e na concentração.','Ponha rodelas de limão, hortelã ou pedaços de fruta na garrafa pra ganhar sabor. Uma garrafinha na mochila resolve o dia.'),
  ('REFRIGERANTE_BEBIDA','Leite','Entrega cálcio e proteína, que ajudam ossos e músculos justo na fase em que o corpo mais forma massa óssea. Refrigerante não entrega nada disso.','Gelado ou quente, puro ou batido com banana. Se não curte leite puro, iogurte e queijo dão o cálcio do mesmo jeito.'),
  ('REFRIGERANTE_BEBIDA','Limonada','Tem o azedinho e a refrescância do refri, com vitamina C do limão e muito menos açúcar.','Esprema o limão, junte água bem gelada e adoce só se precisar. Água com gás natural e limão lembra bastante o refrigerante.'),
  -- Doces
  ('DOCE','Banana','O açúcar da banana vem junto com fibra e potássio, então a energia dura bem mais do que a de uma bala ou chocolate.','Amassada com aveia e canela vira sobremesa. Congelada e batida no liquidificador, vira um "sorvete" sem açúcar adicionado.'),
  ('DOCE','Fruta','Na fruta inteira, o açúcar vem com fibra e vitaminas. A fibra faz o açúcar chegar mais devagar ao sangue e segura a fome por mais tempo.','Deixe a fruta à vista na mesa e na mochila: quem vê, come. Gelada ou picada com canela fica mais "cara de sobremesa".'),
  ('DOCE','Iogurte','O iogurte natural traz cálcio e proteína, e com fruta picada o doce vem da própria fruta, sem o açúcar do doce de pacote.','Prefira o natural e adoce com banana, morango ou um fio de mel. Os de sabor costumam ter bastante açúcar: confira o rótulo.'),
  ('DOCE','Maçã','A fibra da casca sacia, e o crocante dá a satisfação de "estar comendo algo", parecida com a de um docinho.','Corte em fatias e polvilhe canela, ou passe pasta de amendoim sem açúcar. Coma com casca (bem lavada) para ganhar fibra.'),
  ('DOCE','Mamão','É rico em vitamina C e tem fibras que ajudam o intestino, e já é docinho sem precisar de açúcar nenhum.','Misture com aveia ou iogurte natural. Umas gotas de limão realçam o sabor.'),
  ('DOCE','Castanhas','Têm gordura boa, proteína e minerais como magnésio e zinco, e sustentam a energia sem o sobe e desce do açúcar.','Um punhado pequeno já basta. Misture com uva-passa ou banana-passa para ter o toque doce.'),
  -- Embutidos
  ('EMBUTIDO','Ovo','Tem proteína completa, vitamina D e B12, com bem menos sal e sem os conservantes (nitrito) do presunto e da salsicha.','Cozido, mexido ou em omelete com tomate. Deixe ovo cozido pronto na geladeira para montar o lanche rápido.'),
  ('EMBUTIDO','Queijo','Dá proteína e cálcio na mesma fatia, com menos conservantes do que o presunto. Os frescos, como minas e ricota, têm menos sal.','Fatia de queijo minas com tomate e orégano no pão, ou ricota amassada com cenoura ralada.'),
  ('EMBUTIDO','Frango','É proteína magra feita em casa, onde o sal é com você, enquanto o embutido já vem salgado e com conservante.','Desfie o frango que sobrou do almoço e guarde na geladeira: com tomate e cenoura vira recheio de pão em minutos.'),
  ('EMBUTIDO','Carne','É fonte de ferro e zinco, que ajudam no crescimento e na disposição, e feita em casa tem bem menos sal e aditivos que mortadela ou salsicha.','Aproveite a carne moída refogada do almoço, com cebola e tomate, como recheio do pão no dia seguinte.'),
  ('EMBUTIDO','Feijão','Traz proteína, ferro e fibra e rende muito pelo preço, então segura a fome por mais tempo do que um embutido.','Amasse o feijão temperado e passe no pão com queijo, ou sirva com arroz e um ovo.'),
  -- Lanches
  ('LANCHE','Sanduíche natural','Pão com ovo, queijo ou frango e folhas junta carboidrato, proteína e fibra: um lanche completo que sustenta até a próxima refeição.','Deixe a base pronta de véspera e junte alface e tomate só na hora, para o pão não amolecer.'),
  ('LANCHE','Vitamina de fruta','Junta as vitaminas da fruta com o cálcio e a proteína do leite, e mata a fome e a sede de uma vez.','Bata fruta madura com leite gelado. A banana deixa cremosa e doce sem açúcar; uma colher de aveia deixa mais sustentável.'),
  ('LANCHE','Tapioca','A goma dá energia e, com ovo ou queijo no recheio, ganha proteína. É leve e não pesa no estômago.','Recheios fáceis: queijo com tomate, ovo mexido, ou banana com canela. Na frigideira, leva uns 2 minutos.'),
  ('LANCHE','Pão de queijo','Feito de polvilho e queijo, dá energia e um pouco de cálcio. Assado em casa, você escolhe o que vai na massa.','Faça uma fornada, congele e asse aos poucos. Uma fruta ao lado completa o lanche.'),
  ('LANCHE','Iogurte','Dá cálcio e proteína num lanche que não precisa de preparo, e com fruta e aveia ainda ganha fibra.','Leve em potinho: iogurte natural, fruta picada e uma colher de aveia.'),
  ('LANCHE','Cuscuz','O milho do cuscuz dá energia que dura e, com ovo ou queijo, vira lanche com proteína.','Cozinha rápido no vapor e dá para esquentar depois. Recheie com ovo, queijo ou carne desfiada.'),
  -- Refeições
  ('REFEICAO','Feijão','Arroz e feijão juntos formam uma proteína completa (os aminoácidos de um completam os do outro), com ferro e fibra.','Um pouco de suco de laranja ou limão na refeição ajuda o corpo a absorver o ferro do feijão.'),
  ('REFEICAO','Salada','Folhas e legumes trazem fibra, vitaminas A e C e minerais, e deixam o prato mais colorido e saciante.','Comece pelo que você já gosta (tomate, cenoura ralada, milho) e vá somando folhas. Azeite e limão temperam.'),
  ('REFEICAO','Ovo','O ovo completa o prato com proteína de boa qualidade, vitamina B12 e vitamina D, e fica pronto em 5 minutos.','Mexido, cozido ou frito com pouco óleo. Combine com arroz, feijão e salada.'),
  ('REFEICAO','Macarrão','Com legumes e ovo ou frango, o macarrão deixa de ser só carboidrato e vira refeição com fibra, vitaminas e proteína.','Refogue cenoura, abobrinha ou brócolis com alho e misture ao macarrão. Molho de tomate caseiro leva menos sal que o pronto.'),
  ('REFEICAO','Cuscuz','Cuscuz de milho com ovo e legumes é uma refeição completa, leve e rápida, sem tempero pronto.','Refogue legumes picados, misture ao cuscuz e finalize com ovo. Evite tempero em cubo, que é puro sal.'),
  -- Biscoitos
  ('BISCOITO','Bolo','Bolo caseiro leva ovo, farinha e leite e aceita fruta ou cenoura, com bem menos aditivos e gordura industrial que o biscoito recheado.','Bolo de banana ou de cenoura é fácil. Corte em fatias e congele para ter lanche pronto a semana toda.'),
  ('BISCOITO','Pão de queijo','Também é um lanchinho de pegar com a mão, mas tem queijo (cálcio) e sacia mais que o biscoito, que é basicamente farinha e açúcar.','Assado e quentinho. Se sobrar, congele e esquente no forno ou na airfryer.'),
  ('BISCOITO','Tapioca','É crocante por fora e, com queijo ou fruta no recheio, vira lanche com proteína ou vitaminas, o que o biscoito não oferece.','Salgada com queijo e orégano, ou doce com banana e canela. Leva poucos minutos na frigideira.'),
  ('BISCOITO','Fruta','Traz fibra e vitaminas e enche mais que o biscoito: uma fruta com casca segura a fome por mais tempo.','Banana e maçã vão bem na mochila. Uva e morango lavados cabem num potinho.'),
  ('BISCOITO','Iogurte','Com aveia, o iogurte dá cálcio, proteína e fibra, e a aveia traz o crocante que lembra o biscoito.','Iogurte natural, aveia e banana picada. Granola caseira (aveia, canela e um fio de mel assados) também vale.'),
  -- Salgadinhos
  ('SALGADINHO','Pipoca','Pipoca é milho inteiro: tem fibra e é crocante como o salgadinho, mas feita em casa o sal fica na sua mão.','Estoure no micro-ondas num saco de papel ou na panela com pouquíssimo óleo e tempere com orégano ou um pouco de queijo ralado.'),
  ('SALGADINHO','Castanhas','São crocantes, com gordura boa, proteína e magnésio. Um punhado sacia mais que o salgadinho, que é basicamente amido e sal.','Prefira sem sal e sem tempero. Misture com passas para um lanche de bolso.'),
  ('SALGADINHO','Pão de queijo','É salgado de verdade, quentinho e com queijo (cálcio): dá a sensação de ter comido algo e sacia mais.','Assado em casa ou comprado fresco. Combine com uma fruta ou um iogurte para completar.'),
  ('SALGADINHO','Mandioca','Assada em tirinhas lembra batata frita, mas é feita no forno, com pouca gordura e sal, e tem fibra.','Cozinhe a mandioca, corte em palitos, regue com um fio de azeite e asse até dourar. Salgue pouco.')
) as v(categoria, destino, frase, dica)
join lateral (select a.id from public.alimentos a where a.nome ilike v.destino || '%' order by length(a.nome) limit 1) d on true
where t.categoria = v.categoria and t.destino_id = d.id and t.origem_id is null;

commit;

-- conferir (deve ser 0 = nenhuma troca do seed ficou sem dica):
-- select categoria, count(*) from public.alimento_trocas where dica is null group by 1;
