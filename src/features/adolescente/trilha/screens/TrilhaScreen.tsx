// src/features/adolescente/trilha/screens/TrilhaScreen.tsx
//
// Caminho contínuo de aprendizado sobre fundo levemente esverdeado:
// barra de sequência/XP no topo, faixa FIXA em verde-claro com a TRILHA (a "unidade"),
// o módulo e o progresso que estão na vista (troca conforme o usuário rola) e o caminho
// de nós (TrilhaCaminho) logo abaixo. TODAS as trilhas aprovadas aparecem em sequência:
// terminou uma, o caminho segue para a próxima. A tela abre já rolada até o nó atual.
// A identidade visual (cores, aros, pontinhos) fica em ../ui/tema.ts.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../../shared/hooks/useMessageBanner';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { formatarDataISO } from '../../../../shared/utils/data';
import { supabase } from '../../../../lib/supabase';
import { GrupoModuloTrilha, NoTrilha, TrilhaCaminho } from '../components/TrilhaPath';
import { ItemSeletorTrilha, SeletorTrilhas } from '../components/SeletorTrilhas';
import { statusDaTrilha } from '../utils/sequenciaTrilhas';
import { TEMA_TRILHA as T } from '../ui/tema';
import EstatisticaPill from '../../home/components/EstatisticaPill';
import TabHeader from '../../_shared/components/TabHeader';
import { SinoNotificacoes } from '../../notificacoes/components/SinoNotificacoes';
import { layout } from '../../../../shared/theme/layout';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { buscarTrilhasComProgresso, ModuloDaTrilha, Trilha, LicaoDaTrilha } from '../services/trilhaService';
import { registrarEvento } from '../../../../shared/analytics/analytics';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;
const LICOES_POR_MODULO = 5;

// mesmas cores e ícones do cabeçalho da Home (HomeHeader): XP = presente verde,
// sequência = chama laranja
const COR_XP = colors.primary;
const COR_SEQUENCIA = '#EA580C';

