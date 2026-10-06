// src/shared/analytics/analytics.ts
// Registro de eventos de utilização. Regras:
//  - nunca lança erro nem bloqueia a tela (fire-and-forget);
//  - só ids de conteúdo em `props` — nada de texto livre ou dado pessoal;
//  - o banco carimba data e dono (eventos_app) e só aceita inserção do próprio usuário.
import { supabase } from '../../lib/supabase';

export const EVENTOS = [
  'login', 'cadastro_concluido', 'onboarding_concluido', 'triagem_concluida',
  'alimentacao_registrada', 'agua_registrada', 'atividade_registrada',
  'desafio_visualizado', 'desafio_iniciado', 'desafio_concluido',
  'trilha_visualizada', 'trilha_iniciada', 'trilha_concluida', 'licao_concluida',
  'receita_visualizada', 'receita_concluida',
  'amizade_solicitada', 'amizade_aceita', 'conteudo_abandonado',
] as const;
export type NomeEvento = (typeof EVENTOS)[number];

/** Só tipos simples e curtos; o resto é descartado antes de sair do aparelho. */
export type PropsEvento = Record<string, string | number | boolean>;

const INATIVIDADE_MS = 30 * 60 * 1000;

function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Sessão nova se passou 30 min sem atividade. Pura, para teste. */
export function sessaoExpirou(ultimaAtividade: number, agora: number, limiteMs = INATIVIDADE_MS): boolean {
  return agora - ultimaAtividade > limiteMs;
}

export function limparProps(props?: PropsEvento): PropsEvento {
  const saida: PropsEvento = {};
  if (!props) return saida;
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'string') saida[k] = v.slice(0, 80);
    else if (typeof v === 'number' || typeof v === 'boolean') saida[k] = v;
  }
  return saida;
}

let sessaoId = novoId();
let ultimaAtividade = Date.now();
let loginRegistradoNaSessao: string | null = null;

function sessaoAtual(): string {
  const agora = Date.now();
  if (sessaoExpirou(ultimaAtividade, agora)) {
    sessaoId = novoId();
    loginRegistradoNaSessao = null;
  }
  ultimaAtividade = agora;
  return sessaoId;
}

export function registrarEvento(nome: NomeEvento, props?: PropsEvento, opcoes: { userId?: string } = {}): void {
  void enviar(nome, props, opcoes.userId);
}

async function enviar(nome: NomeEvento, props: PropsEvento | undefined, userIdInformado?: string) {
  try {
    const sessao = sessaoAtual();
    if (nome === 'login') {
      if (loginRegistradoNaSessao === sessao) return; // uma vez por sessão
      loginRegistradoNaSessao = sessao;
    }
    let userId = userIdInformado;
    if (!userId) {
      const { data } = await supabase.auth.getSession();
      userId = data.session?.user.id;
    }
    if (!userId) return;
    const { error } = await supabase
      .from('eventos_app')
      .insert({ user_id: userId, nome, sessao_id: sessao, props: limparProps(props) });
    if (error && __DEV__) console.debug('[analytics]', nome, error.message);
  } catch (e) {
    if (__DEV__) console.debug('[analytics] falhou', nome, e);
  }
}
