// src/features/adolescente/screens/HomeScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import HomeHeader from '../components/HomeHeader';
import WeekDaySelector from '../components/WeekDaySelector';
import WaterProgressCard from '../../agua/components/WaterProgressCard';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import ChatFab from '../../_shared/components/ChatFab';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import MissaoDoDiaCard from '../../home/components/MissaoDoDiaCard';
import CelebracaoSequenciaModal from '../components/CelebracaoSequenciaModal';
import { useHomeData } from '../hooks/useHomeData';
import { colors } from '../../../../shared/theme/colors';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useAguaHoje } from '../../agua/hooks/useAguaHoje';
import { jaMostrouCelebracaoHoje, marcarCelebracaoMostrada } from '../utils/celebracaoGate';
import { obterConteudoCelebracao } from '../utils/celebracaoSequencia';
import { concederXp } from '../../../../shared/services/xpService';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'Home'>;

export default function HomeScreen() {
  // DIAGNÓSTICO TEMPORÁRIO — remover depois de confirmar a causa do "sempre
  // recarrega". Se o número do id mudar no log toda vez que você volta pra
  // Home trocando de aba, a tela está REMONTANDO (não é só um refetch).
  // Se o id continuar o mesmo, não é remount — a causa é outra.
  const instanciaId = useRef(Math.floor(Math.random() * 100000)).current;
  console.log(`[HomeScreen] renderizou — instância #${instanciaId}`);
  useEffect(() => {
    console.log(`[HomeScreen] MONTOU — instância #${instanciaId}`);
    return () => console.log(`[HomeScreen] DESMONTOU — instância #${instanciaId}`);
  }, []);

  const navigation = useNavigation<NavigationProp>();
  const {
    dias: diasComStatus,
    sequenciaAtual,
    missao,
    missaoConcluida,
    diaDeHojeMantido,
    hojeISO,
    xpTotal,
    recarregar,
  } = useHomeData();
  const [menuAberto, setMenuAberto] = useState(false);
  const { nomeCompleto, userId } = useAuth();
  const primeiroNome = nomeCompleto?.trim().split(' ')[0] ?? 'Usuário';
  const { mlHoje, metaMl } = useAguaHoje();

  // --- celebração de sequência ---
  //
  // O gate (jaMostrouCelebracaoHoje/marcarCelebracaoMostrada) decide "mostrar
  // ou não", nunca a transição false->true de diaDeHojeMantido — a Home
  // remonta/refoca com frequência (ver o diagnóstico acima) e rastrear
  // transição de estado entre montagens é frágil. O ponto que antes causava
  // a tela reaparecer em loop até apertar o botão: a marcação de "já
  // mostrado" só acontecia depois (no fechamento do modal ou junto do XP),
  // então cada remontagem via o gate ainda "livre" e reabria a celebração.
  // Agora a marcação roda ANTES de conceder XP e mostrar o modal — fecha essa
  // janela de corrida, então mesmo remontando no meio do processo a próxima
  // checagem já vê "mostrado" e não duplica nada.
  const [celebracaoVisivel, setCelebracaoVisivel] = useState(false);
  const celebracaoEmAndamentoRef = useRef(false);

  useEffect(() => {
    if (!diaDeHojeMantido || !userId || !hojeISO) return;
    if (celebracaoEmAndamentoRef.current) return;

    let cancelado = false;
    celebracaoEmAndamentoRef.current = true;

    (async () => {
      try {
        const jaMostrou = await jaMostrouCelebracaoHoje(userId, hojeISO);
        if (jaMostrou || cancelado) return;

        await marcarCelebracaoMostrada(userId, hojeISO);

        const conteudo = obterConteudoCelebracao(sequenciaAtual);
        if (conteudo.xpGanho > 0) {
          try {
            await concederXp(userId, conteudo.xpGanho);
            recarregar(); // atualiza o contador de XP do header na hora, sem esperar o próximo foco
          } catch (erro) {
            console.error('Erro ao conceder XP da celebração de sequência:', erro);
          }
        }

        if (!cancelado) setCelebracaoVisivel(true);
      } finally {
        celebracaoEmAndamentoRef.current = false;
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [diaDeHojeMantido, userId, hojeISO, sequenciaAtual]);

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else if (opcao === 'alimentacao') navigation.navigate('TipoRefeicao');
  }

  return (
    <SafeAreaView style={styles.tela}>
      <HomeHeader nome={primeiroNome} pontos={xpTotal} sequenciaAtual={sequenciaAtual} />
      <WeekDaySelector dias={diasComStatus} />

      {missao && <MissaoDoDiaCard missao={missao} concluida={missaoConcluida} />}

      <WaterProgressCard mlAtual={mlHoje} mlMeta={metaMl} />

      <View style={{ flex: 1 }} />

      {!menuAberto && <ChatFab />}
      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="inicio" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />

      <CelebracaoSequenciaModal
        visivel={celebracaoVisivel}
        sequenciaAtual={sequenciaAtual}
        dias={diasComStatus}
        onFechar={() => setCelebracaoVisivel(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#A9C7B8' },
  
});