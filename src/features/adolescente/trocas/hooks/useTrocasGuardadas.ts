// src/features/adolescente/trocas/hooks/useTrocasGuardadas.ts
//
// "Minhas ideias pra testar" e o "Testei?": junta as respostas do adolescente com as trocas
// publicadas e com os adiamentos ("me lembra amanhã") guardados no aparelho. Recarrega quando a
// tela volta ao foco. Falha em silêncio (lista vazia): é um extra, nunca pode quebrar a tela.
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import {
  lerAdiamentosTestei,
  listarMinhasRespostas,
  listarTrocas,
  salvarAdiamentosTestei,
} from '../services/trocasService';
import {
  adiarAteAmanha,
  diasDesde,
  limparAdiamentos,
  trocasGuardadas,
  trocasParaPerguntar,
} from '../utils/avaliacaoTrocas';
import type { Troca } from '../utils/trocas';

export type TrocaGuardadaCompleta = { troca: Troca; guardadaEm: string; dias: number };

export function useTrocasGuardadas() {
  const { userId } = useAuth();
  const [trocas, setTrocas] = useState<Troca[]>([]);
  const [guardadas, setGuardadas] = useState<TrocaGuardadaCompleta[]>([]);
  const [paraPerguntar, setParaPerguntar] = useState<TrocaGuardadaCompleta[]>([]);
  const [carregado, setCarregado] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    try {
      const [lista, respostas, adiamentosSalvos] = await Promise.all([
        listarTrocas(),
        listarMinhasRespostas(),
        lerAdiamentosTestei(userId),
      ]);
      const agora = new Date();
      const porId = new Map(lista.map((t) => [t.id, t]));
      const completar = (g: { trocaId: string; guardadaEm: string }): TrocaGuardadaCompleta | null => {
        const troca = porId.get(g.trocaId);
        // troca despublicada some da lista (não dá para mostrar o que ela era)
        return troca ? { troca, guardadaEm: g.guardadaEm, dias: diasDesde(g.guardadaEm, agora) } : null;
      };
      const todas = trocasGuardadas(respostas);
      const adiamentos = limparAdiamentos(adiamentosSalvos, todas.map((g) => g.trocaId), agora);
      void salvarAdiamentosTestei(userId, adiamentos);

      setTrocas(lista);
      setGuardadas(todas.map(completar).filter((x): x is TrocaGuardadaCompleta => !!x));
      setParaPerguntar(
        trocasParaPerguntar(respostas, agora, adiamentos)
          .map(completar)
          .filter((x): x is TrocaGuardadaCompleta => !!x),
      );
    } catch (e) {
      console.warn('Não deu para carregar as ideias guardadas:', e);
    } finally {
      setCarregado(true);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  /** "Ainda não testei · me lembra amanhã". */
  const adiar = useCallback(
    async (trocaId: string) => {
      if (!userId) return;
      const atuais = await lerAdiamentosTestei(userId);
      await salvarAdiamentosTestei(userId, { ...atuais, [trocaId]: adiarAteAmanha(new Date()) });
      setParaPerguntar((l) => l.filter((g) => g.troca.id !== trocaId));
    },
    [userId],
  );

  return { trocas, guardadas, paraPerguntar, carregado, recarregar: carregar, adiar };
}
