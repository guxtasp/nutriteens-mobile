// src/shared/audio/feedback.ts
//
// Feedback combinado (som + vibração) pra não repetir o par em cada tela.
// Nunca lança erro: sem áudio ou sem motor de vibração, simplesmente não faz nada.
// O som respeita a preferência "sons ligados" (ver tocarSom em ./sons).
import * as Haptics from 'expo-haptics';
import { tocarSom } from './sons';

function vibrar(acao: () => Promise<void>): void {
  try {
    acao().catch(() => {});
  } catch {
    /* sem suporte a vibração (ex.: web) */
  }
}

/** Toque leve: botões simples (fechar, voltar). */
export function feedbackToque(): void {
  tocarSom('toque');
  vibrar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Troca de opção (filtros, abas): o "clique" de seleção do sistema, sem som. */
export function feedbackSelecao(): void {
  vibrar(() => Haptics.selectionAsync());
}

/** Só uma batidinha, sem som: ex.: quando um número termina de contar. */
export function feedbackLeve(): void {
  vibrar(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Algo bom aconteceu (missão concluída): sino de conquista + vibração de sucesso. */
export function feedbackConquista(): void {
  tocarSom('conquista');
  vibrar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** Algo triste mas leve (perdeu a sequência): som de erro suave + vibração de aviso. */
export function feedbackPerda(): void {
  tocarSom('erro');
  vibrar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}

/** Momento de comemoração (celebração da sequência): fanfarra + vibração de sucesso. */
export function feedbackCelebracao(): void {
  tocarSom('fanfarra');
  vibrar(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}