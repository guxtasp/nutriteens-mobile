// src/shared/offline/conexao.ts
//
// Estado de conexão com o servidor, sem biblioteca nativa (não exige nova build).
// "Online" = o servidor respondeu a uma sonda leve (qualquer resposta HTTP conta).
// Sem RN aqui dentro de propósito: o lib/supabase.ts importa este módulo.
type Ouvinte = () => void;

const URL_BASE = process.env.EXPO_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const TIMEOUT_SONDA_MS = 4_000;

let online = true; // otimista até a primeira sonda: não bloqueia o início do app
let sondando: Promise<boolean> | null = null;
const ouvintes = new Set<Ouvinte>();

export function estaOnline(): boolean {
  return online;
}

export function assinarConexao(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function definirOnline(valor: boolean): void {
  if (valor === online) return;
  online = valor;
  ouvintes.forEach((o) => o());
}

async function sondarServidor(): Promise<boolean> {
  if (!URL_BASE) return true;
  const controle = new AbortController();
  const temporizador = setTimeout(() => controle.abort(), TIMEOUT_SONDA_MS);
  try {
    // fetch global (sem o wrapper do Supabase), senão a sonda falharia junto com o resto
    await fetch(`${URL_BASE}/auth/v1/health`, {
      method: 'GET',
      headers: CHAVE ? { apikey: CHAVE } : undefined,
      signal: controle.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(temporizador);
  }
}

/** Testa o servidor agora e atualiza o estado. Chamadas simultâneas dividem a mesma sonda. */
export function verificarConexao(sonda: () => Promise<boolean> = sondarServidor): Promise<boolean> {
  if (sondando) return sondando;
  sondando = sonda()
    .then((ok) => {
      definirOnline(ok);
      return ok;
    })
    .finally(() => {
      sondando = null;
    });
  return sondando;
}
