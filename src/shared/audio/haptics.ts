// src/shared/audio/haptics.ts
//
// Mesmo uso do `expo-haptics` (import * as Haptics from ...), mas respeita a escolha da pessoa
// em Mais > Acessibilidade > "Vibração". Desligada, nenhuma função vibra.
import * as Real from 'expo-haptics';
import { obterPreferencias } from '../state/acessibilidade';

export const ImpactFeedbackStyle = Real.ImpactFeedbackStyle;
export const NotificationFeedbackType = Real.NotificationFeedbackType;

export async function impactAsync(estilo?: Real.ImpactFeedbackStyle): Promise<void> {
  if (!obterPreferencias().vibracao) return;
  return Real.impactAsync(estilo);
}

export async function notificationAsync(tipo?: Real.NotificationFeedbackType): Promise<void> {
  if (!obterPreferencias().vibracao) return;
  return Real.notificationAsync(tipo);
}

export async function selectionAsync(): Promise<void> {
  if (!obterPreferencias().vibracao) return;
  return Real.selectionAsync();
}
