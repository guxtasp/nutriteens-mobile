// src/features/adolescente/notificacoes/services/lembreteService.ts
//
// Lembretes como NOTIFICAÇÕES LOCAIS (agendadas no próprio celular, sem servidor
// e sem push). Como uma notificação local não consegue checar nada no instante
// em que dispara, o app REAGENDA tudo sempre que é aberto, vai pro segundo plano
// ou volta pra Home: cancela o plano antigo e agenda só os próximos lembretes
// de acordo com o que já foi feito hoje (regras em utils/escolherLembrete.ts).
//
// Não funciona no modo web (painel admin/nutricionista): tudo vira no-op lá.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../../../../lib/supabase';
import { escolherMensagem, DestinoLembrete, TipoRegular } from '../data/mensagensLembrete';
import { atualizarIgnoradas, planejarLembretes } from '../utils/escolherLembrete';
import { buscarPendentesHoje } from './lembreteEstadoService';
import { carregarConfig, carregarEstado, LembreteAgendadoSalvo, salvarEstado } from './lembreteStorage';

const CANAL_ID = 'lembretes';
const ORIGEM_PLANO = 'plano'; // marca as notificações criadas pelo planejamento (o teste fica de fora)
const ORIGEM_TESTE = 'teste';
const MAX_AGENDADOS_GUARDADOS = 20;

export type StatusPermissao = 'concedida' | 'indefinida' | 'negada';

const suportado = Platform.OS !== 'web';

// Como a notificação aparece se o app estiver aberto na hora (raro: não agendamos
// perto de quem acabou de abrir o app).
if (suportado) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// No Android o canal precisa existir antes de pedir permissão (13+) e de agendar.
async function garantirCanal(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_ID, {
    name: 'Lembretes do Bróxis',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#8BCF4A',
  });
}

export async function obterStatusPermissao(): Promise<StatusPermissao> {
  if (!suportado) return 'negada';
  const permissao = await Notifications.getPermissionsAsync();
  if (permissao.granted) return 'concedida';
  if (permissao.canAskAgain && permissao.status === Notifications.PermissionStatus.UNDETERMINED) return 'indefinida';
  return 'negada';
}

/** Pede permissão ao sistema (só aparece o pop-up se ainda dá pra perguntar). */
export async function pedirPermissao(): Promise<StatusPermissao> {
  if (!suportado) return 'negada';
  await garantirCanal();

  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return 'concedida';
  if (!atual.canAskAgain) return 'negada';

  const resposta = await Notifications.requestPermissionsAsync();
  return resposta.granted ? 'concedida' : 'negada';
}

