// src/shared/offline/sincronizador.ts
// Esvazia a fila offline do usuário, em ordem. Regras:
//  - erro de REDE: para na hora (as próximas também falhariam) e tenta depois;
//  - erro do SERVIDOR: conta uma tentativa e segue para a próxima, para uma
//    operação ruim nunca prender as outras;
//  - uma operação só sai da fila depois que o servidor confirmou.
import { ehErroDeRede } from './erroRede';
import {
  lerFila,
  pendentesParaEnviar,
  comProblema,
  registrarFalhaDeServidor,
  removerOperacao,
  type OperacaoOffline,
} from './filaOffline';

export type Executores = { [T in OperacaoOffline['tipo']]: (op: Extract<OperacaoOffline, { tipo: T }>) => Promise<void> };

export type ResultadoSync = {
  enviadas: number;
  restantes: number;
  comProblema: number;
  parouPorRede: boolean;
};

let emAndamento: Promise<ResultadoSync> | null = null;

/** Chamadas simultâneas (voltar ao app + timer) compartilham a mesma rodada: nada é enviado duas vezes. */
export function sincronizarFila(userId: string, executores: Executores): Promise<ResultadoSync> {
  if (emAndamento) return emAndamento;
  emAndamento = rodar(userId, executores).finally(() => {
    emAndamento = null;
  });
  return emAndamento;
}

async function rodar(userId: string, executores: Executores): Promise<ResultadoSync> {
  const fila = await lerFila(userId);
  let enviadas = 0;
  let parouPorRede = false;

  for (const op of pendentesParaEnviar(fila)) {
    try {
      await (executores[op.tipo] as (o: OperacaoOffline) => Promise<void>)(op);
      await removerOperacao(userId, op.id);
      enviadas += 1;
    } catch (erro) {
      if (ehErroDeRede(erro)) {
        parouPorRede = true;
        break;
      }
      await registrarFalhaDeServidor(userId, op.id);
    }
  }

  const depois = await lerFila(userId);
  return {
    enviadas,
    restantes: pendentesParaEnviar(depois).length,
    comProblema: comProblema(depois).length,
    parouPorRede,
  };
}
