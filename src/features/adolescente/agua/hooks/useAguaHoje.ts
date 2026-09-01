// src/features/adolescente/hooks/useAguaHoje.ts
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import {
  buscarConsumoAguaHoje,
  registrarConsumoAgua,
  buscarMediaConsumoAgua,
} from '../services/aguaService';

export function useAguaHoje() {
  const { userId } = useAuth();
  const hojeIso = formatarDataISO(new Date());

  const [carregando, setCarregando] = useState(true);
  const [precisaPesoAltura, setPrecisaPesoAltura] = useState(false);
  const [metaMl, setMetaMl] = useState(2000);
  const [mlHoje, setMlHoje] = useState(0);
  const [mediaSemanal, setMediaSemanal] = useState(0);
  const [mediaMensal, setMediaMensal] = useState(0);
  const [registrando, setRegistrando] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const { data: perfil, error } = await supabase
        .from('profiles')
        .select('peso_kg')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!perfil?.peso_kg) {
        setPrecisaPesoAltura(true);
        return;
      }

      setPrecisaPesoAltura(false);
      setMetaMl(calcularMetaAguaMl(perfil.peso_kg));

      const [hoje, semana, mes] = await Promise.all([
        buscarConsumoAguaHoje(userId, hojeIso),
        buscarMediaConsumoAgua(userId, 7),
        buscarMediaConsumoAgua(userId, 30),
      ]);

      setMlHoje(hoje);
      setMediaSemanal(semana);
      setMediaMensal(mes);
    } catch (erro) {
      console.error('Erro ao carregar dados de água:', erro);
    } finally {
      setCarregando(false);
    }
  }, [userId, hojeIso]);

  // recarrega toda vez que a tela ganha foco (corrige Home não atualizar
  // após registrar em ConsumoAguaScreen — antes só rodava uma vez no mount)
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const salvarPesoAltura = useCallback(
    async (peso: number, altura: number | null) => {
      if (!userId) return;
      const { error } = await supabase
        .from('profiles')
        .update({ peso_kg: peso, ...(altura ? { altura_cm: altura } : {}) })
        .eq('id', userId);

      if (error) throw error;
      await carregar();
    },
    [userId, carregar]
  );

  const registrar = useCallback(
    async (quantidadeMl: number) => {
      if (!userId || registrando) return null;
      setRegistrando(true);
      try {
        const novoTotal = await registrarConsumoAgua({ userId, data: hojeIso, quantidadeMl });
        await carregar();
        return novoTotal;
      } finally {
        setRegistrando(false);
      }
    },
    [userId, hojeIso, registrando, carregar]
  );

  return {
    carregando,
    precisaPesoAltura,
    metaMl,
    mlHoje,
    mediaSemanal,
    mediaMensal,
    registrando,
    progresso: metaMl > 0 ? Math.min(mlHoje / metaMl, 1) : 0,
    salvarPesoAltura,
    registrar,
  };
}