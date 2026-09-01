// src/features/adolescente/screens/TrilhaScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../../shared/hooks/useMessageBanner';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { TrilhaPath, NoTrilha } from '../components/TrilhaPath';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { buscarTrilhaComProgresso, Trilha, LicaoDaTrilha } from '../services/trilhaService';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;

export default function TrilhaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();
  const { message, type, showMessage, clearMessage } = useMessageBanner();

  const [menuAberto, setMenuAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [trilha, setTrilha] = useState<Trilha | null>(null);
  const [nos, setNos] = useState<NoTrilha[]>([]);
  const [licoes, setLicoes] = useState<LicaoDaTrilha[]>([]);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const resultado = await buscarTrilhaComProgresso(userId);
      setTrilha(resultado?.trilha ?? null);
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

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else if (opcao === 'alimentacao') navigation.navigate('TipoRefeicao');
  }

  function onPressNo(no: NoTrilha) {
    if (no.status === 'bloqueada') return;

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

  return (
    <SafeAreaView style={styles.tela}>
      <AppText style={styles.titulo}>{trilha?.titulo ?? 'Trilhas de Aprendizado'}</AppText>
      <MessageBanner message={message} type={type} onClose={clearMessage} />

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : nos.length === 0 ? (
        <View style={styles.centro}>
          <AppText style={styles.vazioTitulo}>Nenhuma trilha disponível ainda</AppText>
          <AppText style={styles.vazioSubtitulo}>Assim que uma trilha for aprovada, ela aparece por aqui.</AppText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollConteudo}>
          <TrilhaPath nos={nos} onPressNo={onPressNo} />
        </ScrollView>
      )}

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="trilha" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  titulo: {
    fontFamily: typography.bold,
    fontSize: 20,
    color: colors.primaryDark,
    textAlign: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  scrollConteudo: {
    paddingBottom: 40,
  },
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