// src/features/adolescente/notificacoes/screens/LembretesScreen.tsx
//
// Ajustes dos lembretes: chave geral, um interruptor por tipo e quantos
// lembretes por dia (1 ou até 2). O app só considera, na escolha diária, os
// tipos que estiverem ligados.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { TipoRegular } from '../data/mensagensLembrete';
import {
  enviarLembreteDeTeste,
  obterStatusPermissao,
  pedirPermissao,
  reagendarLembretes,
  StatusPermissao,
} from '../services/lembreteService';
import { carregarConfig, salvarConfig } from '../services/lembreteStorage';
import { CONFIG_PADRAO, ConfigLembretes } from '../utils/escolherLembrete';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;

const OPCOES_TIPO: { tipo: TipoRegular; titulo: string; sub: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { tipo: 'agua', titulo: 'Beber água', sub: 'Um empurrãozinho pra bater a meta do dia', icone: 'water' },
  { tipo: 'alimentacao', titulo: 'Registrar alimentação', sub: 'Pra lembrar de contar o que você comeu', icone: 'restaurant' },
  { tipo: 'atividade', titulo: 'Atividade física', sub: 'Pra se mexer um pouquinho, do seu jeito', icone: 'walk' },
  { tipo: 'missao', titulo: 'Missão do dia', sub: 'Quando tiver uma missão esperando por você', icone: 'flag' },
  { tipo: 'trilha', titulo: 'Trilha', sub: 'Pra continuar a aventura de onde parou', icone: 'map' },
];

