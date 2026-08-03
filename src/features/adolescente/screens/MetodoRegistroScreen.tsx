// src/features/adolescente/screens/MetodoRegistroScreen.tsx
import React from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { BackButton } from '../../../shared/ui/BackButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'MetodoRegistroAlimentar'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'MetodoRegistroAlimentar'>;

const ILUSTRACAO_IA = require('../../../../assets/img/ia.png');
const ILUSTRACAO_MANUAL = require('../../../../assets/img/manual.png');

export default function MetodoRegistroScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();

  function irParaBusca() {
    navigation.navigate('BuscaAlimento', { tipo: params.tipo, nomeRefeicao: params.nomeRefeicao });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>Alimentação</AppText>
          <AppText style={styles.subtitulo}>Diga pra gente: o que comeu agora?</AppText>
        </View>
      </View>

      <View style={styles.corpo}>
        <View style={styles.cardDesabilitado}>
          <View style={styles.cardConteudo}>
            <View style={styles.cardTextos}>
              <View style={styles.tagsLinha}>
                <View style={[styles.tag, styles.tagIA]}>
                  <AppText style={[styles.tagTexto, { color: '#2E3A45' }]}>IA</AppText>
                </View>
                <View style={[styles.tag, styles.tagIndisponivel]}>
                  <AppText style={[styles.tagTexto, { color: '#2E3A45' }]}>INDISPONÍVEL</AppText>
                </View>
              </View>
              <AppText style={styles.cardTituloClaro}>REGISTRE POR FOTO</AppText>
              <AppText style={styles.cardSubtituloClaro}>Tire uma foto da sua refeição</AppText>
            </View>
            <Image source={ILUSTRACAO_IA} style={styles.ilustracao} resizeMode="contain" />
          </View>
        </View>

        <Pressable style={styles.cardAtivo} onPress={irParaBusca}>
          <View style={styles.cardConteudo}>
            <View style={styles.cardTextos}>
              <View style={styles.tagsLinha}>
                <View style={[styles.tag, styles.tagManual]}>
                  <AppText style={[styles.tagTexto, { color: '#2E3A45' }]}>MANUAL</AppText>
                </View>
                <View style={[styles.tag, styles.tagDisponivel]}>
                  <AppText style={[styles.tagTexto, { color: '#2E3A45' }]}>DISPONÍVEL</AppText>
                </View>
              </View>
              <AppText style={styles.cardTituloClaro}>PESQUISE</AppText>
              <AppText style={styles.cardSubtituloClaro}>Busque por nome e registre o alimento</AppText>
            </View>
            <Image source={ILUSTRACAO_MANUAL} style={styles.ilustracao} resizeMode="contain" />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  cabecalho: { marginTop: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  corpo: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  cardDesabilitado: { backgroundColor: '#2E3A45', borderRadius: 20, padding: 20 },
  cardAtivo: { backgroundColor: colors.primaryDark, borderRadius: 20, padding: 20 },
  cardConteudo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTextos: { flex: 1, paddingRight: 12 },
  tagsLinha: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagIA: { backgroundColor: colors.white },
  tagIndisponivel: { backgroundColor: '#fff' },
  tagManual: { backgroundColor: colors.primary },
  tagDisponivel: { backgroundColor: colors.primary },
  tagTexto: { fontFamily: typography.bold, fontSize: 11 },
  cardTituloClaro: { fontFamily: typography.bold, fontSize: 20, color: '#fff', marginBottom: 4 },
  cardSubtituloClaro: { fontFamily: typography.regular, fontSize: 13, color: '#D9E2E8' },
  ilustracao: { width: 72, height: 72 },
});