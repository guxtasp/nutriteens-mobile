// src/features/adolescente/screens/NovoAlimentoOrigemScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { InfoButton } from '../../../shared/ui/InfoButton';
import { InfoSheet } from '../../../shared/ui/InfoSheet';

export type OrigemAlimento = 'PREPARADO_EM_CASA' | 'INDUSTRIALIZADO' | 'NATURAL';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'NovoAlimentoOrigem'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'NovoAlimentoOrigem'>;

const OPCOES: { origem: OrigemAlimento; titulo: string; exemplo: string }[] = [
  { origem: 'PREPARADO_EM_CASA', titulo: 'Preparado em casa', exemplo: 'Por exemplo: geleia caseira, bolo caseiro e sopa' },
  { origem: 'INDUSTRIALIZADO', titulo: 'Produto industrializado', exemplo: 'Por exemplo: refrigerante, biscoito recheado, salgadinho' },
  { origem: 'NATURAL', titulo: 'Alimento natural', exemplo: 'Por exemplo: maçã, banana, alface' },
];

export default function NovoAlimentoOrigemScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const [infoVisivel, setInfoVisivel] = useState(false);

  function selecionar(origem: OrigemAlimento) {
    navigation.navigate('NovoAlimentoForm', { tipo: params.tipo, nomeRefeicao: params.nomeRefeicao, origem });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.topo}>
        <Pressable onPress={() => navigation.goBack()} style={styles.botaoCircular}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topoDireita}>
          <InfoButton style={styles.botaoCircularPequeno} onPress={() => setInfoVisivel(true)} />
          <Pressable onPress={() => navigation.goBack()} style={styles.botaoCircularPequeno}>
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>

      <AppText style={styles.titulo}>Qual a origem?</AppText>

      <View style={styles.lista}>
        {OPCOES.map((opcao) => (
          <Pressable key={opcao.origem} style={styles.card} onPress={() => selecionar(opcao.origem)}>
            <Ionicons name="restaurant-outline" size={20} color="#8BC34A" style={styles.icone} />
            <View style={styles.cardTextos}>
              <AppText style={styles.cardTitulo}>{opcao.titulo}</AppText>
              <AppText style={styles.cardExemplo}>{opcao.exemplo}</AppText>
            </View>
            <Ionicons name="add" size={22} color="#8BC34A" />
          </Pressable>
        ))}
      </View>

      <InfoSheet
        visivel={infoVisivel}
        onFechar={() => setInfoVisivel(false)}
        titulo="Qual a origem do alimento?"
        icone="restaurant-outline"
        explicacao="A origem ajuda a gente a entender o quanto o alimento foi processado antes de chegar até você. Isso conta pra saber se a refeição está mais equilibrada ou não."
        exemplo="Natural = veio direto da natureza. Preparado em casa = você ou sua família cozinhou. Industrializado = veio pronto de fábrica."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#1F5138', paddingHorizontal: 20, paddingTop: 12 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  botaoCircular: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  topoDireita: { flexDirection: 'row', gap: 10 },
  botaoCircularPequeno: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 24, color: '#8BC34A', marginBottom: 20 },
  lista: { gap: 16 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderColor: '#8BC34A', borderRadius: 16, padding: 16 },
  icone: { marginTop: 2 },
  cardTextos: { flex: 1 },
  cardTitulo: { fontFamily: typography.bold, fontSize: 15, color: '#8BC34A', marginBottom: 2 },
  cardExemplo: { fontFamily: typography.regular, fontSize: 12, color: '#A8C9B5' },
});