// src/features/adolescente/notificacoes/services/lidasStorage.ts
//
// Quais notificações a pessoa já abriu. Fica NO APARELHO (AsyncStorage), por
// usuário, como os lembretes. Os ids das notificações já incluem o dia quando
// o aviso "renova" (missões, lembrete), então no dia seguinte voltam a ser novas.
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_GUARDADAS = 300;
const chave = (userId: string) => `notificacoes_lidas:${userId}`;

export async function carregarLidas(userId: string): Promise<Set<string>> {
  try {
    const bruto = await AsyncStorage.getItem(chave(userId));
    const lista = bruto ? JSON.parse(bruto) : [];
    return new Set(Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export async function salvarLidas(userId: string, lidas: ReadonlySet<string>): Promise<void> {
  try {
    // guarda só as mais recentes (a ordem de inserção do Set é preservada)
    const recentes = [...lidas].slice(-MAX_GUARDADAS);
    await AsyncStorage.setItem(chave(userId), JSON.stringify(recentes));
  } catch (erro) {
    console.warn('Falha ao salvar notificações lidas:', erro);
  }
}
