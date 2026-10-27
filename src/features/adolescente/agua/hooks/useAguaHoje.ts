// src/features/adolescente/hooks/useAguaHoje.ts
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { calcularMetaAguaMl } from '../../../../shared/utils/calcularMetaAgua';
import {
  buscarConsumoAguaHoje,
  inserirRegistroAgua,
  buscarMediaConsumoAgua,
} from '../services/aguaService';
import { useOffline } from '../../../../shared/offline/OfflineContext';
import { aguaPendenteMl } from '../../../../shared/offline/filaOffline';
import { lerCache, salvarCache } from '../../../../shared/offline/cacheLocal';
import { ehErroDeRede } from '../../../../shared/offline/erroRede';

// Estado da tela de água guardado do último carregamento com internet.
// `mlServidor` NÃO inclui o que ainda está na fila offline (isso é somado na hora de mostrar).
type EstadoAguaCache = { metaMl: number; mlServidor: number; mediaSemanal: number; mediaMensal: number };

export function useAguaHoje() {
  const { userId } = useAuth();
  const { executarOuGuardar, lerPendentes, versaoSync } = useOffline();
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
    const chaveCache = `agua:estado:${userId}:${hojeIso}`;
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
      const meta = calcularMetaAguaMl(perfil.peso_kg);
      setMetaMl(meta);

      const [hoje, semana, mes] = await Promise.all([
        buscarConsumoAguaHoje(userId, hojeIso),
        buscarMediaConsumoAgua(userId, 7),
        buscarMediaConsumoAgua(userId, 30),
      ]);

      void salvarCache<EstadoAguaCache>(chaveCache, { metaMl: meta, mlServidor: hoje, mediaSemanal: semana, mediaMensal: mes });
      // o que foi registrado sem internet e ainda não subiu também conta no dia
      setMlHoje(hoje + aguaPendenteMl(await lerPendentes(), hojeIso));
      setMediaSemanal(semana);
      setMediaMensal(mes);
    } catch (erro) {
      if (ehErroDeRede(erro)) {
        // sem internet: mostra o último estado conhecido + o que está na fila
        const copia = await lerCache<EstadoAguaCache>(chaveCache);
        if (copia) {
          setPrecisaPesoAltura(false);
          setMetaMl(copia.metaMl);
          setMlHoje(copia.mlServidor + aguaPendenteMl(await lerPendentes(), hojeIso));
          setMediaSemanal(copia.mediaSemanal);
          setMediaMensal(copia.mediaMensal);
        }
      } else {
        console.error('Erro ao carregar dados de água:', erro);
      }
    } finally {
      setCarregando(false);
    }
  }, [userId, hojeIso, lerPendentes]);

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

  // depois que a fila sobe, o total do servidor já inclui esses registros: recarrega
  useEffect(() => {
    if (versaoSync > 0) void carregar();
  }, [versaoSync, carregar]);

  const registrar = useCallback(
    async (quantidadeMl: number): Promise<number | null> => {
      if (!userId || registrando) return null;
      setRegistrando(true);
      try {
        const horario = new Date().toTimeString().slice(0, 8);
        const guardado = await executarOuGuardar(
          { tipo: 'AGUA', payload: { dataISO: hojeIso, horario, quantidadeMl } },
          () => inserirRegistroAgua({ userId, data: hojeIso, quantidadeMl, horario })
        );

        if (guardado) {
          // sem internet: aparece na hora e sobe sozinho depois
          const novoTotal = mlHoje + quantidadeMl;
          setMlHoje(novoTotal);
          return novoTotal;
        }

        // o registro já está no servidor; se só a releitura falhar, mostra a soma local
        // (nunca reenviar: isso duplicaria o copo de água)
        let novoTotal = mlHoje + quantidadeMl;
        try {
          novoTotal = await buscarConsumoAguaHoje(userId, hojeIso);
        } catch (erro) {
          if (!ehErroDeRede(erro)) throw erro;
          setMlHoje(novoTotal);
          return novoTotal;
        }
        await carregar();
        return novoTotal;
      } finally {
        setRegistrando(false);
      }
    },
    [userId, hojeIso, registrando, carregar, executarOuGuardar, mlHoje]
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