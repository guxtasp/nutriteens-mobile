// src/features/adolescente/screens/NovoAlimentoFormScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { criarAlimento } from '../services/alimentacaoService';
import type { ClassificacaoNova } from '../utils/regraFeedbackRefeicao';
import type { OrigemAlimento } from './NovoAlimentoOrigemScreen';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'NovoAlimentoForm'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'NovoAlimentoForm'>;

function classificacaoPorOrigem(origem: OrigemAlimento): ClassificacaoNova {
  switch (origem) {
    case 'NATURAL':
      return 'IN_NATURA';
    case 'PREPARADO_EM_CASA':
      return 'PROCESSADO';
    case 'INDUSTRIALIZADO':
      return 'ULTRAPROCESSADO';
  }
}

const CATEGORIAS: { valor: string; rotulo: string }[] = [
  { valor: 'CEREAIS_E_TUBERCULOS', rotulo: 'Cereais e Tubérculos' },
  { valor: 'LEGUMES_E_VERDURAS', rotulo: 'Legumes e Verduras' },
  { valor: 'FRUTAS', rotulo: 'Frutas' },
  { valor: 'LEITE_E_DERIVADOS', rotulo: 'Leite e Derivados' },
  { valor: 'CARNES_E_OVOS', rotulo: 'Carnes e Ovos' },
  { valor: 'LEGUMINOSAS', rotulo: 'Leguminosas' },
  { valor: 'OLEAGINOSAS_E_SEMENTES', rotulo: 'Oleaginosas e Sementes' },
  { valor: 'OLEOS_E_GORDURAS', rotulo: 'Óleos e Gorduras' },
  { valor: 'ACUCARES_E_DOCES', rotulo: 'Açúcares e Doces' },
  { valor: 'BEBIDAS', rotulo: 'Bebidas' },
];

export default function NovoAlimentoFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function confirmarCategoria(categoriaEscolhida: string) {
    if (!nome.trim() || salvando) return;
    setCategoria(categoriaEscolhida);
    setSalvando(true);
    try {
      const alimento = await criarAlimento({
        nome,
        classificacaoNova: classificacaoPorOrigem(params.origem),
        grupoAlimentar: categoriaEscolhida,
      });
      navigation.navigate('AlimentoCadastrado', {
        tipo: params.tipo,
        nomeRefeicao: params.nomeRefeicao,
        alimento,
      });
    } catch (erro) {
      console.error('Erro ao cadastrar alimento:', erro);
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.topo}>
        <Pressable onPress={() => navigation.goBack()} style={styles.botaoCircular}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topoDireita}>
          <Pressable style={styles.botaoCircularPequeno}>
            <Ionicons name="information" size={16} color="#fff" />
          </Pressable>
          <Pressable onPress={() => navigation.popToTop()} style={styles.botaoCircularPequeno}>
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>

      <AppText style={styles.titulo}>O que é?</AppText>

      <TextInput
        style={styles.input}
        placeholder="Nome do alimento"
        placeholderTextColor="#6E9C7F"
        value={nome}
        onChangeText={setNome}
      />

      <AppText style={styles.subtitulo}>Escolha uma categoria:</AppText>

      <FlatList
        data={CATEGORIAS}
        keyExtractor={(item) => item.valor}
        contentContainerStyle={{ gap: 14, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !nome.trim() && styles.cardDesabilitado]}
            onPress={() => confirmarCategoria(item.valor)}
            disabled={!nome.trim() || salvando}
          >
            <Ionicons name="restaurant-outline" size={18} color="#8BC34A" />
            <AppText style={styles.cardTitulo}>{item.rotulo}</AppText>
            <View style={{ flex: 1 }} />
            <Ionicons name="information-circle-outline" size={18} color="#8BC34A" style={{ marginRight: 8 }} />
            <Ionicons name="add" size={20} color="#8BC34A" />
          </Pressable>
        )}
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
  titulo: { fontFamily: typography.bold, fontSize: 24, color: '#8BC34A', marginBottom: 16 },
  input: {
    borderBottomWidth: 1.5, borderBottomColor: '#8BC34A', color: '#fff',
    fontFamily: typography.regular, fontSize: 15, paddingBottom: 8, marginBottom: 24,
  },
  subtitulo: { fontFamily: typography.bold, fontSize: 16, color: '#8BC34A', marginBottom: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#8BC34A', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  cardDesabilitado: { opacity: 0.4 },
  cardTitulo: { fontFamily: typography.bold, fontSize: 14, color: '#8BC34A' },
});