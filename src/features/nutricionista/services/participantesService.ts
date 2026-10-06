// src/features/nutricionista/services/participantesService.ts
// Participantes (adolescentes) para a nutricionista. Funções do banco checam o papel e
// devolvem só o necessário para o acompanhamento profissional.
import { supabase } from '../../../lib/supabase';

export type ClassificacaoEbia = 'SEGURANCA_ALIMENTAR' | 'INSEGURANCA_LEVE' | 'INSEGURANCA_MODERADA' | 'INSEGURANCA_GRAVE';

export const EBIA_LABEL: Record<string, string> = {
  SEGURANCA_ALIMENTAR: 'Segurança alimentar',
  INSEGURANCA_LEVE: 'Insegurança leve',
  INSEGURANCA_MODERADA: 'Insegurança moderada',
  INSEGURANCA_GRAVE: 'Insegurança grave',
};

export interface Participante {
  id: string;
  nome: string | null;
  apelido: string | null;
  codigoParticipante: string | null;
  idade: number | null;
  instituicaoEnsino: string | null;
  tipoInstituicao: string | null;
  etapaOnboarding: string | null;
  classificacaoEbia: string | null;
  sequenciaAtual: number;
  xpTotal: number;
  ultimoAcesso: string | null;
  criadoEm: string | null;
}

export async function listarParticipantes(p: {
  busca?: string;
  ebia?: string | null;
  ordem?: string;
  limite?: number;
  offset?: number;
}): Promise<{ itens: Participante[]; total: number }> {
  const { data, error } = await supabase.rpc('painel_participantes_listar', {
    p_busca: p.busca?.trim() || null,
    p_ebia: p.ebia ?? null,
    p_ordem: p.ordem ?? 'recentes',
    p_limite: p.limite ?? 25,
    p_offset: p.offset ?? 0,
  });
  if (error) throw error;
  const linhas = (data ?? []) as any[];
  return {
    total: linhas.length > 0 ? Number(linhas[0].total) : 0,
    itens: linhas.map((r) => ({
      id: r.id,
      nome: r.nome,
      apelido: r.apelido,
      codigoParticipante: r.codigo_participante,
      idade: r.idade,
      instituicaoEnsino: r.instituicao_ensino,
      tipoInstituicao: r.tipo_instituicao,
      etapaOnboarding: r.etapa_onboarding,
      classificacaoEbia: r.classificacao_ebia,
      sequenciaAtual: r.sequencia_atual ?? 0,
      xpTotal: r.xp_total ?? 0,
      ultimoAcesso: r.ultimo_acesso,
      criadoEm: r.criado_em,
    })),
  };
}

export type DiaRegistro = { data: string; aguaMl: number; atividadeMin: number; refeicoes: number };

export interface DetalheParticipante extends Participante {
  genero: string | null;
  pesoKg: number | null;
  alturaCm: number | null;
  maiorSequencia: number;
  faseAtual: string | null;
  licoesConcluidas: number;
  insignias: number;
  ebia: { pontuacaoTotal: number | null; classificacao: string | null; dataRealizacao: string } | null;
  recordatorios: { dataReferencia: string; concluido: boolean; escoreSaudavel: number | null; escoreNaoSaudavel: number | null }[];
  ultimos14Dias: DiaRegistro[];
}

export async function buscarParticipante(id: string): Promise<DetalheParticipante> {
  const { data, error } = await supabase.rpc('painel_participante_detalhe', { p_id: id });
  if (error) throw error;
  const r: any = data;
  return {
    id: r.id,
    nome: r.nome,
    apelido: r.apelido,
    codigoParticipante: r.codigo_participante,
    idade: r.idade,
    instituicaoEnsino: r.instituicao_ensino,
    tipoInstituicao: r.tipo_instituicao,
    etapaOnboarding: r.etapa_onboarding,
    classificacaoEbia: r.classificacao_ebia_atual,
    sequenciaAtual: r.sequencia_atual ?? 0,
    xpTotal: r.xp_total ?? 0,
    ultimoAcesso: r.ultimo_acesso,
    criadoEm: r.criado_em,
    genero: r.genero,
    pesoKg: r.peso_kg != null ? Number(r.peso_kg) : null,
    alturaCm: r.altura_cm != null ? Number(r.altura_cm) : null,
    maiorSequencia: r.maior_sequencia ?? 0,
    faseAtual: r.fase_atual,
    licoesConcluidas: Number(r.licoes_concluidas ?? 0),
    insignias: Number(r.insignias ?? 0),
    ebia: r.ebia
      ? { pontuacaoTotal: r.ebia.pontuacao_total, classificacao: r.ebia.classificacao, dataRealizacao: r.ebia.data_realizacao }
      : null,
    recordatorios: (r.recordatorios ?? []).map((x: any) => ({
      dataReferencia: x.data_referencia,
      concluido: !!x.concluido,
      escoreSaudavel: x.escore_saudavel,
      escoreNaoSaudavel: x.escore_nao_saudavel,
    })),
    ultimos14Dias: (r.ultimos_14_dias ?? []).map((x: any) => ({
      data: x.data,
      aguaMl: Number(x.agua_ml ?? 0),
      atividadeMin: Number(x.atividade_min ?? 0),
      refeicoes: Number(x.refeicoes ?? 0),
    })),
  };
}

/** IMC só quando há peso e altura plausíveis. */
export function calcularImc(pesoKg: number | null, alturaCm: number | null): number | null {
  if (!pesoKg || !alturaCm || alturaCm < 80) return null;
  const m = alturaCm / 100;
  return Math.round((pesoKg / (m * m)) * 10) / 10;
}
