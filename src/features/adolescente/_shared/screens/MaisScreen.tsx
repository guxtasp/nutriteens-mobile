// src/features/adolescente/_shared/screens/MaisScreen.tsx
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { definirSomAtivo, diagnosticarSom, somEstaAtivo, tocarSom } from '../../../../shared/audio/sons';
import HomeBottomBar from '../components/HomeBottomBar';
import QuickActionsMenu from '../components/QuickActionsMenu';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;

export default function MaisScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [menuAberto, setMenuAberto] = useState(false);
  const [somLigado, setSomLigado] = useState(somEstaAtivo());
  const [testando, setTestando] = useState(false);

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else if (opcao === 'alimentacao') navigation.navigate('TipoRefeicao');
  }

  async function handleAlternarSom(valor: boolean) {
    setSomLigado(valor);
    await definirSomAtivo(valor);
    // ao ligar, toca um "pop" pra confirmar
    if (valor) tocarSom('pop');
  }

  async function handleTestarSom() {
    if (testando) return;
    setTestando(true);
    const relatorio = await diagnosticarSom();
    setTestando(false);
    Alert.alert('Teste de som', relatorio);
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <AppText style={styles.titulo}>Mais</AppText>
      </View>

      <View style={styles.conteudo}>
        <AppText style={styles.secao}>Configurações</AppText>

        <View style={styles.cartao}>
          <Pressable style={styles.linha} onPress={() => navigation.navigate('Lembretes')}>
            <View style={styles.iconeCirculo}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <View style={styles.textos}>
              <AppText style={styles.linhaTitulo}>Lembretes do Bróxis</AppText>
              <AppText style={styles.linhaSub}>Poucos, no seu ritmo e só do que falta fazer</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA5A0" />
          </Pressable>

          <View style={styles.divisor} />

          <View style={styles.linha}>
            <View style={styles.iconeCirculo}>
              <Ionicons name={somLigado ? 'volume-high' : 'volume-mute'} size={20} color={colors.primary} />
            </View>
            <View style={styles.textos}>
              <AppText style={styles.linhaTitulo}>Sons do app</AppText>
              <AppText style={styles.linhaSub}>Efeitos ao responder, registrar e concluir</AppText>
            </View>
            <Switch
              value={somLigado}
              onValueChange={handleAlternarSom}
              trackColor={{ false: '#D9D9D9', true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={styles.divisor} />

          <Pressable style={styles.linha} onPress={handleTestarSom} disabled={testando}>
            <View style={styles.iconeCirculo}>
              <Ionicons name="musical-notes" size={20} color={colors.primary} />
            </View>
            <View style={styles.textos}>
              <AppText style={styles.linhaTitulo}>{testando ? 'Testando...' : 'Testar som'}</AppText>
              <AppText style={styles.linhaSub}>Toca um som e mostra se está tudo certo</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA5A0" />
          </Pressable>
        </View>

        <AppText style={styles.aviso}>
          Se não ouvir nada, confira se o iPhone não está no modo silencioso (botão na lateral do aparelho) e se o
          volume está ligado.
        </AppText>
      </View>

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="mais" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  cabecalho: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  titulo: { fontFamily: typography.bold, fontSize: 22, color: colors.primaryDark },
  conteudo: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  secao: { fontFamily: typography.semiBold, fontSize: 13, color: '#7A8B94', marginBottom: 10 },
  cartao: {
    backgroundColor: '#F4F9EE',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  iconeCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EAF6D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textos: { flex: 1 },
  linhaTitulo: { fontFamily: typography.semiBold, fontSize: 15, color: colors.primaryDark },
  linhaSub: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 2 },
  divisor: { height: 1, backgroundColor: '#E1EBD6' },
  aviso: {
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#9AA5A0',
    marginTop: 14,
    paddingHorizontal: 4,
  },
});