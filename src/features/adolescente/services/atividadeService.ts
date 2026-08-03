// src/features/adolescente/services/atividadeService.ts
import { supabase } from '../../../lib/supabase';
import { obterOuCriarRegistroDiario } from '../../../shared/services/registroDiarioService';

export type AtividadeCatalogo = {
  id: string;
  nome: string;
  duracao_padrao_min: number;
};

export type ItemParaRegistrar = {
  nomeAtividade: string;
  duracaoMinutos: number;
};

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase();
}

/** Busca no catálogo, com filtro opcional por termo (pesquisa, ignora acento) */
export async function buscarAtividades(termo: string = ''): Promise<AtividadeCatalogo[]> {
  const { data, error } = await supabase
    .from('atividades')
    .select('id, nome, duracao_padrao_min')
    .order('nome');

  if (error) throw error;
  const todas = data ?? [];

  if (!termo.trim()) return todas;

  const termoNormalizado = normalizar(termo);
  return todas.filter((atividade) => normalizar(atividade.nome).includes(termoNormalizado));
}

export async function registrarAtividades(params: {
  userId: string;
  data: string;
  itens: ItemParaRegistrar[];
}): Promise<void> {
  const { userId, data, itens } = params;
  if (itens.length === 0) return;

  const registroDiarioId = await obterOuCriarRegistroDiario(userId, data);
  const horarioRegistro = new Date().toTimeString().slice(0, 8);

  const linhas = itens.map((item) => ({
    registro_diario_id: registroDiarioId,
    tipo_atividade: item.nomeAtividade,
    duracao_minutos: item.duracaoMinutos,
    horario_registro: horarioRegistro,
  }));

  const { error } = await supabase.from('registros_atividade_fisica').insert(linhas);
  if (error) throw error;
}

export function horarioAgora(): string {
  return new Date().toTimeString().slice(0, 8);
}