export default function TrilhaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();
  const { message, type, showMessage, clearMessage } = useMessageBanner();

  const [menuAberto, setMenuAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [modulos, setModulos] = useState<ModuloDaTrilha[]>([]);
  const [nos, setNos] = useState<NoTrilha[]>([]);
  const [licoes, setLicoes] = useState<LicaoDaTrilha[]>([]);
  const [xpTotal, setXpTotal] = useState(0);
  const [sequencia, setSequencia] = useState(0);
  // módulo que está na vista (null = ainda não rolou: usa o do nó atual)
  const [moduloVisivelId, setModuloVisivelId] = useState<string | null>(null);
  // lista de trilhas (abre ao tocar na faixa do topo)
  const [seletorAberto, setSeletorAberto] = useState(false);
  // o nó atual saiu da tela? (botão flutuante "voltar à lição atual")
  const [direcaoAtual, setDirecaoAtual] = useState<'cima' | 'baixo' | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const offsetsModulosRef = useRef<Record<string, number>>({});
  const jaRolouAteAtualRef = useRef(false);
  const yAtualRef = useRef<number | null>(null);
  const alturaScrollRef = useRef(600);

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

  const trilhaVistaRef = useRef<string | null>(null);
  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    jaRolouAteAtualRef.current = false;
    carregarEstatisticas();
    try {
      const resultado = await buscarTrilhasComProgresso(userId);
      setTrilhas(resultado.trilhas);
      // evento da trilha em andamento (a do nó atual; terminou tudo = a última)
      const moduloAtual = resultado.nos.find((no) => no.status === 'atual')?.moduloId;
      const tid =
        resultado.modulos.find((m) => m.id === moduloAtual)?.trilhaId ??
        resultado.trilhas[resultado.trilhas.length - 1]?.id;
      if (tid && trilhaVistaRef.current !== tid) {
        trilhaVistaRef.current = tid;
        registrarEvento('trilha_visualizada', { trilha_id: tid });
      }
      setModulos(resultado.modulos);
      setNos(resultado.nos);
      setLicoes(resultado.licoes);
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
  // os nós na ordem correta (todas as trilhas, uma depois da outra); aqui só os
  // agrupa por módulo para inserir os divisores de módulo e de trilha.
  const grupos = useMemo<GrupoModuloTrilha[]>(
    () =>
      modulos.map((modulo, indiceModulo) => {
        const indiceTrilha = Math.max(0, trilhas.findIndex((t) => t.id === modulo.trilhaId));
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
          trilhaId: modulo.trilhaId,
          tituloTrilha: trilhas[indiceTrilha]?.titulo ?? '',
          numeroTrilha: indiceTrilha + 1,
          inicioDeTrilha: indiceModulo === 0 || modulos[indiceModulo - 1].trilhaId !== modulo.trilhaId,
          nos: [...nosDoModulo, ...espacosDeTeste],
        };
      }),
    [modulos, nos, trilhas]
  );

  const moduloEmDestaque = useMemo(() => {
    const noAtual = nos.find((no) => no.status === 'atual');
    return modulos.find((modulo) => modulo.id === noAtual?.moduloId) ?? modulos[modulos.length - 1] ?? null;
  }, [modulos, nos]);

  // progresso (concluídas/total) de cada TRILHA, mostrado na faixa fixa
  const progressoPorTrilha = useMemo(() => {
    const trilhaDoModulo = new Map(modulos.map((m) => [m.id, m.trilhaId]));
    const mapa: Record<string, { feitas: number; total: number }> = {};
    nos.forEach((no) => {
      const trilhaId = trilhaDoModulo.get(no.moduloId);
      if (!trilhaId) return;
      const atual = mapa[trilhaId] ?? { feitas: 0, total: 0 };
      atual.total += 1;
      if (no.status === 'concluida') atual.feitas += 1;
      mapa[trilhaId] = atual;
    });
    return mapa;
  }, [nos, modulos]);

  const moduloNaFaixa = useMemo(
    () => modulos.find((m) => m.id === moduloVisivelId) ?? moduloEmDestaque,
    [modulos, moduloVisivelId, moduloEmDestaque]
  );
  const trilhaNaFaixa = useMemo(
    () => trilhas.find((t) => t.id === moduloNaFaixa?.trilhaId) ?? null,
    [trilhas, moduloNaFaixa]
  );
  const numeroTrilhaNaFaixa = trilhaNaFaixa ? trilhas.findIndex((t) => t.id === trilhaNaFaixa.id) + 1 : 0;

  const aoMedirGrupos = useCallback((offsets: Record<string, number>) => {
    offsetsModulosRef.current = offsets;
  }, []);

  // abre já rolado até o nó atual (uma vez por carregamento)
  const atualizarDirecaoAtual = useCallback((scrollY: number) => {
    const yAtual = yAtualRef.current;
    if (yAtual === null) return setDirecaoAtual(null);
    const margem = 60;
    if (yAtual + margem < scrollY) setDirecaoAtual('cima');
    else if (yAtual - margem > scrollY + alturaScrollRef.current) setDirecaoAtual('baixo');
    else setDirecaoAtual(null);
  }, []);

  const aoMedirNoAtual = useCallback(
    (y: number) => {
      yAtualRef.current = y;
      if (jaRolouAteAtualRef.current) return;
      jaRolouAteAtualRef.current = true;
      const alvo = Math.max(0, y - 280);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: alvo, animated: false });
        atualizarDirecaoAtual(alvo);
      }, 50);
    },
    [atualizarDirecaoAtual]
  );

  function irParaAtual() {
    const y = yAtualRef.current;
    if (y === null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 280), animated: true });
  }

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
    atualizarDirecaoAtual(y);
  }

  // uma linha por trilha para a lista da faixa do topo (só trilhas com lições)
  const itensSeletor = useMemo<ItemSeletorTrilha[]>(() => {
    const trilhaDoModulo = new Map(modulos.map((m) => [m.id, m.trilhaId]));
    return trilhas
      .map((trilha, indice) => {
        const nosDaTrilha = nos.filter((no) => trilhaDoModulo.get(no.moduloId) === trilha.id);
        const progresso = progressoPorTrilha[trilha.id];
        return {
          id: trilha.id,
          numero: indice + 1,
          titulo: trilha.titulo,
          descricao: trilha.descricao,
          feitas: progresso?.feitas ?? 0,
          total: progresso?.total ?? 0,
          status: statusDaTrilha(nosDaTrilha.map((no) => no.status)),
        };
      })
      .filter((item) => item.total > 0);
  }, [trilhas, modulos, nos, progressoPorTrilha]);

  // trilha bloqueada nem chega aqui (o cartão não responde ao toque), mas
  // confere de novo por segurança
  function aoEscolherTrilha(item: ItemSeletorTrilha) {
    if (item.status === 'bloqueada') return;
    setSeletorAberto(false);
    if (item.status === 'atual') {
      irParaAtual();
      return;
    }
    // concluída: vai para o começo dela (o divisor da trilha; a 1ª, para o topo)
    const primeiroModulo = modulos.find((m) => m.trilhaId === item.id);
    const offset = primeiroModulo ? offsetsModulosRef.current[primeiroModulo.id] : undefined;
    scrollRef.current?.scrollTo({ y: item.numero === 1 ? 0 : Math.max(0, offset ?? 0), animated: true });
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

  const progressoDaFaixa = trilhaNaFaixa ? progressoPorTrilha[trilhaNaFaixa.id] : undefined;
  const podeEscolherTrilha = itensSeletor.length > 1;

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <TabHeader
        titulo="Trilhas"
        direita={
          <>
            <EstatisticaPill
              icone={<MaterialCommunityIcons name="gift" size={18} color={COR_XP} />}
              valor={xpTotal}
              sufixo="XP"
              cor={COR_XP}
            />
            {sequencia > 0 && (
              <Pressable
                onPress={() => navigation.navigate('Sequencia')}
                accessibilityRole="button"
                accessibilityLabel="Ver sequência"
              >
                <EstatisticaPill
                  icone={<Ionicons name="flame" size={20} color={COR_SEQUENCIA} />}
                  valor={sequencia}
                  cor={COR_SEQUENCIA}
                />
              </Pressable>
            )}
            <SinoNotificacoes />
          </>
        }
      />

      {!!moduloNaFaixa && !carregando && (
        <Pressable
          style={({ pressed }) => [styles.faixa, pressed && podeEscolherTrilha && styles.faixaPressionada]}
          disabled={!podeEscolherTrilha}
          onPress={() => setSeletorAberto(true)}
          accessibilityRole={podeEscolherTrilha ? 'button' : undefined}
          accessibilityLabel={podeEscolherTrilha ? `Escolher trilha. Agora: ${trilhaNaFaixa?.titulo ?? ''}` : undefined}
        >
          <View style={styles.faixaIcone}>
            <Ionicons name="leaf" size={20} color={colors.primaryDark} />
          </View>
          <View style={styles.faixaTextos}>
            <View style={styles.faixaRotuloLinha}>
              <AppText numberOfLines={1} style={[styles.faixaRotulo, styles.faixaRotuloTexto]}>
                {trilhas.length > 1 && numeroTrilhaNaFaixa > 0
                  ? `Trilha ${numeroTrilhaNaFaixa} · ${moduloNaFaixa.titulo}`
                  : moduloNaFaixa.titulo}
              </AppText>
              {podeEscolherTrilha && <Ionicons name="chevron-down" size={16} color={colors.primaryShadow} />}
            </View>
            <AppText numberOfLines={2} style={styles.faixaTitulo}>
              {trilhaNaFaixa?.titulo ?? moduloNaFaixa.subtitulo}
            </AppText>
            {!!progressoDaFaixa && progressoDaFaixa.total > 0 && (
              <View style={styles.faixaBarra}>
                <View
                  style={[
                    styles.faixaBarraPreenchimento,
                    { width: `${Math.round((progressoDaFaixa.feitas / progressoDaFaixa.total) * 100)}%` },
                  ]}
                />
              </View>
            )}
          </View>
          {!!progressoDaFaixa && progressoDaFaixa.total > 0 && (
            <View style={styles.faixaProgresso}>
              <AppText style={styles.faixaProgressoNumero}>
                {progressoDaFaixa.feitas}/{progressoDaFaixa.total}
              </AppText>
              <AppText style={styles.faixaProgressoRotulo}>lições</AppText>
            </View>
          )}
        </Pressable>
      )}

      <MessageBanner message={message} type={type} onClose={clearMessage} style={styles.avisoSobreposto} />

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
          onLayout={(e: LayoutChangeEvent) => {
            alturaScrollRef.current = e.nativeEvent.layout.height;
          }}
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

      {!!direcaoAtual && !carregando && (
        <Pressable
          style={({ pressed }) => [styles.botaoAtual, pressed && styles.botaoAtualPressionado]}
          onPress={irParaAtual}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a lição atual"
        >
          <Ionicons name={direcaoAtual === 'cima' ? 'arrow-up' : 'arrow-down'} size={18} color={colors.white} />
          <AppText style={styles.botaoAtualTexto}>Lição atual</AppText>
        </Pressable>
      )}

      <SeletorTrilhas
        visivel={seletorAberto}
        itens={itensSeletor}
        trilhaNaVistaId={trilhaNaFaixa?.id ?? null}
        onFechar={() => setSeletorAberto(false)}
        onEscolher={aoEscolherTrilha}
      />

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="trilha" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: T.fundoTela },

  // MessageBanner reserva 56px + margem em branco no fluxo; aqui ele aparece
  // por cima do caminho (como um aviso) e não empurra nem corta nada
  avisoSobreposto: { minHeight: 0, height: 0, marginTop: 0, marginHorizontal: layout.margemH, zIndex: 20 },

  // faixa fixa da trilha (fica parada enquanto o caminho rola por baixo)
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: layout.margemH,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: T.cartaoFundo,
    borderWidth: 1.5,
    borderColor: T.cartaoBorda,
  },
  faixaPressionada: { opacity: 0.85 },
  faixaIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  faixaTextos: { flex: 1 },
  faixaRotuloLinha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  faixaRotuloTexto: { flexShrink: 1 },
  faixaRotulo: { fontFamily: typography.semiBold, fontSize: 12, letterSpacing: 0.3, color: colors.primaryShadow },
  faixaTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginTop: 2 },
  faixaBarra: { height: 6, borderRadius: 3, marginTop: 8, backgroundColor: 'rgba(27, 67, 50, 0.12)', overflow: 'hidden' },
  faixaBarraPreenchimento: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  faixaProgresso: { alignItems: 'center', minWidth: 44 },
  faixaProgressoNumero: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  faixaProgressoRotulo: { fontFamily: typography.medium, fontSize: 11, color: colors.primaryShadow },

  bannerPendente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: layout.margemH,
    marginTop: layout.gapEntreBlocos,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  bannerTextos: { flex: 1 },
  bannerTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.warningShadow },
  bannerSubtitulo: { fontFamily: typography.regular, fontSize: 12, color: colors.warningShadow, marginTop: 2, lineHeight: 16 },

  // botão flutuante "lição atual" (aparece quando ela sai da tela)
  botaoAtual: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 112,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 15,
  },
  botaoAtualPressionado: { opacity: 0.85 },
  botaoAtualTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.white },

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
