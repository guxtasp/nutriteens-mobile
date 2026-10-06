// src/features/adolescente/notificacoes/services/lembreteStorage.ts
//
// Tudo que os lembretes precisam lembrar fica NO APARELHO (AsyncStorage), por
// usuário: a configuração escolhida e o histórico de uso usado pra deixar os
// lembretes "orgânicos" (horários de abertura, quais já foram ignorados...).
// Nada disso vai pro Supabase.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TipoLembrete, TipoRegular } from '../data/mensagensLembrete';
import { CONFIG_PADRAO, ConfigLembretes } from '../utils/escolherLembrete';

export type LembreteAgendadoSalvo = { quando: number; tipo: TipoLembrete; mensagemId: string };

export type EstadoLembretes = {
  aberturas: number[]; // timestamps das últimas aberturas do app (máx. 30)
  ignoradasSeguidas: number;
  ultimoPorTipo: Partial<Record<TipoRegular, number>>; // quando cada tipo foi lembrado por último (já disparado)
  ultimaMensagemPorTipo: Partial<Record<TipoLembrete, string>>;
  agendados: LembreteAgendadoSalvo[];
  permissaoPerguntada: boolean; // já mostramos o convite do Bróxis pra ativar notificações?
};

export const ESTADO_INICIAL: EstadoLembretes = {
  aberturas: [],
  ignoradasSeguidas: 0,
  ultimoPorTipo: {},
  ultimaMensagemPorTipo: {},
  agendados: [],
  permissaoPerguntada: false,
};

const MAX_ABERTURAS = 30;
// várias idas e vindas do app em sequência contam como UMA abertura
const INTERVALO_MIN_ENTRE_ABERTURAS_MS = 30 * 60 * 1000;

const chave = (userId: string, nome: 'config' | 'estado') => `@nutriteens:lembretes:${userId}:${nome}`;

async function ler<T>(key: string): Promise<Partial<T> | null> {
  try {
    const bruto = await AsyncStorage.getItem(key);
    return bruto ? (JSON.parse(bruto) as Partial<T>) : null;
  } catch {
    return null; // JSON corrompido ou storage indisponível: volta pro padrão
  }
}

export async function carregarConfig(userId: string): Promise<ConfigLembretes> {
  const salvo = await ler<ConfigLembretes>(chave(userId, 'config'));
  return {
    ...CONFIG_PADRAO,
    ...salvo,
    tipos: { ...CONFIG_PADRAO.tipos, ...(salvo?.tipos ?? {}) },
  };
}

export async function salvarConfig(userId: string, config: ConfigLembretes): Promise<void> {
  await AsyncStorage.setItem(chave(userId, 'config'), JSON.stringify(config));
}

export async function carregarEstado(userId: string): Promise<EstadoLembretes> {
  const salvo = await ler<EstadoLembretes>(chave(userId, 'estado'));
  return { ...ESTADO_INICIAL, ...salvo };
}

export async function salvarEstado(userId: string, estado: EstadoLembretes): Promise<void> {
  await AsyncStorage.setItem(chave(userId, 'estado'), JSON.stringify(estado));
}

/** Registra uma abertura do app (base do "horário orgânico"). Devolve o estado atualizado. */
export async function registrarAbertura(userId: string, agora: number = Date.now()): Promise<EstadoLembretes> {
  const estado = await carregarEstado(userId);
  const ultima = estado.aberturas[estado.aberturas.length - 1];

  // mesma "sessão": só estica o registro da última abertura em vez de criar outra
  const mesmaSessao = ultima !== undefined && agora - ultima < INTERVALO_MIN_ENTRE_ABERTURAS_MS;
  const aberturas = mesmaSessao
    ? [...estado.aberturas.slice(0, -1), agora]
    : [...estado.aberturas, agora].slice(-MAX_ABERTURAS);

  const novo = { ...estado, aberturas };
  await salvarEstado(userId, novo);
  return novo;
}
