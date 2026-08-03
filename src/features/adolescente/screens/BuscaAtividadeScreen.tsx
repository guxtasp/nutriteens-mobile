import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { buscarAtividades, AtividadeCatalogo } from '../services/atividadeService';
import { useAtividadeFisica } from '../contexts/AtividadeFisicaContext';
import CarrinhoBar from '../components/CarrinhoBar';
import CarrinhoAtividadesSheet from '../components/CarrinhoAtividadesSheet';
import SucessoRegistroModal from '../components/SucessoRegistroModal';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'BuscaAtividade'>;

const MASCOTE_BROXIS = require('../../../../assets/img/mascot/broxis-neutro2.png');

export default function BuscaAtividadeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    carrinho,
    adicionarAoCarrinho,
    removerDoCarrinho,
    buscasRecentes,
    registrarBuscaRecente,
    registrarCarrinho,
  } = useAtividadeFisica();

  const [termoBusca, setTermoBusca] = useState('');
  const [resultados, setResultados] = useState<AtividadeCatalogo[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [sheetCarrinho, setSheetCarrinho] = useState(false);
  const [sucessoVisivel, setSucessoVisivel] = useState(false);
  const [quantidadeRegistrada, setQuantidadeRegistrada] = useState(0);

  useEffect(() => {
    if (termoBusca.trim().length === 0) {
      setResultados([]);
      setBuscou(false);
      return;
    }
    const timeout = setTimeout(() => {
      buscarAtividades(termoBusca)
        .then((lista) => {
          setResultados(lista);
          setBuscou(true);
          registrarBuscaRecente(termoBusca);
        })
        .catch(() => {
          setResultados([]);
          setBuscou(true);
        });
    }, 300);
    return () => clearTimeout(timeout);
  }, [termoBusca, registrarBuscaRecente]);

  const semResultado = buscou && resultados.length === 0;
  const mostrarPromptInicial = termoBusca.length === 0 && buscasRecentes.length === 0;
  const mostrarBuscasRecentes = termoBusca.length === 0 && buscasRecentes.length > 0;
  const mostrarResultados = termoBusca.length > 0 && resultados.length > 0;

  async function handleRegistrar() {
    try {
      const quantidade = await registrarCarrinho();
      if (quantidade === 0) return;
      setQuantidadeRegistrada(quantidade);
      setSheetCarrinho(false);
      setTimeout(() => setSucessoVisivel(true), 350);
    } catch (erro) {
      console.error('Erro ao registrar atividades:', erro);
    }
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.buscaLinha}>
        <View style={styles.buscaInput}>
          <Ionicons name="search" size={22} color="#7A8B94" />
          <TextInput
            style={styles.buscaTexto}
            placeholder="Pesquisar atividade..."
            placeholderTextColor="#9AA5A0"
            value={termoBusca}
            onChangeText={setTermoBusca}
            autoFocus
          />
        </View>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText style={styles.cancelar}>Cancelar</AppText>
        </Pressable>
      </View>

      {mostrarBuscasRecentes && (
        <View style={styles.buscasRecentesBloco}>
          <AppText style={styles.buscasRecentesTitulo}>Buscas recentes</AppText>
          {buscasRecentes.map((termo) => (
            <Pressable key={termo} onPress={() => setTermoBusca(termo)}>
              <AppText style={styles.buscaRecenteItem}>{termo}</AppText>
            </Pressable>
          ))}
        </View>
      )}

      {mostrarResultados && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {resultados.map((atividade) => (
            <View key={atividade.id} style={styles.itemCatalogo}>
              <View style={styles.itemInfo}>
                <AppText style={styles.itemNome}>{atividade.nome}</AppText>
                <AppText style={styles.itemDuracao}>{atividade.duracao_padrao_min} min</AppText>
              </View>
              <Pressable
                style={styles.botaoAdicionar}
                onPress={() => adicionarAoCarrinho(atividade.nome, atividade.duracao_padrao_min)}
              >
                <Ionicons name="add" size={18} color="#fff" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      {mostrarPromptInicial && (
        <View style={styles.broxisBloco}>
          <Image source={MASCOTE_BROXIS} style={styles.broxisImagem} resizeMode="contain" />
          <AppText style={styles.broxisTexto}>
            Quer procurar alguma coisa? Digite o que deseja encontrar. Se não encontrar o que procura,
            toque em "Cancelar" e, em seguida, no botão "+" localizado acima da barra de pesquisa.
          </AppText>
        </View>
      )}

      {semResultado && (
        <View style={styles.broxisBloco}>
          <Image source={MASCOTE_BROXIS} style={styles.broxisImagem} resizeMode="contain" />
          <AppText style={styles.broxisTitulo}>Nada encontrado</AppText>
          <AppText style={styles.broxisTexto}>
            Não encontramos "{termoBusca}" no catálogo. Toque em "Cancelar" e use o botão "+" para
            registrar manualmente.
          </AppText>
        </View>
      )}

      <CarrinhoBar quantidade={carrinho.length} onPress={() => setSheetCarrinho(true)} />

      <CarrinhoAtividadesSheet
        visivel={sheetCarrinho}
        itens={carrinho}
        onFechar={() => setSheetCarrinho(false)}
        onRemover={removerDoCarrinho}
        onRegistrar={handleRegistrar}
      />

      <SucessoRegistroModal
        visivel={sucessoVisivel}
        quantidade={quantidadeRegistrada}
        onFechar={() => {
          setSucessoVisivel(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  buscaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  buscaInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buscaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  cancelar: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  buscasRecentesBloco: { paddingHorizontal: 20, gap: 10 },
  buscasRecentesTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, marginBottom: 4 },
  buscaRecenteItem: { fontFamily: typography.regular, fontSize: 14, color: '#7A8B94', paddingVertical: 4 },
  itemCatalogo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  itemInfo: { flex: 1, marginRight: 12 },
  itemNome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, flexShrink: 1 },
  itemDuracao: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 2 },
  botaoAdicionar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broxisBloco: { alignItems: 'center', paddingHorizontal: 40, marginTop: 60 },
  broxisImagem: { width: 96, height: 96, marginBottom: 24 },
  broxisTitulo: {
    fontFamily: typography.bold,
    fontSize: 16,
    color: colors.primaryDark,
    marginBottom: 8,
  },
  broxisTexto: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    textAlign: 'center',
    lineHeight: 20,
  },
});