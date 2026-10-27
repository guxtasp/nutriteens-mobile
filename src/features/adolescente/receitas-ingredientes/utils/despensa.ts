// src/features/adolescente/receitas-ingredientes/utils/despensa.ts
// "O que tenho em casa": lista do próprio adolescente, guardada só no celular
// (não é dado de saúde e não precisa sair do aparelho). Uma lista por usuário.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IngredienteCasa } from './combinarReceitas';

const chave = (userId: string) => `nt:despensa:${userId}`;

export async function lerDespensa(userId: string): Promise<IngredienteCasa[]> {
  try {
    const bruto = await AsyncStorage.getItem(chave(userId));
    const lista = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista)
      ? lista.filter((i): i is IngredienteCasa => !!i && typeof i.id === 'string' && typeof i.nome === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function salvarDespensa(userId: string, lista: IngredienteCasa[]): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(userId), JSON.stringify(lista));
  } catch {
    // sem espaço/permissão: a lista continua valendo nesta sessão
  }
}
