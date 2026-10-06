import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import {
  calcularProgressoMissaoDoDia,
  concederPontosMissaoSeNecessario,
  mapearMissao,
  MissaoDoDia,
  obterOuAtribuirMissaoDoDia,
} from '../../home/services/missaoService';
import { buscarMissoesDoPeriodo, MissoesDoPeriodo } from '../services/missoesPeriodicasService';
import type { Progresso } from '../utils/progresso';

export type DiaHistorico = { data: string; titulo: string; icone: string | null; cumprida: boolean };
export type MissaoHoje = { missao: MissaoDoDia; progresso: Progresso };

/** Uma seção da tela (hoje, histórico, semana, mês) carrega e falha sozinha. */
type Secao<T> = { dados: T | null; erro: boolean; carregando: boolean };
const inicial = <T,>(): Secao<T> => ({ dados: null, erro: false, carregando: true });

async function carregarHoje(userId: string): Promise<MissaoHoje> {
  const hojeISO = formatarDataISO(new Date());
  const missao = await obterOuAtribuirMissaoDoDia(userId, hojeISO);
  const progresso = await calcularProgressoMissaoDoDia(userId, hojeISO, missao);
  if (progresso.concluida) {
    // idempotente: só credita na primeira vez (mesma regra da Home)
    await concederPontosMissaoSeNecessario(userId, missao.id, missao.pontosRecompensa).catch((e) =>
      console.error('Erro ao conceder pontos da missão do dia:', e),
    );
  }
  return { missao, progresso };
}

async function carregarHistorico(userId: string): Promise<DiaHistorico[]> {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - 7);
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const { data, error } = await supabase
    .from('missoes_diarias')
    .select('data, xp_concedido, parametros, missoes_catalogo(tipo, titulo, descricao, icone, criterio, pontos_recompensa)')
    .eq('user_id', userId)
    .gte('data', formatarDataISO(inicio))
    .lte('data', formatarDataISO(ontem))
    .order('data', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter((l: any) => l.missoes_catalogo)
    .map((l: any) => {
      const m = mapearMissao({ id: '', parametros: l.parametros, missoes_catalogo: l.missoes_catalogo });
      return { data: l.data, titulo: m.titulo, icone: m.icone, cumprida: !!l.xp_concedido };
    });
}

export function useMissoes() {
  const { userId } = useAuth();
  const [hoje, setHoje] = useState<Secao<MissaoHoje>>(inicial());
  const [historico, setHistorico] = useState<Secao<DiaHistorico[]>>(inicial());
  const [semana, setSemana] = useState<Secao<MissoesDoPeriodo>>(inicial());
  const [mes, setMes] = useState<Secao<MissoesDoPeriodo>>(inicial());

  const carregar = useCallback(async () => {
    if (!userId) return;

    // cada seção tem o seu try/catch: se as semanais/mensais falharem (ex.: migration
    // ainda não rodada), a aba Diárias continua funcionando — e vice-versa
    async function rodar<T>(buscar: () => Promise<T>, set: (s: Secao<T>) => void, nome: string) {
      try {
        set({ dados: await buscar(), erro: false, carregando: false });
      } catch (e) {
        console.error(`Erro ao carregar missões (${nome}):`, e);
        set({ dados: null, erro: true, carregando: false });
      }
    }

    await Promise.all([
      rodar(() => carregarHoje(userId), setHoje, 'hoje'),
      rodar(() => carregarHistorico(userId), setHistorico, 'histórico'),
      rodar(() => buscarMissoesDoPeriodo(userId, 'SEMANAL'), setSemana, 'semanais'),
      rodar(() => buscarMissoesDoPeriodo(userId, 'MENSAL'), setMes, 'mensais'),
    ]);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  return { hoje, historico, semana, mes, recarregar: carregar };
}
