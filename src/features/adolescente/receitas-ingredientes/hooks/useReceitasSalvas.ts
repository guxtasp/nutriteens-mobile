// src/features/adolescente/receitas-ingredientes/hooks/useReceitasSalvas.ts
//
// Lista de receitas salvas pra fazer depois. Relê ao voltar o foco para a tela, assim o número no
// Comer e na tela de receitas fica certo depois de salvar em outro lugar.
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { alternarReceitaSalva, estaSalva, type ReceitaSalva } from '../utils/receitasSalvas';
import { gravarReceitasSalvas, lerReceitasSalvas } from '../utils/receitasSalvasStorage';

export function useReceitasSalvas() {
  const { userId } = useAuth();
  const [salvas, setSalvas] = useState<ReceitaSalva[]>([]);
  // espelho para o alternar não depender do render (dois toques rápidos não se atropelam)
  const atual = useRef<ReceitaSalva[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let ativo = true;
      lerReceitasSalvas(userId).then((l) => {
        if (!ativo) return;
        atual.current = l;
        setSalvas(l);
      });
      return () => {
        ativo = false;
      };
    }, [userId]),
  );

  /** Salva ou tira; devolve true se ficou salva. */
  const alternar = useCallback(
    (id: string): boolean => {
      const nova = alternarReceitaSalva(atual.current, id, new Date().toISOString());
      atual.current = nova;
      setSalvas(nova);
      if (userId) void gravarReceitasSalvas(userId, nova);
      return estaSalva(nova, id);
    },
    [userId],
  );

  const ehSalva = useCallback((id: string) => estaSalva(salvas, id), [salvas]);

  return { salvas, alternar, ehSalva };
}
