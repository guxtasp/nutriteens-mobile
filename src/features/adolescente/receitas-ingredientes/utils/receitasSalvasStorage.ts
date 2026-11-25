// src/features/adolescente/receitas-ingredientes/utils/receitasSalvasStorage.ts
// Receitas salvas pra fazer depois: guardadas só no celular, uma lista por usuário (mesmo padrão
// da despensa). A chave leva o id, então o "Apagar meus dados" também a remove do aparelho.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizarSalvas, type ReceitaSalva } from './receitasSalvas';

const chave = (userId: string) => `nt:receitas-salvas:${userId}`;

export async function lerReceitasSalvas(userId: string): Promise<ReceitaSalva[]> {
  try {
    const bruto = await AsyncStorage.getItem(chave(userId));
    return normalizarSalvas(bruto ? JSON.parse(bruto) : []);
  } catch {
    return [];
  }
}

export async function gravarReceitasSalvas(userId: string, lista: ReceitaSalva[]): Promise<void> {
  try {
    await AsyncStorage.setItem(chave(userId), JSON.stringify(lista));
  } catch {
    // sem espaço/permissão: a lista continua valendo nesta sessão
  }
}
