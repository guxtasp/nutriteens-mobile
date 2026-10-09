import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { buscarCartas, marcarCartaVista } from '../../cartas/services/cartasService';
import { buscarInsignias, marcarInsigniasVistasPorId } from '../../perfil/services/gamificacaoService';
import { useRecompensasStore } from '../store/recompensasStore';
import {
  deveVerificar,
  montarFilaRecompensas,
  obterRotaAtiva,
  rotaPermiteCelebrar,
  type Recompensa,
} from '../utils/recompensas';
import { CartaGanhaModal } from './CartaGanhaModal';
import { InsigniaGanhaModal } from './InsigniaGanhaModal';

/** Espera depois de entrar numa tela antes de comemorar (deixa a transição e a Home assentarem). */
const ATRASO_APOS_NAVEGAR_MS = 1400;

type Props = { ativo: boolean };

/**
 * Fica montado uma vez dentro do navegador do adolescente.
 *
 *  - DESCOBRE: ao entrar em telas calmas (e ao voltar de lição, refeição, etc.), pergunta ao
 *    servidor o que o aluno ganhou e ainda não viu (cartas, insígnias, marcos, conquistas).
 *    O banco concede por trigger, então o app só "descobre" depois: a fonte da verdade é a
 *    marca `vista` (nova = ganhou e não viu).
 *  - COMEMORA: mostra uma animação por recompensa, uma de cada vez, e só então marca como vista.
 *  - NÃO ATRAPALHA: nunca aparece no meio de lição/quiz/registro, nem junto de outra celebração
 *    (a Home pausa a fila enquanto mostra a de sequência).
 */
export default function RecompensasHost({ ativo }: Props) {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();

  const fila = useRecompensasStore((s) => s.fila);
  const pausas = useRecompensasStore((s) => s.pausas);
  const enfileirar = useRecompensasStore((s) => s.enfileirar);
  const avancar = useRecompensasStore((s) => s.avancar);
  const limpar = useRecompensasStore((s) => s.limpar);

  const [rota, setRota] = useState<string | undefined>(undefined);
  const [assentou, setAssentou] = useState(false);

  const rotaAnterior = useRef<string | undefined>(undefined);
  const ultimaVerificacao = useRef(0);
  const verificando = useRef(false);

  // acompanha a tela atual
  useEffect(() => {
    const atualizar = () => setRota(obterRotaAtiva(navigation.getState()));
    atualizar();
    return navigation.addListener('state', atualizar);
  }, [navigation]);

  const verificar = useCallback(async () => {
    if (!ativo || !userId || verificando.current) return;
    verificando.current = true;
    ultimaVerificacao.current = Date.now();
    try {
      // uma falha em um lado não pode esconder as recompensas do outro
      const [cartas, insignias] = await Promise.allSettled([buscarCartas(userId), buscarInsignias(userId)]);
      const jaVistas = new Set(useRecompensasStore.getState().vistas);
      const novas = montarFilaRecompensas(
        cartas.status === 'fulfilled' ? cartas.value : [],
        insignias.status === 'fulfilled' ? insignias.value : [],
        jaVistas,
      );
      if (novas.length) enfileirar(novas);
    } catch (e) {
      console.warn('Erro ao verificar recompensas:', e);
    } finally {
      verificando.current = false;
    }
  }, [ativo, userId, enfileirar]);

  // ao mudar de tela: decide se pergunta ao servidor e (re)inicia a espera para comemorar
  useEffect(() => {
    const anterior = rotaAnterior.current;
    rotaAnterior.current = rota;

    setAssentou(false);
    if (!rotaPermiteCelebrar(rota)) return;

    if (deveVerificar({ agora: Date.now(), ultimaVerificacao: ultimaVerificacao.current, rotaAnterior: anterior })) {
      verificar();
    }
    const t = setTimeout(() => setAssentou(true), ATRASO_APOS_NAVEGAR_MS);
    return () => clearTimeout(t);
  }, [rota, verificar]);

  // voltou pro app (vindo do fundo): vale perguntar de novo
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active' || !rotaPermiteCelebrar(obterRotaAtiva(navigation.getState()))) return;
      if (deveVerificar({ agora: Date.now(), ultimaVerificacao: ultimaVerificacao.current, rotaAnterior: undefined })) {
        verificar();
      }
    });
    return () => sub.remove();
  }, [navigation, verificar]);

  const marcarComoVista = useCallback(
    async (r: Recompensa) => {
      try {
        if (r.tipo === 'carta') await marcarCartaVista(r.carta.id);
        else if (userId) await marcarInsigniasVistasPorId(userId, [r.insignia.id]);
      } catch (e) {
        console.warn('Erro ao marcar recompensa como vista:', e);
      }
    },
    [userId],
  );

  const atual = fila[0];

  const continuar = useCallback(() => {
    if (!atual) return;
    avancar();
    marcarComoVista(atual);
  }, [atual, avancar, marcarComoVista]);

  const verNoDestino = useCallback(async () => {
    if (!atual) return;
    const destino = atual.tipo === 'carta' ? 'AlbumCartas' : 'Profile';
    avancar();
    // espera (no máximo 600 ms) a marca de "vista", pra tela de destino não abrir ainda com "NOVA"
    await Promise.race([marcarComoVista(atual), new Promise((resolve) => setTimeout(resolve, 600))]);
    navigation.navigate(destino);
  }, [atual, avancar, marcarComoVista, navigation]);

  const pularTudo = useCallback(() => {
    // o que foi pulado continua disponível no álbum/perfil; só deixa de ser "novo"
    const descartadas = limpar();
    descartadas.forEach((r) => marcarComoVista(r));
  }, [limpar, marcarComoVista]);

  if (!ativo || !atual || !assentou || pausas.length > 0 || !rotaPermiteCelebrar(rota)) return null;

  const restantes = fila.length - 1;

  return atual.tipo === 'carta' ? (
    <CartaGanhaModal
      key={atual.chave}
      carta={atual.carta}
      restantes={restantes}
      onContinuar={continuar}
      onVerAlbum={verNoDestino}
      onPularTudo={pularTudo}
    />
  ) : (
    <InsigniaGanhaModal
      key={atual.chave}
      insignia={atual.insignia}
      restantes={restantes}
      onContinuar={continuar}
      onVerPerfil={verNoDestino}
      onPularTudo={pularTudo}
    />
  );
}
