// src/features/adolescente/trilha/screens/TrilhaScreen.tsx
//
// Caminho contínuo de aprendizado sobre fundo branco (estilo Duolingo):
// barra de sequência/XP no topo, faixa verde FIXA com o módulo que está na
// vista (troca conforme o usuário rola) e o caminho de nós logo abaixo
// (TrilhaCaminho). A tela abre já rolada até o nó atual.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../../shared/hooks/useMessageBanner';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { formatarDataISO } from '../../../../shared/utils/data';
import { supabase } from '../../../../lib/supabase';
import { GrupoModuloTrilha, NoTrilha, TrilhaCaminho } from '../components/TrilhaPath';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { buscarTrilhaComProgresso, ModuloDaTrilha, Trilha, LicaoDaTrilha } from '../services/trilhaService';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;
const LICOES_POR_MODULO = 5;

export default function TrilhaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();
  const { message, type, showMessage, clearMessage } = useMessageBanner();

  const [menuAberto, setMenuAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [trilha, setTrilha] = useState<Trilha | null>(null);
  const [modulos, setModulos] = useState<ModuloDaTrilha[]>([]);
  const [nos, setNos] = useState<NoTrilha[]>([]);
  const [licoes, setLicoes] = useState<LicaoDaTrilha[]>([]);
  const [xpTotal, setXpTotal] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  // módulo que está na vista (null = ainda não rolou: usa o do nó atual)
  const [moduloVisivelId, setModuloVisivelId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const offsetsModulosRef = useRef<Record<string, number>>({});
  const jaRolouAteAtualRef = useRef(false);

  // Sequência e XP do cabeçalho. Falhar aqui não pode derrubar a trilha, por
  // isso fica fora do try principal. A sequência vem direto do perfil: vale
  // se o último dia mantido foi hoje ou ontem (senão a sequência quebrou) —
  // a Home é quem grava/atualiza esse valor.
  const carregarEstatisticas = useCallback(async () => {
    if (!userId) return;
    try {
      const [{ data: perfil, error: erroPerfil }, { data: xp, error: erroXp }] = await Promise.all([
        supabase.from('profiles').select('sequencia_atual, ultimo_dia_mantido').eq('id', userId).single(),
        supabase.from('xp_usuario').select('xp_total').eq('usuario_id', userId).maybeSingle(),
      ]);
      if (erroPerfil) throw erroPerfil;
      if (erroXp) throw erroXp;

      const hoje = formatarDataISO(new Date());
      const ontem = formatarDataISO(new Date(Date.now() - 86400000));
      const ativa = perfil.ultimo_dia_mantido === hoje || perfil.ultimo_dia_mantido === ontem;
      setSequencia(ativa ? perfil.sequencia_atual ?? 0 : 0);
      setXpTotal(xp?.xp_total ?? 0);
    } catch (erro) {
      console.error('Erro ao carregar sequência/XP da trilha:', erro);
    }
  }, [userId]);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    jaRolouAteAtualRef.current = false;
    carregarEstatisticas();
    try {
      const resultado = await buscarTrilhaComProgresso(userId);
      setTrilha(resultado?.trilha ?? null);
      setModulos(resultado?.modulos ?? []);
      setNos(resultado?.nos ?? []);
      setLicoes(resultado?.licoes ?? []);
    } catch (erro) {
      console.error('Erro ao carregar trilha:', erro);
      showMessage('Não foi possível carregar sua trilha agora.', 'error');
    } finally {
      setCarregando(false);
    }
  }, [userId, showMessage, carregarEstatisticas]);

  // recarrega toda vez que a aba ganha foco, pra refletir lição recém-concluída
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  // Nó "atual" que também é uma Prática Real (ver seção 5 do
  // modelo-pedagogico-trilha.md) — usado só pro banner de lembrete abaixo
  // do título. O estado visual em si (anel âmbar) já é resolvido dentro do
  // NosDoModulo a partir do `tipo` de cada nó.
  const noPraticaPendente = useMemo(
    () => nos.find((n) => n.status === 'atual' && n.tipo === 'atividade_rastreavel'),
    [nos]
  );
  const licaoPraticaPendente = useMemo(
    () => (noPraticaPendente ? licoes.find((l) => l.id === noPraticaPendente.id) : undefined),
    [noPraticaPendente, licoes]
  );

  // O caminho é contínuo, como no layout de referência. O serviço já entrega
  // os nós na ordem correta; aqui só os agrupa para inserir os divisores de
  // módulo e o cenário de obstáculos a partir do segundo módulo.
  const grupos = useMemo<GrupoModuloTrilha[]>(
    () =>
      modulos.map((modulo, indiceModulo) => {
        const nosDoModulo = nos.filter((no) => no.moduloId === modulo.id);

        // Enquanto o banco estiver sendo povoado, completa visualmente os
        // cinco espaços do módulo só no build de desenvolvimento. Essas
        // posições não representam lições reais e não podem ser concluídas.
        const espacosDeTeste: NoTrilha[] = __DEV__
          ? Array.from({ length: Math.max(0, LICOES_POR_MODULO - nosDoModulo.length) }, (_, indice) => ({
              id: `visual-${modulo.id}-${indice + 1}`,
              moduloId: modulo.id,
              status: nosDoModulo.length === 0 && indiceModulo === 0 && indice === 0 ? 'atual' : 'bloqueada',
              tipo: 'conteudo' as const,
            }))
          : [];

        return {
          moduloId: modulo.id,
          titulo: modulo.titulo,
          nos: [...nosDoModulo, ...espacosDeTeste],
        };
      }),
    [modulos, nos]
  );

  const moduloEmDestaque = useMemo(() => {
    const noAtual = nos.find((no) => no.status === 'atual');
    return modulos.find((modulo) => modulo.id === noAtual?.moduloId) ?? modulos[modulos.length - 1] ?? null;
  }, [modulos, nos]);

  // progresso (concluídas/total) de cada módulo, mostrado na faixa fixa
  const progressoPorModulo = useMemo(() => {
    const mapa: Record<string, { feitas: number; total: number }> = {};
    nos.forEach((no) => {
      const atual = mapa[no.moduloId] ?? { feitas: 0, total: 0 };
      atual.total += 1;
      if (no.status === 'concluida') atual.feitas += 1;
      mapa[no.moduloId] = atual;
    });
    return mapa;
  }, [nos]);

  const moduloNaFaixa = useMemo(
    () => modulos.find((m) => m.id === moduloVisivelId) ?? moduloEmDestaque,
    [modulos, moduloVisivelId, moduloEmDestaque]
  );

  const aoMedirGrupos = useCallback((offsets: Record<string, number>) => {
    offsetsModulosRef.current = offsets;
  }, []);

  // abre já rolado até o nó atual (uma vez por carregamento)
  const aoMedirNoAtual = useCallback((y: number) => {
    if (jaRolouAteAtualRef.current) return;
    jaRolouAteAtualRef.current = true;
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 280), animated: false }), 50);
  }, []);

  // troca o módulo da faixa fixa quando o início de outro módulo chega ao topo
  function aoRolar(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    let escolhido: string | null = null;
    let melhor = -Infinity;
    Object.entries(offsetsModulosRef.current).forEach(([id, offset]) => {
      if (offset <= y + 60 && offset > melhor) {
        melhor = offset;
        escolhido = id;
      }
    });
    if (!escolhido) escolhido = modulos[0]?.id ?? null;
    setModuloVisivelId((anterior) => (anterior === escolhido ? anterior : escolhido));
  }

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else if (opcao === 'alimentacao') navigation.navigate('TipoRefeicao');
  }

  function onPressNo(no: NoTrilha) {
    if (no.status === 'bloqueada') return;

    if (no.id.startsWith('visual-')) {
      showMessage('Esta lição é apenas uma posição de teste. Cadastre o conteúdo no banco para liberá-la.', 'info');
      return;
    }

    const licao = licoes.find((l) => l.id === no.id);
    if (!licao) {
      console.warn('Lição não encontrada na lista carregada:', no.id);
      showMessage('Não foi possível abrir essa lição.', 'error');
      return;
    }

    navigation.navigate('LicaoDetalhe', {
      licaoId: licao.id,
      tipo: licao.tipo,
      titulo: licao.titulo,
      xpRecompensa: licao.xpRecompensa,
    });
  }

  function abrirPraticaPendente() {
    if (!licaoPraticaPendente) return;
    navigation.navigate('LicaoDetalhe', {
      licaoId: licaoPraticaPendente.id,
      tipo: licaoPraticaPendente.tipo,
      titulo: licaoPraticaPendente.titulo,
      xpRecompensa: licaoPraticaPendente.xpRecompensa,
    });
  }

  const progressoDaFaixa = moduloNaFaixa ? progressoPorModulo[moduloNaFaixa.id] : undefined;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <View style={styles.estatisticas}>
        <View style={styles.chip}>
          <Ionicons name="leaf" size={22} color={colors.primary} />
          <AppText numberOfLines={1} style={[styles.chipTexto, styles.chipTrilha]}>
            {trilha?.titulo ?? 'Trilha'}
          </AppText>
        </View>
        <View style={styles.chip} accessibilityLabel={`Sequência de ${sequencia} dias`}>
          <Ionicons name="flame" size={22} color={colors.trilhaFogo} />
          <AppText style={styles.chipTexto}>{sequencia}</AppText>
        </View>
        <View style={styles.chip} accessibilityLabel={`${xpTotal} pontos de experiência`}>
          <Ionicons name="flash" size={22} color={colors.info} />
          <AppText style={styles.chipTexto}>{xpTotal}</AppText>
        </View>
      </View>

      {!!moduloNaFaixa && !carregando && (
        <View style={styles.faixa}>
          <View style={styles.faixaTextos}>
            <AppText style={styles.faixaRotulo}>{moduloNaFaixa.titulo}</AppText>
            <AppText numberOfLines={2} style={styles.faixaTitulo}>
              {trilha?.titulo ?? moduloNaFaixa.subtitulo}
            </AppText>
          </View>
          {!!progressoDaFaixa && progressoDaFaixa.total > 0 && (
            <>
              <View style={styles.faixaDivisor} />
              <View style={styles.faixaProgresso}>
                <AppText style={styles.faixaProgressoNumero}>
                  {progressoDaFaixa.feitas}/{progressoDaFaixa.total}
                </AppText>
                <AppText style={styles.faixaProgressoRotulo}>lições</AppText>
              </View>
            </>
          )}
        </View>
      )}

      <MessageBanner message={message} type={type} onClose={clearMessage} />

      {!!licaoPraticaPendente && (
        <Pressable style={styles.bannerPendente} onPress={abrirPraticaPendente}>
          <Ionicons name="hand-left-outline" size={20} color={colors.warningShadow} />
          <View style={styles.bannerTextos}>
            <AppText style={styles.bannerTitulo}>Prática Real pendente</AppText>
            <AppText style={styles.bannerSubtitulo}>
              Falta registrar "{licaoPraticaPendente.titulo}" pra fechar essa lição. Continua valendo hoje.
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.warningShadow} />
        </Pressable>
      )}

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : modulos.length === 0 ? (
        <View style={styles.centro}>
          <AppText style={styles.vazioTitulo}>Nenhuma trilha disponível ainda</AppText>
          <AppText style={styles.vazioSubtitulo}>Assim que uma trilha for aprovada, ela aparece por aqui.</AppText>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollConteudo}
          onScroll={aoRolar}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <TrilhaCaminho
            grupos={grupos}
            onPressNo={onPressNo}
            onMedirGrupos={aoMedirGrupos}
            onMedirNoAtual={aoMedirNoAtual}
          />
        </ScrollView>
      )}

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="trilha" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },

  estatisticas: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.trilhaChipTexto },
  chipTrilha: { maxWidth: 130 },

  // faixa fixa do módulo (fica parada enquanto o caminho rola por baixo)
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderBottomWidth: 5,
    borderBottomColor: colors.primaryShadow,
  },
  faixaTextos: { flex: 1 },
  faixaRotulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark, opacity: 0.8 },
  faixaTitulo: { fontFamily: typography.bold, fontSize: 19, color: colors.primaryDark, marginTop: 2 },
  faixaDivisor: {
    width: 2,
    alignSelf: 'stretch',
    marginHorizontal: 14,
    borderRadius: 1,
    backgroundColor: colors.primaryShadow,
    opacity: 0.45,
  },
  faixaProgresso: { alignItems: 'center', minWidth: 44 },
  faixaProgressoNumero: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  faixaProgressoRotulo: { fontFamily: typography.medium, fontSize: 11, color: colors.primaryDark, opacity: 0.8 },

  bannerPendente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  bannerTextos: { flex: 1 },
  bannerTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.warningShadow },
  bannerSubtitulo: { fontFamily: typography.regular, fontSize: 12, color: colors.warningShadow, marginTop: 2, lineHeight: 16 },

  scroll: { flex: 1 },
  scrollConteudo: { paddingBottom: 104 },

  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  vazioTitulo: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  vazioSubtitulo: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: '#7A8B94',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
});
