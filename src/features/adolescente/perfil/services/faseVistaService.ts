// src/features/adolescente/perfil/services/faseVistaService.ts
//
// Guarda no aparelho a última fase do Broxis que o aluno VIU (depois da animação de evolução).
// Fica só local (AsyncStorage): é uma preferência de exibição, não um dado de pesquisa, e não
// precisa de migration. Se o aluno trocar de aparelho, o primeiro acesso só registra a fase
// atual em silêncio (ver `faseParaCelebrar`).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FaseId } from '../utils/fasesMascote';

const FASES_VALIDAS: readonly FaseId[] = ['filhote', 'jovem', 'adulto'];
const chave = (userId: string) => `@nutriteens:broxis_fase_vista:${userId}`;

export async function lerFaseVista(userId: string): Promise<FaseId | null> {
  try {
    const valor = await AsyncStorage.getItem(chave(userId));
    return valor && (FASES_VALIDAS as readonly string[]).includes(valor) ? (valor as FaseId) : null;
  } catch {
    return null;
  }
}

export async function salvarFaseVista(userId: string, fase: FaseId): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(userId), fase);
  } catch (e) {
    console.warn('Não foi possível salvar a fase vista do Broxis:', e);
  }
}
