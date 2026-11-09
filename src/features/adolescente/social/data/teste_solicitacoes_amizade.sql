-- TESTE (não é migration): cria pessoas de mentira para testar a aba Turma.
-- Rode no SQL Editor do Supabase (role postgres). Tudo fica marcado com o e-mail @teste.nutriteens
-- e a PARTE 3 apaga tudo. Não toca em usuários reais.
--
-- 1) troque o e-mail abaixo pelo da SUA conta de teste
-- 2) rode a PARTE 1 (criar) e abra o app: puxe a tela para atualizar
-- 3) quando terminar, rode a PARTE 3 (limpar)

-- ============================== PARTE 1: CRIAR ==============================
do $$
declare
  v_meu_email text := 'SEU_EMAIL_AQUI@exemplo.com';   -- <<< TROQUE
  v_eu uuid;
  v_id uuid;
  v_nome text;
  v_i int := 0;
  -- 4 pedidos recebidos, 2 enviados, 36 amigos (36 > 30 testa a 2ª página da lista)
  v_recebidos text[] := array['Lia','Marcos','Carol','Davi'];
  v_enviados  text[] := array['Nando','Sofia'];
  v_amigos    text[] := array['Alice','André','AnaJulia','Bia','Breno','Caio','Clara','Duda','Edu','Fabi',
    'Gabi','Hugo','Igor','Isa','Joao','Julia','Kaka','Lara','Leo','Livia','Lucas','Maju','Mel','Nina',
    'Otavio','Paulo','Rafa','Rita','Sara','Theo','Vini','Yasmin','Zeca','Bruna','Dani','Fefe'];
  v_papel text;
begin
  select id into v_eu from auth.users where email = v_meu_email;
  if v_eu is null then raise exception 'Não achei a conta %. Confira o e-mail.', v_meu_email; end if;
  if not exists (select 1 from public.profiles where id = v_eu and apelido is not null) then
    raise exception 'Escolha seu apelido na aba Turma antes de rodar o teste.';
  end if;

  foreach v_nome in array (v_recebidos || v_enviados || v_amigos) loop
    v_i := v_i + 1;
    v_id := gen_random_uuid();

    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            lower(v_nome) || v_i || '@teste.nutriteens', '', now(),
            '{"provider":"email","providers":["email"]}', '{}', now(), now());

    -- se existir trigger que cria o profile, só atualiza; senão cria
    insert into public.profiles (id) values (v_id) on conflict (id) do nothing;
    update public.profiles
       set apelido = v_nome,
           avatar_social = (array['supercontente','orgulhoso','curioso','calmo','pensando','surpreso'])[1 + v_i % 6],
           -- metade dos amigos já cumpriu o dia hoje (anel verde + chama)
           ultimo_dia_mantido = case when v_i % 2 = 0 then (now() at time zone 'America/Sao_Paulo')::date else null end
     where id = v_id;

    if v_nome = any (v_recebidos) then
      insert into public.amizades (solicitante_id, destinatario_id, status, criado_em)
      values (v_id, v_eu, 'pendente', now() - (v_i || ' hours')::interval);
    elsif v_nome = any (v_enviados) then
      insert into public.amizades (solicitante_id, destinatario_id, status, criado_em)
      values (v_eu, v_id, 'pendente', now() - (v_i || ' days')::interval);
    else
      -- amizades aceitas em datas diferentes (testa o filtro "Mais recentes")
      insert into public.amizades (solicitante_id, destinatario_id, status, criado_em, respondido_em)
      values (v_id, v_eu, 'aceita', now() - (v_i || ' days')::interval, now() - (v_i || ' days')::interval);
    end if;
  end loop;

  raise notice 'Pronto: 4 pedidos recebidos, 2 enviados e 36 amigos para %.', v_meu_email;
end $$;

-- ====================== PARTE 2: CONFERIR (opcional) ========================
-- select status, count(*) from public.amizades a
--   join public.profiles p on p.id in (a.solicitante_id, a.destinatario_id)
--   join auth.users u on u.id = p.id and u.email like '%@teste.nutriteens'
--  group by status;

-- =============================== PARTE 3: LIMPAR ============================
-- Descomente e rode quando terminar (as amizades somem junto: on delete cascade).
-- delete from auth.users where email like '%@teste.nutriteens';
