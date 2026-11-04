// src/features/adolescente/tour/tourStorage.ts
//
// "Já viu o tour?" por usuário, guardado no aparelho (mesmo estilo de boasVindasStorage.ts).
import AsyncStorage from '@react-native-async-storage/async-storage';

function chave(usuarioId: string) {
  return `tour_home_visto:${usuarioId}`;
}

export async function jaViuTour(usuarioId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(chave(usuarioId))) === '1';
  } catch (erro) {
    console.warn('Erro ao ler gate do tour:', erro);
    return false;
  }
}

export async function marcarTourVisto(usuarioId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(usuarioId), '1');
  } catch (erro) {
    console.warn('Erro ao salvar gate do tour:', erro);
  }
}