async function cancelarPlanoAgendado(): Promise<void> {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    agendadas
      .filter((n) => n.content.data?.origem === ORIGEM_PLANO)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/** Cancela todos os lembretes do plano (usado ao desligar ou ao sair da conta). */
export async function cancelarLembretes(): Promise<void> {
  if (!suportado) return;
  await cancelarPlanoAgendado();
}

// Saiu da conta: os lembretes agendados eram dessa pessoa, então não podem
// continuar chegando no aparelho (registrado uma vez, quando o módulo carrega).
if (suportado) {
  supabase.auth.onAuthStateChange((evento) => {
    if (evento === 'SIGNED_OUT') void cancelarLembretes();
  });
}

async function executarReagendamento(userId: string): Promise<void> {
  const agora = new Date();
  const agoraMs = agora.getTime();

  const config = await carregarConfig(userId);
  const permissao = await Notifications.getPermissionsAsync();

  // sempre limpa o plano antigo primeiro; se estiver desligado ou sem permissão, para aqui
  await cancelarPlanoAgendado();
  if (!config.ativado || !permissao.granted) return;

  const estado = await carregarEstado(userId);

  // 1. O que já disparou entra no histórico ("lembrado há mais tempo" decide o próximo tipo).
  const ultimoPorTipo = { ...estado.ultimoPorTipo };
  const ultimaMensagemPorTipo = { ...estado.ultimaMensagemPorTipo };
  for (const lembrete of estado.agendados.filter((a) => a.quando <= agoraMs)) {
    if (lembrete.tipo !== 'saudade') {
      ultimoPorTipo[lembrete.tipo] = Math.max(ultimoPorTipo[lembrete.tipo] ?? 0, lembrete.quando);
    }
    ultimaMensagemPorTipo[lembrete.tipo] = lembrete.mensagemId;
  }

  // 2. Freio: quantos lembretes seguidos a pessoa deixou passar?
  const { ignoradasSeguidas, agendadosPendentes } = atualizarIgnoradas({
    agendados: estado.agendados,
    aberturas: estado.aberturas,
    agora: agoraMs,
    ignoradasAntes: estado.ignoradasSeguidas,
  });

  // 3. O que ainda falta fazer hoje + plano.
  const pendentes = await buscarPendentesHoje(userId, agora);
  const plano = planejarLembretes({
    agora,
    config,
    pendentes,
    aberturas: estado.aberturas,
    ignoradasSeguidas,
    ultimoPorTipo,
    // quem está com o app aberto (ou acabou de fechar) acabou de usar
    ultimaAbertura: agoraMs,
  });

  // 4. Agenda de verdade.
  await garantirCanal();
  const novosAgendados: LembreteAgendadoSalvo[] = [];
  for (const lembrete of plano) {
    const mensagem = escolherMensagem(lembrete.tipo, ultimaMensagemPorTipo[lembrete.tipo]);
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: mensagem.titulo,
          body: mensagem.texto,
          data: { origem: ORIGEM_PLANO, tipo: lembrete.tipo, destino: mensagem.destino },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: lembrete.quando,
          channelId: CANAL_ID,
        },
      });
      novosAgendados.push({ quando: lembrete.quando.getTime(), tipo: lembrete.tipo, mensagemId: mensagem.id });
      ultimaMensagemPorTipo[lembrete.tipo] = mensagem.id;
    } catch (erro) {
      console.warn('Falha ao agendar lembrete:', erro);
    }
  }

  await salvarEstado(userId, {
    ...estado,
    ignoradasSeguidas,
    ultimoPorTipo,
    ultimaMensagemPorTipo,
    agendados: [...agendadosPendentes, ...novosAgendados].slice(-MAX_AGENDADOS_GUARDADOS),
  });
}

// Várias chamadas quase juntas (abrir o app + voltar pra Home, por exemplo) não
// podem rodar em paralelo: uma cancelaria o que a outra acabou de agendar.
let emAndamento = false;
let repetir = false;

export async function reagendarLembretes(userId: string): Promise<void> {
  if (!suportado) return;
  if (emAndamento) {
    repetir = true;
    return;
  }

  emAndamento = true;
  try {
    do {
      repetir = false;
      try {
        await executarReagendamento(userId);
      } catch (erro) {
        console.warn('Falha ao reagendar lembretes:', erro);
      }
    } while (repetir);
  } finally {
    emAndamento = false;
  }
}

/** Notificação de teste, chega em ~5 segundos (não entra no plano nem na contagem do freio). */
export async function enviarLembreteDeTeste(): Promise<void> {
  if (!suportado) return;
  await garantirCanal();
  const mensagem = escolherMensagem('missao');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: mensagem.titulo,
      body: mensagem.texto,
      data: { origem: ORIGEM_TESTE, tipo: 'missao' as TipoRegular, destino: mensagem.destino },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      channelId: CANAL_ID,
    },
  });
}

/** Tela de destino guardada na notificação (ou null se não tiver). */
export function destinoDaResposta(resposta: Notifications.NotificationResponse): DestinoLembrete | null {
  const destino = resposta.notification.request.content.data?.destino;
  return typeof destino === 'string' ? (destino as DestinoLembrete) : null;
}