export default function LembretesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userId } = useAuth();

  const [config, setConfig] = useState<ConfigLembretes>(CONFIG_PADRAO);
  const [permissao, setPermissao] = useState<StatusPermissao>('indefinida');
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (!userId) return;
    carregarConfig(userId).then((salva) => {
      setConfig(salva);
      setCarregado(true);
    });
  }, [userId]);

  // volta de "Ajustes do celular" com a permissão possivelmente mudada
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web') obterStatusPermissao().then(setPermissao);
    }, [])
  );

  async function atualizar(nova: ConfigLembretes) {
    setConfig(nova);
    if (!userId) return;
    await salvarConfig(userId, nova);
    await reagendarLembretes(userId);
  }

  function avisarPermissaoNegada() {
    Alert.alert(
      'Notificações desligadas',
      'Pra receber os lembretes, ative as notificações do NutriTeens nos ajustes do celular.',
      [
        { text: 'Agora não', style: 'cancel' },
        { text: 'Abrir ajustes', onPress: () => void Linking.openSettings() },
      ]
    );
  }

  async function handleAlternarGeral(valor: boolean) {
    if (!valor) {
      await atualizar({ ...config, ativado: false });
      return;
    }
    const resultado = await pedirPermissao();
    setPermissao(resultado);
    if (resultado !== 'concedida') {
      avisarPermissaoNegada();
      return; // chave continua desligada: sem permissão não há lembrete
    }
    await atualizar({ ...config, ativado: true });
  }

  async function handleAlternarTipo(tipo: TipoRegular, valor: boolean) {
    await atualizar({ ...config, tipos: { ...config.tipos, [tipo]: valor } });
  }

  async function handleTestar() {
    const resultado = permissao === 'concedida' ? 'concedida' : await pedirPermissao();
    setPermissao(resultado);
    if (resultado !== 'concedida') {
      avisarPermissaoNegada();
      return;
    }
    await enviarLembreteDeTeste();
    Alert.alert('Lembrete de teste', 'Ele chega em cerca de 5 segundos. Se quiser, minimize o app pra ver como fica.');
  }

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.tela}>
        <View style={styles.cabecalho}>
          <BackButton onPress={() => navigation.goBack()} />
          <AppText style={styles.titulo}>Lembretes</AppText>
        </View>
        <AppText style={[styles.aviso, { paddingHorizontal: 20 }]}>
          Os lembretes só funcionam no aplicativo do celular.
        </AppText>
      </SafeAreaView>
    );
  }

  const tudoDesligado = !OPCOES_TIPO.some((o) => config.tipos[o.tipo]);
  const controlesAtivos = config.ativado && carregado;

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText style={styles.titulo}>Lembretes</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <AppText style={styles.intro}>
          O Bróxis só te chama quando faz sentido: no máximo um lembrete por dia, perto do horário em que você costuma
          usar o app, e só sobre o que ainda falta fazer hoje.
        </AppText>

        {permissao === 'negada' && (
          <Pressable style={styles.bannerPermissao} onPress={() => void Linking.openSettings()}>
            <Ionicons name="notifications-off" size={20} color={colors.error} />
            <View style={styles.textos}>
              <AppText style={styles.bannerTitulo}>Notificações desligadas no celular</AppText>
              <AppText style={styles.linhaSub}>Toque aqui pra abrir os ajustes e permitir.</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA5A0" />
          </Pressable>
        )}

        <View style={styles.cartao}>
          <View style={styles.linha}>
            <View style={styles.iconeCirculo}>
              <Ionicons name="notifications" size={20} color={colors.primary} />
            </View>
            <View style={styles.textos}>
              <AppText style={styles.linhaTitulo}>Receber lembretes</AppText>
              <AppText style={styles.linhaSub}>Chave geral de todos os lembretes</AppText>
            </View>
            <Switch
              value={config.ativado}
              onValueChange={handleAlternarGeral}
              disabled={!carregado}
              trackColor={{ false: '#D9D9D9', true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <AppText style={styles.secao}>O que lembrar</AppText>
        <View style={[styles.cartao, !controlesAtivos && styles.desativado]}>
          {OPCOES_TIPO.map((opcao, indice) => (
            <View key={opcao.tipo}>
              {indice > 0 && <View style={styles.divisor} />}
              <View style={styles.linha}>
                <View style={styles.iconeCirculo}>
                  <Ionicons name={opcao.icone} size={20} color={colors.primary} />
                </View>
                <View style={styles.textos}>
                  <AppText style={styles.linhaTitulo}>{opcao.titulo}</AppText>
                  <AppText style={styles.linhaSub}>{opcao.sub}</AppText>
                </View>
                <Switch
                  value={config.tipos[opcao.tipo]}
                  onValueChange={(valor) => handleAlternarTipo(opcao.tipo, valor)}
                  disabled={!controlesAtivos}
                  trackColor={{ false: '#D9D9D9', true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          ))}
        </View>
        {config.ativado && tudoDesligado && (
          <AppText style={styles.aviso}>Com todos os tipos desligados, o Bróxis não manda nenhum lembrete.</AppText>
        )}

        <AppText style={styles.secao}>Quantos por dia</AppText>
        <View style={[styles.segmentos, !controlesAtivos && styles.desativado]}>
          {([1, 2] as const).map((valor) => {
            const selecionado = config.porDia === valor;
            return (
              <Pressable
                key={valor}
                style={[styles.segmento, selecionado && styles.segmentoSelecionado]}
                disabled={!controlesAtivos}
                onPress={() => atualizar({ ...config, porDia: valor })}
              >
                <AppText style={[styles.segmentoTexto, selecionado && styles.segmentoTextoSelecionado]}>
                  {valor === 1 ? 'No máximo 1' : 'Até 2'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <AppText style={styles.aviso}>
          Se você deixar passar vários lembretes seguidos, o Bróxis diminui sozinho pra umas duas vezes por semana.
        </AppText>

        <View style={[styles.cartao, { marginTop: 18 }]}>
          <Pressable style={styles.linha} onPress={handleTestar}>
            <View style={styles.iconeCirculo}>
              <Ionicons name="paper-plane" size={20} color={colors.primary} />
            </View>
            <View style={styles.textos}>
              <AppText style={styles.linhaTitulo}>Mandar lembrete de teste</AppText>
              <AppText style={styles.linhaSub}>Chega em cerca de 5 segundos</AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9AA5A0" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  titulo: { fontFamily: typography.bold, fontSize: 22, color: colors.primaryDark },
  conteudo: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40 },
  intro: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#5E6E66', marginBottom: 16 },
  secao: { fontFamily: typography.semiBold, fontSize: 13, color: '#7A8B94', marginTop: 20, marginBottom: 10 },
  cartao: { backgroundColor: '#F4F9EE', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  desativado: { opacity: 0.5 },
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
  aviso: { fontFamily: typography.regular, fontSize: 12, lineHeight: 18, color: '#9AA5A0', marginTop: 10, paddingHorizontal: 4 },
  bannerPermissao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FDECEA',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  bannerTitulo: { fontFamily: typography.semiBold, fontSize: 14, color: colors.error },
  segmentos: { flexDirection: 'row', backgroundColor: '#F4F9EE', borderRadius: 16, padding: 4, gap: 4 },
  segmento: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  segmentoSelecionado: { backgroundColor: colors.primary },
  segmentoTexto: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
  segmentoTextoSelecionado: { color: colors.white },
});
