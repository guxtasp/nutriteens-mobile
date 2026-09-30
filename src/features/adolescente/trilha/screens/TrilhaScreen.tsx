// src/features/adolescente/trilha/screens/TrilhaScreen.tsx
//
// Caminho contínuo de aprendizado, com o módulo atual no card do topo e
// os demais módulos separados ao longo da trilha (TrilhaCaminho). O botão
// de voltar do cabeçalho leva para a Home.
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../../shared/hooks/useMessageBanner';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
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

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
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
  }, [userId, showMessage]);

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
          titulo: `Módulo ${modulo.ordem}`,
          nos: [...nosDoModulo, ...espacosDeTeste],
        };
      }),
    [modulos, nos]
  );

  const moduloEmDestaque = useMemo(() => {
    const noAtual = nos.find((no) => no.status === 'atual');
    return modulos.find((modulo) => modulo.id === noAtual?.moduloId) ?? modulos[modulos.length - 1] ?? null;
  }, [modulos, nos]);

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

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
     
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
        <>
          <View pointerEvents="none" style={styles.imagemObstaculosFixa}>
            <Image
              source={require('../../../../../assets/img/trilha/fundo-obstaculos.png')}
              resizeMode="cover"
              style={styles.imagemObstaculos}
            />
          </View>
          <ScrollView contentContainerStyle={styles.scrollConteudo} showsVerticalScrollIndicator={false} style={styles.scroll}>
          {!!moduloEmDestaque && (
            <View style={styles.moduloCard}>
              <View style={styles.moduloTextos}>
                <AppText style={styles.moduloTitulo}>{moduloEmDestaque.titulo}</AppText>
                <AppText style={styles.moduloSubtitulo}>{moduloEmDestaque.subtitulo}</AppText>
              </View>
              <View style={styles.moduloDivisor} />
              <Ionicons name="book-outline" size={30} color={colors.white} />
            </View>
          )}
          <TrilhaCaminho grupos={grupos} onPressNo={onPressNo} />
          </ScrollView>
        </>
      )}

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="trilha" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.trilhaCeu },

  bannerPendente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  bannerTextos: { flex: 1 },
  bannerTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.warningShadow },
  bannerSubtitulo: { fontFamily: typography.regular, fontSize: 12, color: colors.warningShadow, marginTop: 2, lineHeight: 16 },
  scrollConteudo: { paddingBottom: 104 },
  scroll: { zIndex: 1 },
  imagemObstaculosFixa: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: 280,
    zIndex: 0,
  },
  imagemObstaculos: { width: '100%', height: '100%' },
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
  moduloCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.primaryDark,
    borderBottomWidth: 6,
    borderBottomColor: '#0D3425',
  },
  moduloTextos: { flex: 1 },
  moduloTitulo: { fontFamily: typography.bold, fontSize: 20, color: colors.white },
  moduloSubtitulo: { fontFamily: typography.regular, fontSize: 15, color: 'rgba(255,255,255,0.88)', marginTop: 3 },
  moduloDivisor: {
    width: 1,
    height: 32,
    marginHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
