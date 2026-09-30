-- src/features/adolescente/trilha/data/migration_formato_exercicios.sql
--
-- Suporte aos formatos de exercício combinados no modelo-pedagogico-trilha.md
-- (múltipla escolha, verdadeiro/falso, complete a frase, e reservado pra
-- ordene/associe/classifique, que ainda não têm UI implementada). Nenhuma
-- tabela nova — só 3 colunas, pra não precisar de migration de novo a cada
-- formato futuro.

alter table public.questoes_quiz
  add column if not exists formato text not null default 'multipla_escolha';

alter table public.questoes_quiz
  add column if not exists dados_extra jsonb not null default '{}'::jsonb;

alter table public.opcoes_quiz
  add column if not exists categoria text; -- só usado pelo formato "classifique" (ainda sem UI)

-- Convenção pro formato "completar": o enunciado carrega o token literal
-- "{lacuna}" no lugar da lacuna (ex.: "Lorem {lacuna} dolor sit amet"), e
-- opcoes_quiz vira o banco de palavras (texto + qual delas é `correta`).
-- Não precisa de coluna nova pra isso — só essa convenção de conteúdo.

comment on column public.questoes_quiz.formato is
  'multipla_escolha | verdadeiro_falso | completar | ordene | associe | classifique';
