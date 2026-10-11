-- SÓ PARA TESTE: publica todas as trocas em rascunho para você ver no app.
-- Em produção, quem publica é a nutricionista (Fase 2 traz o painel).
update public.conteudo_fluxo
   set status = 'PUBLICADO', publicado_em = now(), atualizado_em = now()
 where tipo = 'TROCA' and status <> 'PUBLICADO';

-- conferir:
-- select t.categoria, d.nome from alimento_trocas t join alimentos d on d.id=t.destino_id
--   join conteudo_fluxo f on f.tipo='TROCA' and f.conteudo_id=t.id and f.status='PUBLICADO' order by 1,2;
