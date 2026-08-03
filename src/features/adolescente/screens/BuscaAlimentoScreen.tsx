// src/features/adolescente/screens/BuscaAlimentoScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { BackButton } from '../../../shared/ui/BackButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { buscarAlimentos, listarAlimentosIniciais, Alimento } from '../services/alimentacaoService';
import { useAlimentacao } from '../contexts/AlimentacaoContext';
import CarrinhoAlimentosBar from '../components/CarrinhoAlimentarBar';
import CarrinhoAlimentosSheet from '../components/CarrinhoAlimentarSheet';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'BuscaAlimento'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'BuscaAlimento'>;

function rotuloClassificacao(c: Alimento['classificacao_nova']) {
  switch (c) {
    case 'IN_NATURA': return 'IN NATURA';
    case 'INGREDIENTE_CULINARIO': return 'INGREDIENTE CULINÁRIO';
    case 'PROCESSADO': return 'PROCESSADO';
    case 'ULTRAPROCESSADO': return 'ULTRAPROCESSADO';
  }
}

export default function BuscaAlimentoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const { carrinho, adicionarAoCarrinho, incrementarItem, decrementarItem, removerDoCarrinho, registrarCarrinho, enviando } = useAlimentacao();

  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [sheetCarrinho, setSheetCarrinho] = useState(false);

  useEffect(() => {
    if (!termo.trim()) {
      setBuscando(true);
      listarAlimentosIniciais()
        .then(setResultados)
        .catch((erro) => console.error('Erro ao carregar alimentos iniciais:', erro))
        .finally(() => setBuscando(false));
      return;
    }

    setBuscando(true);
    const timeout = setTimeout(async () => {
      try {
        const dados = await buscarAlimentos(termo);
        setResultados(dados);
      } catch (erro) {
        console.error('Erro ao buscar alimentos:', erro);
      } finally {
        setBuscando(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [termo]);

  function irParaCadastro() {
    navigation.navigate('NovoAlimentoOrigem', { tipo: params.tipo, nomeRefeicao: params.nomeRefeicao });
  }

  async function handleRegistrar() {
    const resultado = await registrarCarrinho(params.tipo);
    if (!resultado) return;
    setSheetCarrinho(false);
    navigation.navigate('FeedbackRefeicao', {
      nomeRefeicao: params.nomeRefeicao,
      mensagemEducativa: resultado.mensagemEducativa,
    });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>{params.nomeRefeicao}</AppText>
          <AppText style={styles.subtitulo}>Diga pra gente: o que comeu agora?</AppText>
        </View>
      </View>

      <View style={styles.corpo}>
        <View style={styles.buscaLinha}>
          <View style={styles.buscaCaixa}>
            <Ionicons name="search" size={18} color="#7A8B94" />
            <TextInput
              style={styles.buscaInput}
              placeholder="Pesquisar alimento..."
              placeholderTextColor="#7A8B94"
              value={termo}
              onChangeText={setTermo}
            />
          </View>
          <Pressable style={styles.botaoInfo}>
            <Ionicons name="information" size={18} color="#fff" />
          </Pressable>
          <Pressable style={styles.botaoAdicionar} onPress={irParaCadastro}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.abasLinha}>
          <View style={styles.aba}>
            <View style={[styles.abaIcone, styles.abaIconeAtiva]}>
              <Ionicons name="nutrition" size={22} color="#fff" />
            </View>
            <AppText style={styles.abaTextoAtivo}>Alimento</AppText>
          </View>
          <View style={[styles.aba, { opacity: 0.4 }]}>
            <View style={styles.abaIcone}>
              <Ionicons name="restaurant" size={22} color="#fff" />
            </View>
            <AppText style={styles.abaTexto}>Prato</AppText>
          </View>
          <View style={[styles.aba, { opacity: 0.4 }]}>
            <View style={styles.abaIcone}>
              <Ionicons name="book" size={22} color="#fff" />
            </View>
            <AppText style={styles.abaTexto}>Receitas</AppText>
          </View>
        </View>

        {buscando && <ActivityIndicator color="#8BC34A" style={{ marginTop: 20 }} />}

        {!buscando && termo.trim().length > 0 && resultados.length === 0 && (
          <AppText style={styles.vazioTexto}>Nenhum alimento encontrado. Toque no "+" pra cadastrar.</AppText>
        )}

        <FlatList
          data={resultados}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: carrinho.length > 0 ? 100 : 20 }}
          renderItem={({ item }) => (
            <Pressable style={styles.itemCard} onPress={() => adicionarAoCarrinho(item)}>
              <View>
                <AppText style={styles.itemNome}>{item.nome}</AppText>
                <AppText style={styles.itemClassificacao}>{rotuloClassificacao(item.classificacao_nova)}</AppText>
              </View>
              <View style={styles.botaoAdicionarPequeno}>
                <Ionicons name="add" size={16} color="#fff" />
              </View>
            </Pressable>
          )}
        />
      </View>

      <CarrinhoAlimentosBar quantidade={carrinho.length} onPress={() => setSheetCarrinho(true)} />

      <CarrinhoAlimentosSheet
        visivel={sheetCarrinho}
        itens={carrinho}
        onFechar={() => setSheetCarrinho(false)}
        onIncrementar={incrementarItem}
        onDecrementar={decrementarItem}
        onRemover={removerDoCarrinho}
        onRegistrar={handleRegistrar}
        registrando={enviando}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  corpo: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  buscaLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  buscaCaixa: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  buscaInput: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  botaoInfo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  botaoAdicionar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  abasLinha: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  aba: { alignItems: 'center', gap: 6 },
  abaIcone: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  abaIconeAtiva: { backgroundColor: colors.primaryDark },
  abaTexto: { fontFamily: typography.medium, fontSize: 12, color: '#8BC34A' },
  abaTextoAtivo: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', textAlign: 'center', marginTop: 20, paddingHorizontal: 12 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  itemNome: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  itemClassificacao: { fontFamily: typography.regular, fontSize: 11, color: '#7A8B94', marginTop: 2 },
  botaoAdicionarPequeno: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
});