// src/shared/offline/executoresOffline.ts
// Liga cada tipo de operação da fila ao serviço que realmente grava no Supabase.
// Fica separado do sincronizador para ele poder ser testado sem rede.
import { inserirRegistroAgua } from '../../features/adolescente/agua/services/aguaService';
import { registrarAtividades } from '../../features/adolescente/atividade-fisica/services/atividadeService';
import { registrarRefeicao } from '../../features/adolescente/alimentacao/services/alimentacaoService';
import { concluirLicaoComProgresso } from '../../features/adolescente/trilha/services/trilhaService';
import type { Executores } from './sincronizador';

export function criarExecutores(userId: string): Executores {
  return {
    AGUA: (op) =>
      inserirRegistroAgua({
        userId,
        data: op.payload.dataISO,
        quantidadeMl: op.payload.quantidadeMl,
        horario: op.payload.horario,
      }),

    ATIVIDADE: (op) =>
      registrarAtividades({
        userId,
        data: op.payload.dataISO,
        itens: op.payload.itens,
      }),

    // Mesmo caminho da conclusão online. Se o servidor já tinha o progresso (reenvio),
    // não concede XP de novo; a navegação/celebração é descartada (o usuário já saiu da tela).
    LICAO: async (op) => {
      await concluirLicaoComProgresso(
        userId,
        op.payload.licaoId,
        op.payload.xpRecompensa,
        op.payload.acertos,
        op.payload.totalQuestoes,
      );
    },

    // O feedback da refeição (qualidade, troca sugerida) é gerado no envio e
    // guardado no banco, mas não é mostrado agora: o adolescente já saiu da tela.
    REFEICAO: async (op) => {
      await registrarRefeicao({
        userId,
        dataISO: op.payload.dataISO,
        tipo: op.payload.tipoRefeicao,
        itens: op.payload.itens,
        horario: op.payload.horario,
      });
    },
  };
}
