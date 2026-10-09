// src/features/adolescente/hooks/useHomeData.ts
//
// Por que este hook existe: useSequencia, useMissaoDoDia e useStatusSemana
// rodavam de forma independente a cada foco da Home, e os três
// precisavam saber "a missão de hoje foi cumprida?" — cada um chegava
// nessa resposta do zero (buscando a missão de hoje e avaliando ela de
// novo), e useStatusSemana incluía hoje no lote dos 7 dias, repetindo
// esse trabalho uma terceira vez. Esse hook busca/avalia a missão de hoje
// UMA VEZ e reaproveita o resultado nos três lugares.
//
// useAguaHoje continua separado de propósito: ele também é usado sozinho
// em ConsumoAguaScreen (que precisa de registrar()/salvarPesoAltura(), não
// só leitura), então uni-lo aqui duplicaria a lógica de escrita em dois
// lugares — o ganho de juntar os dois seria menor que o risco de divergir.
import { registrarDiaChamaDupla } from '../../social/services/chamaDuplaService';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useSemanaAtual } from './useSemanaAtual';
import { formatarDataISO } from '../../../../shared/utils/data';
import { calcularStatusDia, DiaSemana } from '../types/statusDia';
import { obterOuAtribuirMissaoDoDia, avaliarMissaoDoDia, concederPontosMissaoSeNecessario, MissaoDoDia } from '../services/missaoService';
import {
  calcularProximoEstadoSequencia,
  existeRegistroNoDia,
  obterDiasQueContaramParaSequencia,
} from '../services/sequenciaService';

export function useHomeData() {
  const { userId } = useAuth();
  const { dias, hojeISO } = useSemanaAtual();

  const [carregando, setCarregando] = useState(true);
  const [missao, setMissao] = useState<MissaoDoDia | null>(null);
  const [missaoConcluida, setMissaoConcluida] = useState(false);
  const [sequenciaAtual, setSequenciaAtual] = useState(0);
  const [maiorSequencia, setMaiorSequencia] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [diaDeHojeMantido, setDiaDeHojeMantido] = useState(false);
  const [diasComStatus, setDiasComStatus] = useState<DiaSemana[]>(
    dias.map((dia) => ({ ...dia, status: calcularStatusDia({ data: dia.data, hojeISO, mantido: false }) }))
  );

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const hoje = hojeISO;
      const ontem = formatarDataISO(new Date(Date.now() - 86400000));

      // 1. missão de hoje — buscada/avaliada UMA VEZ SÓ (era o ponto
      // duplicado entre useSequencia, useMissaoDoDia e useStatusSemana)
      const missaoDoDia = await obterOuAtribuirMissaoDoDia(userId, hoje);
      const missaoConcluidaHoje = await avaliarMissaoDoDia(userId, hoje, missaoDoDia);

      // concede os pontos da missão (só na primeira vez — ver comentário em
      // concederPontosMissaoSeNecessario) ANTES de ler xp_total logo abaixo,
      // pra esse total já vir atualizado nessa mesma passada
      if (missaoConcluidaHoje) {
        await concederPontosMissaoSeNecessario(userId, missaoDoDia.id, missaoDoDia.pontosRecompensa);
      }

      // hoje contou pra sequência se a missão foi cumprida OU há qualquer
      // outro registro no dia — só checa registro se a missão ainda não
      // bateu (mesmo curto-circuito que sequenciaService já usava)
      const hojeMantido = missaoConcluidaHoje || (await existeRegistroNoDia(userId, hoje));

      // 2. sequência: usa a função pura (testada em sequenciaService.test.ts),
      // alimentada com o hojeMantido que acabamos de calcular — sem
      // recalcular nada disso de novo
      //
      // xp_usuario é buscado em paralelo (tabela separada, sem dependência
      // do resto) — mostrado no header junto com a sequência
      const [{ data: perfil, error: erroPerfil }, { data: xp, error: erroXp }] = await Promise.all([
        supabase
          .from('profiles')
          .select('sequencia_atual, maior_sequencia, ultimo_dia_mantido')
          .eq('id', userId)
          .single(),
        supabase.from('xp_usuario').select('xp_total').eq('usuario_id', userId).maybeSingle(),
      ]);
      if (erroPerfil) throw erroPerfil;
      if (erroXp) throw erroXp;

      const proximoEstado = calcularProximoEstadoSequencia({
        sequenciaAtual: perfil.sequencia_atual,
        maiorSequencia: perfil.maior_sequencia,
        ultimoDiaMantido: perfil.ultimo_dia_mantido,
        hoje,
        ontem,
        hojeMantido,
      });

      if (proximoEstado.precisaSalvar) {
        const { error: erroUpdate } = await supabase
          .from('profiles')
          .update({
            sequencia_atual: proximoEstado.sequenciaAtual,
            maior_sequencia: proximoEstado.maiorSequencia,
            ultimo_dia_mantido: proximoEstado.novoUltimoDia,
          })
          .eq('id', userId);
        if (erroUpdate) throw erroUpdate;
      }

      // Chama em Dupla: avisa o banco que hoje foi cumprido (idempotente, não bloqueia a Home)
      if (hojeMantido) void registrarDiaChamaDupla();

      // 3. status da semana: busca em lote só os OUTROS dias (hoje já
      // sabemos, não manda ele de novo pro lote)
      const outrosDias = dias
        .filter((dia) => dia.data <= hoje && dia.data !== hoje)
        .map((dia) => dia.data);
      const diasMantidosOutros = await obterDiasQueContaramParaSequencia(userId, outrosDias);
      const diasMantidos = new Set(diasMantidosOutros);
      if (hojeMantido) diasMantidos.add(hoje);

      setMissao(missaoDoDia);
      setMissaoConcluida(missaoConcluidaHoje);
      setSequenciaAtual(proximoEstado.sequenciaAtual);
      setMaiorSequencia(proximoEstado.maiorSequencia);
      setXpTotal(xp?.xp_total ?? 0);
      setDiaDeHojeMantido(hojeMantido);
      setDiasComStatus(
        dias.map((dia) => ({
          ...dia,
          status: calcularStatusDia({ data: dia.data, hojeISO: hoje, mantido: diasMantidos.has(dia.data) }),
        }))
      );
    } catch (erro) {
      console.error('Erro ao carregar dados da Home:', erro);
    } finally {
      setCarregando(false);
    }
  }, [userId, dias, hojeISO]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  return {
    carregando,
    missao,
    missaoConcluida,
    sequenciaAtual,
    maiorSequencia,
    xpTotal,
    diaDeHojeMantido,
    dias: diasComStatus,
    hojeISO,
    recarregar: carregar,
  };
}
