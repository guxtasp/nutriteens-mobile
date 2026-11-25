// src/features/legal/services/consentimentoService.ts
//
// Acesso à tabela `consentimentos` para o reaceite dos termos. Usa só as colunas que o app já
// grava no cadastro (useSignup / CompletarCadastroScreen): id, user_id, aceite_termos,
// versao_termo, conteudo. Não dependemos de uma coluna de data (ela não está nos .sql do
// repositório): em vez de "o mais recente é da versão atual?", perguntamos "existe aceite da
// versão atual?", que dá a mesma resposta sem supor o nome da coluna.
import { supabase } from '../../../lib/supabase';
import { CONTEUDO_CONSENTIMENTO, VERSAO_TERMOS } from '../data/textosLegais';

/** true se a pessoa já aceitou `versao` alguma vez. */
export async function jaAceitouVersao(userId: string, versao: string = VERSAO_TERMOS): Promise<boolean> {
  const { count, error } = await supabase
    .from('consentimentos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('versao_termo', versao);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Grava um novo aceite (uma linha por versão aceita; o histórico das anteriores fica). */
export async function registrarAceiteTermos(userId: string): Promise<void> {
  const { error } = await supabase.from('consentimentos').insert({
    user_id: userId,
    aceite_termos: true,
    versao_termo: VERSAO_TERMOS,
    conteudo: CONTEUDO_CONSENTIMENTO,
  });
  if (error) throw error;
}
