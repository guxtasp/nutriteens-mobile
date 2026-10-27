// src/shared/offline/filaOffline.ts
// Fila persistente (AsyncStorage) de registros feitos sem internet. Cada usuário
// tem a sua fila, para que dois adolescentes no mesmo aparelho nunca misturem dados.
//
// Só entram aqui REGISTROS de hábito (água, atividade física, refeição): são as
// ações do dia a dia que não podem se perder. Cadastros, amizades, login etc.
// continuam exigindo internet.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TipoRefeicao, Alimento } from '../../features/adolescente/alimentacao/services/alimentacaoService';

export const MAX_TENTATIVAS = 5;

type Base = {
  id: string;
  /** ms desde 1970, quando o usuário tocou em "registrar" */
  criadoEm: number;
  /** falhas que NÃO foram de rede (o servidor recusou) */
  tentativas: number;
};

export type OperacaoAgua = Base & {
  tipo: 'AGUA';
  payload: { dataISO: string; horario: string; quantidadeMl: number };
};

export type OperacaoAtividade = Base & {
  tipo: 'ATIVIDADE';
  payload: { dataISO: string; itens: { nomeAtividade: string; duracaoMinutos: number; horarioRegistro: string }[] };
};

export type OperacaoRefeicao = Base & {
  tipo: 'REFEICAO';
  payload: { dataISO: string; horario: string; tipoRefeicao: TipoRefeicao; itens: { alimento: Alimento; quantidade: number }[] };
};

export type OperacaoOffline = OperacaoAgua | OperacaoAtividade | OperacaoRefeicao;

/** Dados que o chamador informa; id/criadoEm/tentativas são da fila. */
export type NovaOperacao =
  | Pick<OperacaoAgua, 'tipo' | 'payload'>
  | Pick<OperacaoAtividade, 'tipo' | 'payload'>
  | Pick<OperacaoRefeicao, 'tipo' | 'payload'>;

const chaveDaFila = (userId: string) => `nt:offline:fila:${userId}`;

// Leitura-modificação-escrita em série: dois toques rápidos não podem se atropelar.
let trava: Promise<unknown> = Promise.resolve();
function emSerie<T>(tarefa: () => Promise<T>): Promise<T> {
  const proxima = trava.then(tarefa, tarefa);
  trava = proxima.catch(() => undefined);
  return proxima;
}

async function ler(userId: string): Promise<OperacaoOffline[]> {
  try {
    const bruto = await AsyncStorage.getItem(chaveDaFila(userId));
    if (!bruto) return [];
    const lista = JSON.parse(bruto);
    return Array.isArray(lista) ? (lista as OperacaoOffline[]) : [];
  } catch {
    return [];
  }
}

async function gravar(userId: string, lista: OperacaoOffline[]): Promise<void> {
  await AsyncStorage.setItem(chaveDaFila(userId), JSON.stringify(lista));
}

function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function lerFila(userId: string): Promise<OperacaoOffline[]> {
  return emSerie(() => ler(userId));
}

export function enfileirar(userId: string, nova: NovaOperacao): Promise<OperacaoOffline> {
  return emSerie(async () => {
    const fila = await ler(userId);
    const op = { ...nova, id: novoId(), criadoEm: Date.now(), tentativas: 0 } as OperacaoOffline;
    fila.push(op);
    await gravar(userId, fila);
    return op;
  });
}

export function removerOperacao(userId: string, id: string): Promise<void> {
  return emSerie(async () => {
    const fila = await ler(userId);
    await gravar(userId, fila.filter((op) => op.id !== id));
  });
}

export function registrarFalhaDeServidor(userId: string, id: string): Promise<void> {
  return emSerie(async () => {
    const fila = await ler(userId);
    await gravar(userId, fila.map((op) => (op.id === id ? { ...op, tentativas: op.tentativas + 1 } : op)));
  });
}

/** Operações que ainda vale tentar enviar, na ordem em que o usuário as fez. */
export function pendentesParaEnviar(fila: OperacaoOffline[]): OperacaoOffline[] {
  return fila.filter((op) => op.tentativas < MAX_TENTATIVAS).sort((a, b) => a.criadoEm - b.criadoEm);
}

/** Operações que o servidor recusou várias vezes: ficam guardadas, mas não travam a fila. */
export function comProblema(fila: OperacaoOffline[]): OperacaoOffline[] {
  return fila.filter((op) => op.tentativas >= MAX_TENTATIVAS);
}

/** Soma de ml de água ainda não enviados para a data — o app soma ao total do servidor. */
export function aguaPendenteMl(fila: OperacaoOffline[], dataISO: string): number {
  return fila.reduce(
    (soma, op) => (op.tipo === 'AGUA' && op.payload.dataISO === dataISO ? soma + op.payload.quantidadeMl : soma),
    0
  );
}
