// src/features/adolescente/notificacoes/hooks/useLembretes.ts
//
// Cola os lembretes no ciclo de vida do app:
//  - ao abrir o app (e a cada volta pro primeiro plano): registra a abertura
//    (base do horário "orgânico") e reagenda;
//  - ao ir pro segundo plano: reagenda de novo, já sabendo o que a pessoa
//    registrou durante o uso (água, refeição, atividade, missão);
//  - ao voltar pra Home: reagenda (a Home é onde a pessoa chega depois de registrar algo);
//  - ao tocar numa notificação: abre a tela certa (água, alimentação, trilha...).
// Também mostra, uma vez só, o convite do Bróxis pra ativar as notificações.
import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import {
  carregarConfig,
  carregarEstado,
  registrarAbertura,
  salvarEstado,
} from '../services/lembreteStorage';
import {
  destinoDaResposta,
  obterStatusPermissao,
  pedirPermissao,
  reagendarLembretes,
} from '../services/lembreteService';

// O convite só aparece a partir da 2ª abertura do app: na primeira a pessoa
// ainda está conhecendo tudo, e pedir permissão cedo demais costuma ser negado.
const ABERTURAS_PARA_CONVIDAR = 2;
const INTERVALO_MIN_REAGENDAR_HOME_MS = 60 * 1000;

// sobrevive a remontagens do navegador: o mesmo toque não navega duas vezes
let ultimaNotificacaoTratada: string | null = null;

async function convidarParaNotificacoes(userId: string): Promise<void> {
  const [config, estado, status] = await Promise.all([
    carregarConfig(userId),
    carregarEstado(userId),
    obterStatusPermissao(),
  ]);

  if (!config.ativado || estado.permissaoPerguntada || status !== 'indefinida') return;
  if (estado.aberturas.length < ABERTURAS_PARA_CONVIDAR) return;

  async function marcarComoPerguntada() {
    const atual = await carregarEstado(userId);
    await salvarEstado(userId, { ...atual, permissaoPerguntada: true });
  }

  Alert.alert(
    'O Bróxis pode te lembrar?',
    'Posso te dar um toque de vez em quando pra beber água, registrar o que comeu, fazer a trilha ou a missão do dia. No máximo um por dia, e você escolhe o que quer receber em Mais > Lembretes.',
    [
      { text: 'Agora não', style: 'cancel', onPress: () => void marcarComoPerguntada() },
      {
        text: 'Pode ser!',
        onPress: async () => {
          await marcarComoPerguntada();
          await pedirPermissao();
          await reagendarLembretes(userId);
        },
      },
    ]
  );
}

type NavegacaoFlexivel = {
  navigate: (nome: string) => void;
  isReady?: () => boolean;
  getCurrentRoute?: () => { name: string } | undefined;
  addListener: (evento: 'state', callback: () => void) => () => void;
};

function navegarQuandoPronto(navigation: NavegacaoFlexivel, destino: string, tentativa = 0) {
  const pronto = navigation.isReady ? navigation.isReady() : true;
  if (pronto) {
    navigation.navigate(destino);
    return;
  }
  if (tentativa < 15) setTimeout(() => navegarQuandoPronto(navigation, destino, tentativa + 1), 300);
}

export function useLembretes(ativo: boolean) {
  const { userId } = useAuth();
  // Este hook roda dentro do NavigationContainer, fora dos navegadores: aqui o
  // useNavigation devolve a navegação raiz, que enxerga todas as telas.
  const navigation = useNavigation() as unknown as NavegacaoFlexivel;
  const ultimaResposta = Notifications.useLastNotificationResponse();

  // abrir o app / ir pro segundo plano
  useEffect(() => {
    if (!ativo || !userId) return;

    async function aoAbrir(uid: string) {
      await registrarAbertura(uid);
      await convidarParaNotificacoes(uid);
      await reagendarLembretes(uid);
    }

    void aoAbrir(userId);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void aoAbrir(userId);
      else void reagendarLembretes(userId);
    });
    return () => assinatura.remove();
  }, [ativo, userId]);

  // voltar pra Home
  useEffect(() => {
    if (!ativo || !userId) return;

    let rotaAnterior: string | undefined;
    let ultimaExecucao = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cancelar = navigation.addListener('state', () => {
      const rota = navigation.getCurrentRoute?.()?.name;
      const voltouPraHome = rota === 'Home' && rotaAnterior !== undefined && rotaAnterior !== 'Home';
      rotaAnterior = rota;

      if (voltouPraHome && Date.now() - ultimaExecucao > INTERVALO_MIN_REAGENDAR_HOME_MS) {
        if (timer) clearTimeout(timer);
        // pequena espera: deixa a Home terminar de carregar e evita rajadas
        timer = setTimeout(() => {
          ultimaExecucao = Date.now();
          void reagendarLembretes(userId);
        }, 2500);
      }
    });

    return () => {
      cancelar();
      if (timer) clearTimeout(timer);
    };
  }, [ativo, userId, navigation]);

  // tocar na notificação (app fechado ou aberto)
  useEffect(() => {
    if (!ativo || !ultimaResposta) return;
    if (ultimaResposta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = ultimaResposta.notification.request.identifier;
    if (id === ultimaNotificacaoTratada) return;
    ultimaNotificacaoTratada = id;

    const destino = destinoDaResposta(ultimaResposta);
    if (destino) navegarQuandoPronto(navigation, destino);
  }, [ativo, ultimaResposta, navigation]);
}
