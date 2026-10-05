// src/features/adolescente/social/hooks/useAmizades.ts
//
// Estado e ações de amizade para a tela Social. A tela só chama estas funções
// e mostra o que voltar — nenhuma regra mora na tela.
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import {
  buscarPerfilPorCodigo,
  enviarPedidoAmizade,
  listarAmizades,
  removerAmizade,
  responderPedidoAmizade,
  PerfilEncontrado,
} from '../services/amizadeService';
import {
  AmizadesSeparadas,
  ResultadoPedido,
  mensagemResultadoPedido,
  separarAmizades,
} from '../utils/amizades';

const VAZIO: AmizadesSeparadas = { amigos: [], recebidos: [], enviados: [] };

export function useAmizades() {
  const { userId } = useAuth();
  const [amizades, setAmizades] = useState<AmizadesSeparadas>(VAZIO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    try {
      const linhas = await listarAmizades();
      setAmizades(separarAmizades(linhas));
      setErro(null);
    } catch {
      setErro('Não deu para carregar seus amigos agora. Tente de novo daqui a pouco.');
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  /** Pré-visualiza quem tem aquele código antes de mandar o pedido. */
  const buscar = useCallback((codigo: string): Promise<PerfilEncontrado | null> => {
    return buscarPerfilPorCodigo(codigo);
  }, []);

  /** Devolve o resultado e uma mensagem pronta para mostrar. */
  const enviarPedido = useCallback(
    async (codigo: string, nome?: string): Promise<{ resultado: ResultadoPedido; mensagem: string }> => {
      try {
        const resultado = await enviarPedidoAmizade(codigo);
        if (resultado === 'enviado' || resultado === 'aceito_automaticamente') await recarregar();
        return { resultado, mensagem: mensagemResultadoPedido(resultado, nome) };
      } catch {
        return { resultado: 'codigo_invalido', mensagem: 'Algo deu errado. Tente de novo daqui a pouco.' };
      }
    },
    [recarregar]
  );

  const aceitar = useCallback(
    async (amizadeId: string) => {
      const ok = await responderPedidoAmizade(amizadeId, true);
      await recarregar();
      return ok;
    },
    [recarregar]
  );

  const recusar = useCallback(
    async (amizadeId: string) => {
      const ok = await responderPedidoAmizade(amizadeId, false);
      await recarregar();
      return ok;
    },
    [recarregar]
  );

  /** Desfaz amizade ou cancela um pedido que você enviou. */
  const remover = useCallback(
    async (amizadeId: string) => {
      const ok = await removerAmizade(amizadeId);
      await recarregar();
      return ok;
    },
    [recarregar]
  );

  return {
    amigos: amizades.amigos,
    pedidosRecebidos: amizades.recebidos,
    pedidosEnviados: amizades.enviados,
    carregando,
    erro,
    recarregar,
    buscar,
    enviarPedido,
    aceitar,
    recusar,
    remover,
  };
}
