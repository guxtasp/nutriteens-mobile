// src/features/adolescente/screens/NovoAlimentoFormScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';
import { criarAlimento } from '../services/alimentacaoService';
import type { ClassificacaoNova } from '../utils/regraFeedbackRefeicao';
import type { OrigemAlimento } from './NovoAlimentoOrigemScreen';
import { InfoButton } from '../../../../shared/ui/InfoButton';
import { InfoSheet } from '../../../../shared/ui/InfoSheet';
import { buscarGruposAlimentaresInfo, GrupoAlimentarInfo } from '../services/gruposAlimentaresService';
import { useAuth } from '../../../../shared/contexts/AuthContext';

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
  const { userId } = useAuth();

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [gruposInfo, setGruposInfo] = useState<Record<string, GrupoAlimentarInfo>>({});
  const [infoAberta, setInfoAberta] = useState<string | null>(null); // '__GERAL__' ou o valor da categoria

  useEffect(() => {
    buscarGruposAlimentaresInfo().then(setGruposInfo).catch(() => setGruposInfo({}));
  }, []);

async function confirmarCategoria(categoriaEscolhida: string) {
    if (!nome.trim() || salvando || !userId) return;
    setCategoria(categoriaEscolhida);
    setSalvando(true);
    try {
      const alimento = await criarAlimento({
        nome,
        classificacaoNova: classificacaoPorOrigem(params.origem),
        grupoAlimentar: categoriaEscolhida,
        userId,
      });
      navigation.navigate('AlimentoCadastrado', {
        tipo: params.tipo,
        nomeRefeicao: params.nomeRefeicao,
        alimento,
      });
    } catch (erro) {
      // se a policy de INSERT em `alimentos` pra usuário comum não existir
      // (ver SQL sugerido), isso cai aqui como RLS 42501 — agora pelo menos
      // aparece pra pessoa, em vez de sumir com o toque no card
      console.error('Erro ao cadastrar alimento:', erro);
      setSalvando(false);
      Alert.alert('Não deu pra cadastrar', 'Algo deu errado ao salvar esse alimento. Tenta de novo em instantes.');
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.topo}>
        <Pressable onPress={() => navigation.goBack()} style={styles.botaoCircular}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.topoDireita}>
          <InfoButton style={styles.botaoCircularPequeno} onPress={() => setInfoAberta('__GERAL__')} />
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
            <Ionicons
              name={(gruposInfo[item.valor]?.icone as any) ?? 'restaurant-outline'}
              size={18}
              color="#8BC34A"
            />
            <AppText style={styles.cardTitulo}>{item.rotulo}</AppText>
            <View style={{ flex: 1 }} />
            <Pressable hitSlop={8} onPress={() => setInfoAberta(item.valor)} style={{ marginRight: 8 }}>
              <Ionicons name="information-circle-outline" size={18} color="#8BC34A" />
            </Pressable>
            <Ionicons name="add" size={20} color="#8BC34A" />
          </Pressable>
        )}
      />

      <InfoSheet
        visivel={infoAberta === '__GERAL__'}
        onFechar={() => setInfoAberta(null)}
        titulo="Categorias de alimentos"
        icone="restaurant-outline"
        explicacao="Cada categoria representa um grupo de alimentos parecidos. Toque no ícone de info ao lado de cada uma pra entender melhor o que ela inclui e por que é importante."
      />

      {infoAberta && infoAberta !== '__GERAL__' && gruposInfo[infoAberta] && (
        <InfoSheet
          visivel
          onFechar={() => setInfoAberta(null)}
          titulo={gruposInfo[infoAberta].titulo_amigavel}
          icone={gruposInfo[infoAberta].icone as any}
          explicacao={gruposInfo[infoAberta].explicacao}
          exemplo={gruposInfo[infoAberta].exemplo}
        />
      )}
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