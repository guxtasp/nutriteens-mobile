// src/features/adolescente/social/services/lembreteChamaService.ts
//
// Lembrete local de fim de dia ("acender a sequência") da Chama em Dupla.
// Segue o modelo do lembreteService: sem servidor, reagendado sempre que a
// lista é carregada. Respeita a configuração e a permissão de lembretes do app.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { carregarConfig } from '../../notificacoes/services/lembreteStorage';
import { ChamaDupla, proximoLembrete, textoLembreteFimDeDia } from '../utils/chamaDupla';

const ORIGEM = 'chama_dupla';
const CANAL_ID = 'lembretes'; // criado pelo lembreteService

async function cancelarAgendados(): Promise<void> {
  const agendadas = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    agendadas
      .filter((n) => n.content.data?.origem === ORIGEM)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/** Cancela o lembrete antigo e agenda o próximo conforme o estado da dupla ativa. */
export async function reagendarLembreteChama(userId: string, ativa: ChamaDupla | null): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await cancelarAgendados();
    if (!ativa) return;

    const [config, permissao] = await Promise.all([carregarConfig(userId), Notifications.getPermissionsAsync()]);
    if (!config.ativado || !permissao.granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Acender a sequência',
        body: textoLembreteFimDeDia(ativa.apelido),
        data: { origem: ORIGEM },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: proximoLembrete(new Date(), ativa.concluidaHoje),
        channelId: CANAL_ID,
      },
    });
  } catch (erro) {
    console.warn('Falha ao agendar lembrete da Chama em Dupla:', erro);
  }
}
