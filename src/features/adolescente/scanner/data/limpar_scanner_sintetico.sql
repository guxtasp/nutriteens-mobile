-- limpar_scanner_sintetico.sql — apaga TODOS os dados sintéticos do scanner criados por seed_scanner_sintetico.sql.
-- Só mexe em códigos de barras que começam com 79990000 (prefixo reservado ao teste). Dados reais não são tocados.
-- Rodar no SQL Editor do Supabase.
begin;

delete from public.scanner_solicitacoes where codigo_barras like '79990000%';   -- pedidos associados saem por cascade
delete from public.produtos_scanner     where codigo_barras like '79990000%';

commit;

-- Conferência: as duas consultas devem voltar 0.
-- select count(*) from public.produtos_scanner     where codigo_barras like '79990000%';
-- select count(*) from public.scanner_solicitacoes where codigo_barras like '79990000%';
