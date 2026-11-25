// src/features/legal/components/ReaceiteTermosHost.tsx
//
// Fica montado uma vez dentro do AdolescenteNavigator (como o RecompensasHost), só depois da
// triagem. Mostra o reaceite em telas calmas (Home, Trilha...), nunca no meio de lição ou
// registro. Enquanto ele está pendente, a fila de recompensas pausa, e ele espera a celebração
// de sequência da Home terminar: nunca dois modais um em cima do outro.
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { useRecompensasStore } from '../../adolescente/recompensas/store/recompensasStore';
import { obterRotaAtiva } from '../../adolescente/recompensas/utils/recompensas';
import { useReaceiteTermos } from '../hooks/useReaceiteTermos';
import { deveMostrarReaceite } from '../utils/textoLegal';
import { ReaceiteModal, type ModoReaceite } from './ReaceiteModal';

const MOTIVO_PAUSA = 'reaceite';
/** Espera a tela assentar antes de abrir (mesma ideia do RecompensasHost). */
const ATRASO_APOS_NAVEGAR_MS = 900;

export default function ReaceiteTermosHost({ ativo }: { ativo: boolean }) {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();
  const { precisaReaceite, dispensadoNaSessao, salvando, erro, aceitar, dispensar } = useReaceiteTermos(
    userId,
    ativo,
  );

  const pausar = useRecompensasStore((s) => s.pausar);
  const retomar = useRecompensasStore((s) => s.retomar);
  // outra celebração na tela (ex.: sequência da Home) tem a vez
  const outraPausaAtiva = useRecompensasStore((s) => s.pausas.some((m) => m !== MOTIVO_PAUSA));

  const [rota, setRota] = useState<string | undefined>(undefined);
  const [assentou, setAssentou] = useState(false);
  const [modo, setModo] = useState<ModoReaceite>('cartao');

  useEffect(() => {
    const atualizar = () => setRota(obterRotaAtiva(navigation.getState()));
    atualizar();
    return navigation.addListener('state', atualizar);
  }, [navigation]);

  useEffect(() => {
    setAssentou(false);
    const t = setTimeout(() => setAssentou(true), ATRASO_APOS_NAVEGAR_MS);
    return () => clearTimeout(t);
  }, [rota]);

  const pendente = ativo && precisaReaceite && !dispensadoNaSessao;
  useEffect(() => {
    if (pendente) pausar(MOTIVO_PAUSA);
    else retomar(MOTIVO_PAUSA);
    return () => retomar(MOTIVO_PAUSA);
  }, [pendente, pausar, retomar]);

  const visivel =
    ativo &&
    assentou &&
    !outraPausaAtiva &&
    deveMostrarReaceite({ precisaReaceite, dispensadoNaSessao, rotaAtiva: rota });

  return (
    <ReaceiteModal
      visivel={visivel}
      modo={modo}
      salvando={salvando}
      erro={erro}
      onConcordar={aceitar}
      onVerResumo={() => setModo('resumo')}
      onFecharResumo={() => setModo('cartao')}
      onAbrirDocumento={(tipo) => {
        // a rota do documento não está em ROTAS_PARA_REACEITE: o modal some enquanto a pessoa lê
        // e volta (no cartão) quando ela retorna
        setModo('cartao');
        navigation.navigate(tipo === 'termos' ? 'TermosDeUso' : 'PoliticaPrivacidade');
      }}
      onDispensar={dispensar}
    />
  );
}
