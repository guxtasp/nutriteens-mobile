// src/features/adolescente/screens/HomeScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
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
import MissoesWidget from '../../missoes/components/MissoesWidget';
import CartaoMetricasHome from '../../metricas/components/CartaoMetricasHome';
import CelebracaoSequenciaModal from '../components/CelebracaoSequenciaModal';
import PerdaSequenciaOverlay from '../components/PerdaSequenciaOverlay';
import AniversarioModal from '../components/AniversarioModal';
import BoasVindasModal from '../components/BoasVindasModal';
import { useBoasVindas } from '../hooks/useBoasVindas';
import { useHomeData } from '../hooks/useHomeData';
import { useAniversario } from '../hooks/useAniversario';
import { useRetrospectivaAno } from '../hooks/useRetrospectivaAno';
import { colors } from '../../../../shared/theme/colors';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useAguaHoje } from '../../agua/hooks/useAguaHoje';
import { jaMostrouCelebracaoHoje, marcarCelebracaoMostrada } from '../utils/celebracaoGate';
import { obterConteudoCelebracao } from '../utils/celebracaoSequencia';
import { detectarPerdaSequencia } from '../utils/perdaSequencia';
import { lerUltimaSequenciaVista, salvarUltimaSequenciaVista } from '../utils/perdaSequenciaStorage';
import { concederXp } from '../../../../shared/services/xpService';
import AvisoModeracaoModal from '../../social/components/AvisoModeracaoModal';
import { useSituacaoModeracao } from '../../social/hooks/useSituacaoModeracao';
import { useRecompensasStore } from '../../recompensas/store/recompensasStore';
import { TourAlvo, useTourRolagem } from '../../tour/TourContext';
import { useTourPrimeiroAcesso } from '../../tour/useTourPrimeiroAcesso';

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
    dadosCarregados,
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
  const scrollRef = useRef<ScrollView>(null);
  useTourRolagem(scrollRef);
  const { situacao: situacaoModeracao, dispensarAviso } = useSituacaoModeracao();
  const { nomeCompleto, userId, session } = useAuth();
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
  // enquanto a celebração de sequência está sendo preparada ou na tela, a fila de recompensas
  // (cartas, insígnias...) espera, pra duas animações nunca aparecerem juntas
  const [verificandoCelebracao, setVerificandoCelebracao] = useState(false);
  const pausarRecompensas = useRecompensasStore((s) => s.pausar);
  const retomarRecompensas = useRecompensasStore((s) => s.retomar);

  useEffect(() => {
    if (celebracaoVisivel || verificandoCelebracao) pausarRecompensas('sequencia');
    else retomarRecompensas('sequencia');
    return () => retomarRecompensas('sequencia');
  }, [celebracaoVisivel, verificandoCelebracao, pausarRecompensas, retomarRecompensas]);

  useEffect(() => {
    if (!diaDeHojeMantido || !userId || !hojeISO) return;
    if (celebracaoEmAndamentoRef.current) return;

    let cancelado = false;
    celebracaoEmAndamentoRef.current = true;
    setVerificandoCelebracao(true);

    (async () => {
      try {
        const jaMostrou = await jaMostrouCelebracaoHoje(userId, hojeISO);
        if (jaMostrou || cancelado) return;

        await marcarCelebracaoMostrada(userId, hojeISO);

        const conteudo = obterConteudoCelebracao(sequenciaAtual);
        if (conteudo.xpGanho > 0) {
          try {
            // o servidor confere o marco e o valor; a data é a chave que impede pagar duas vezes
            await concederXp('marco_sequencia', hojeISO);
            recarregar(); // atualiza o contador de XP do header na hora, sem esperar o próximo foco
          } catch (erro) {
            console.error('Erro ao conceder XP da celebração de sequência:', erro);
          }
        }

        if (!cancelado) setCelebracaoVisivel(true);
      } finally {
        celebracaoEmAndamentoRef.current = false;
        setVerificandoCelebracao(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [diaDeHojeMantido, userId, hojeISO, sequenciaAtual]);

  // --- perda de sequência ---
  //
  // Compara a sequência de agora com a última que o aluno viu neste aparelho (ver
  // perdaSequencia.ts). Só roda depois de uma carga bem-sucedida: antes disso os números
  // são os iniciais (0) e pareceriam uma perda falsa. A "última vista" é gravada ANTES de
  // mostrar a animação, então fechar o app no meio não faz ela repetir na próxima abertura.
  //
  // Só mostra com o dia de hoje ainda pendente (o caso normal: abriu o app depois de
  // faltar um dia). Se hoje já contou, a celebração do foguinho assume a tela, e duas
  // animações cheias nunca devem aparecer juntas.
  const [perdaVisivel, setPerdaVisivel] = useState(false);
  const [diasPerdidos, setDiasPerdidos] = useState(0);
  // vira true depois da primeira checagem de perda terminar (com ou sem aviso) — o aniversário
  // espera por isso para nunca competir com o aviso de perda, que decide de forma assíncrona
  const [perdaVerificada, setPerdaVerificada] = useState(false);

  useEffect(() => {
    if (perdaVisivel) pausarRecompensas('perda');
    else retomarRecompensas('perda');
    return () => retomarRecompensas('perda');
  }, [perdaVisivel, pausarRecompensas, retomarRecompensas]);

  useEffect(() => {
    if (!dadosCarregados || !userId) return;
    let cancelado = false;

    (async () => {
      const ultimaVista = await lerUltimaSequenciaVista(userId);
      if (cancelado) return; // a dependência mudou durante a leitura: a próxima execução refaz tudo

      const { perdeu, diasPerdidos: perdidos } = detectarPerdaSequencia(ultimaVista, sequenciaAtual);
      await salvarUltimaSequenciaVista(userId, sequenciaAtual);

      if (perdeu && !diaDeHojeMantido) {
        setDiasPerdidos(perdidos);
        setPerdaVisivel(true);
      }
      setPerdaVerificada(true);
    })();

    return () => {
      cancelado = true;
    };
  }, [dadosCarregados, userId, sequenciaAtual, diaDeHojeMantido]);

  // --- boas-vindas do primeiro acesso ---
  //
  // Tela de boas-vindas do Bróxis na primeira vez que a conta nova abre a Home (uma vez só,
  // só para contas criadas há poucos dias). Mesma regra de fila das outras: espera a celebração
  // de sequência e o aviso de perda terminarem. Sem XP (ver useBoasVindas.ts).
  const podeMostrarAnimacaoCheia =
    dadosCarregados && perdaVerificada && !celebracaoVisivel && !verificandoCelebracao && !perdaVisivel;
  const boasVindas = useBoasVindas({
    userId,
    contaCriadaEm: session?.user.created_at,
    hojeISO,
    primeiroNome: nomeCompleto?.trim().split(' ')[0] || null,
    podeMostrar: podeMostrarAnimacaoCheia,
  });

  useEffect(() => {
    if (boasVindas.pendente) pausarRecompensas('boasvindas');
    else retomarRecompensas('boasvindas');
    return () => retomarRecompensas('boasvindas');
  }, [boasVindas.pendente, pausarRecompensas, retomarRecompensas]);

  // --- feliz aniversário ---
  //
  // Mensagem do Bróxis no dia do aniversário (ou até 3 dias depois), uma vez por ano. Fica
  // pendente enquanto a celebração de sequência, o aviso de perda ou as boas-vindas estão na
  // tela e aparece quando terminam: duas animações cheias nunca juntas. Sem XP (ver useAniversario.ts).
  const aniversario = useAniversario({
    userId,
    hojeISO,
    primeiroNome: nomeCompleto?.trim().split(' ')[0] || null,
    podeMostrar: podeMostrarAnimacaoCheia && !boasVindas.pendente,
  });

  // --- tour de apresentação ---
  //
  // Continuação das boas-vindas: assim que o aluno fecha o modal (e nenhuma outra animação cheia
  // está na fila), o Bróxis oferece um tour opcional. Ver tour/useTourPrimeiroAcesso.ts.
  useTourPrimeiroAcesso({
    userId,
    boasVindasPendente: boasVindas.pendente,
    podeIniciar: podeMostrarAnimacaoCheia && !aniversario.pendente,
  });

  // retrospectiva do ano: só consulta quando a mensagem de aniversário está na tela
  const retrospectivaAno = useRetrospectivaAno(userId, hojeISO, aniversario.visivel);

  useEffect(() => {
    if (aniversario.pendente) pausarRecompensas('aniversario');
    else retomarRecompensas('aniversario');
    return () => retomarRecompensas('aniversario');
  }, [aniversario.pendente, pausarRecompensas, retomarRecompensas]);

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else if (opcao === 'alimentacao') navigation.navigate('TipoRefeicao');
  }

  return (
    <SafeAreaView style={styles.tela}>
      {/* rolável: a barra de baixo e os botões flutuantes ficam fixos por cima */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={recarregar} tintColor={colors.primaryDark} />}
      >
      <HomeHeader nome={primeiroNome} pontos={xpTotal} sequenciaAtual={sequenciaAtual} />
      <TourAlvo id="semana">
        <WeekDaySelector dias={diasComStatus} />
      </TourAlvo>

      <WaterProgressCard mlAtual={mlHoje} mlMeta={metaMl} />

      {missao && <MissoesWidget missao={missao} concluida={missaoConcluida} onPress={() => navigation.navigate('Missoes')} />}
      <CartaoMetricasHome onPress={() => navigation.navigate('Metricas')} />
      </ScrollView>

      {!menuAberto && <ChatFab />}
      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="inicio" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />

      <CelebracaoSequenciaModal
        visivel={celebracaoVisivel}
        sequenciaAtual={sequenciaAtual}
        dias={diasComStatus}
        onFechar={() => setCelebracaoVisivel(false)}
      />

      <PerdaSequenciaOverlay
        visivel={perdaVisivel}
        diasPerdidos={diasPerdidos}
        onFinalizado={() => setPerdaVisivel(false)}
      />

      <AvisoModeracaoModal aviso={situacaoModeracao.aviso} onEntendi={dispensarAviso} />

      <BoasVindasModal visivel={boasVindas.visivel} mensagem={boasVindas.mensagem} onFechar={boasVindas.fechar} />

      <AniversarioModal
        visivel={aniversario.visivel}
        mensagem={aniversario.mensagem}
        retrospectiva={retrospectivaAno}
        onFechar={aniversario.fechar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#A9C7B8' },
  // espaço no fim para o último card não ficar escondido atrás da barra inferior/FAB
  conteudo: { paddingBottom: 170 },
  
});