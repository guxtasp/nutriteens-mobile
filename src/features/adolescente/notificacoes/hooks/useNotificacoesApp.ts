// src/features/adolescente/notificacoes/hooks/useNotificacoesApp.ts
//
// Junta as fontes da Central (amizades, Chama em Dupla e missões), marca o que
// já foi lido e expõe as ações de leitura. Cada fonte falha sozinha: se uma não
// carregar, as outras continuam aparecendo.
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useMissoes } from '../../missoes/hooks/useMissoes';
import { listarSolicitacoes } from '../../social/services/socialService';
import { listarChamasDupla } from '../../social/services/chamaDuplaService';
import { listarReceitasRecebidas } from '../../social/services/receitaCompartilhadaService';
import type { ReceitaRecebida } from '../../social/utils/receitaCompartilhada';
import type { ChamaDupla } from '../../social/utils/chamaDupla';
import { carregarLidas, salvarLidas } from '../services/lidasStorage';
import { aplicarLeitura, contarNaoLidas, montarNotificacoesApp, type PedidoRecebido } from '../utils/notificacoesApp';

export function useNotificacoesApp() {
  const { userId } = useAuth();
  const missoes = useMissoes(); // já recarrega ao focar a tela
  const [chamas, setChamas] = useState<ChamaDupla[]>([]);
  const [pedidos, setPedidos] = useState<PedidoRecebido[]>([]);
  const [receitas, setReceitas] = useState<ReceitaRecebida[]>([]);
  const [lidas, setLidas] = useState<ReadonlySet<string>>(new Set());
  const [carregandoSocial, setCarregandoSocial] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let ativo = true;
      (async () => {
        const [c, p, l, r] = await Promise.allSettled([
          listarChamasDupla(),
          listarSolicitacoes(),
          carregarLidas(userId),
          listarReceitasRecebidas(),
        ]);
        if (!ativo) return;
        setChamas(c.status === 'fulfilled' ? c.value : []);
        setPedidos(
          p.status === 'fulfilled'
            ? p.value.filter((s) => s.direcao === 'recebida').map((s) => ({ amizadeId: s.amizadeId, apelido: s.apelido }))
            : []
        );
        setReceitas(r.status === 'fulfilled' ? r.value : []);
        if (l.status === 'fulfilled') setLidas(l.value);
        setCarregandoSocial(false);
      })();
      return () => {
        ativo = false;
      };
    }, [userId])
  );

  const todas = useMemo(
    () =>
      montarNotificacoesApp({
        chamas,
        pedidosRecebidos: pedidos,
        receitasRecebidas: receitas,
        missoes: {
          diaria: missoes.hoje.dados
            ? { titulo: missoes.hoje.dados.missao.titulo, concluida: missoes.hoje.dados.progresso.concluida }
            : null,
          semanais: (missoes.semana.dados?.missoes ?? []).map((m) => ({ titulo: m.def.titulo, concluida: m.progresso.concluida })),
          mensais: (missoes.mes.dados?.missoes ?? []).map((m) => ({ titulo: m.def.titulo, concluida: m.progresso.concluida })),
        },
        agora: new Date(),
      }),
    [chamas, pedidos, receitas, missoes.hoje.dados, missoes.semana.dados, missoes.mes.dados]
  );

  const notificacoes = useMemo(() => aplicarLeitura(todas, lidas), [todas, lidas]);
  const naoLidas = contarNaoLidas(notificacoes);

  const marcarLidas = useCallback(
    (ids: string[]) => {
      if (!userId || ids.length === 0) return;
      setLidas((atual) => {
        const novo = new Set(atual);
        ids.forEach((id) => novo.add(id));
        void salvarLidas(userId, novo);
        return novo;
      });
    },
    [userId]
  );

  const marcarTodasLidas = useCallback(() => marcarLidas(todas.map((n) => n.id)), [marcarLidas, todas]);

  return {
    notificacoes,
    naoLidas,
    carregando: carregandoSocial || missoes.hoje.carregando,
    marcarLida: (id: string) => marcarLidas([id]),
    marcarTodasLidas,
  };
}
