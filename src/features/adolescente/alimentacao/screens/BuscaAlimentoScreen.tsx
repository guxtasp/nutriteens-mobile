import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import {
  buscarAlimentos,
  listarAlimentosIniciais,
  listarMeusAlimentos,
  listarPratos,
  buscarPratos,
  Alimento,
} from '../services/alimentacaoService';
import { listarReceitas, buscarReceitas, ReceitaComAlimento } from '../services/receitasService';
import { useAlimentacao } from '../contexts/AlimentacaoContext';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import CarrinhoAlimentosBar from '../components/CarrinhoAlimentarBar';
import CarrinhoAlimentosSheet from '../components/CarrinhoAlimentarSheet';
import ReceitaDetalheSheet from '../components/ReceitaDetalheSheet';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'BuscaAlimento'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'BuscaAlimento'>;

type Aba = 'alimento' | 'prato' | 'receita';

function rotuloClassificacao(c: Alimento['classificacao_nova']) {
  switch (c) {
    case 'IN_NATURA': return 'IN NATURA';
    case 'INGREDIENTE_CULINARIO': return 'INGREDIENTE CULINÁRIO';
    case 'PROCESSADO': return 'PROCESSADO';
    case 'ULTRAPROCESSADO': return 'ULTRAPROCESSADO';
    default: return '';
  }
}

export default function BuscaAlimentoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const { userId } = useAuth();
  const { carrinho, adicionarAoCarrinho, incrementarItem, decrementarItem, removerDoCarrinho, registrarCarrinho, enviando } = useAlimentacao();

  const [aba, setAba] = useState<Aba>('alimento');
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [receitasResultados, setReceitasResultados] = useState<ReceitaComAlimento[]>([]);
  const [meusAlimentos, setMeusAlimentos] = useState<Alimento[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [sheetCarrinho, setSheetCarrinho] = useState(false);
  const [receitaAberta, setReceitaAberta] = useState<ReceitaComAlimento | null>(null);

  const ultimoIdProcessado = useRef<string | null>(null);

  // FIX: Adiciona item recém-criado ao carrinho de forma segura e limpa
  useEffect(() => {
    const recemCriado = params?.alimentoRecemCriado;
    if (recemCriado && recemCriado.id !== ultimoIdProcessado.current) {
      ultimoIdProcessado.current = recemCriado.id;
      adicionarAoCarrinho(recemCriado);
      setSheetCarrinho(true);
    }
  }, [params?.alimentoRecemCriado, adicionarAoCarrinho]);

  // Carrega "meus alimentos"
  useEffect(() => {
    if (!userId) return;
    listarMeusAlimentos(userId)
      .then(setMeusAlimentos)
      .catch(() => setMeusAlimentos([]));
  }, [userId, params?.alimentoRecemCriado]);

  // Busca e listagem unificada com debounce otimizado
  useEffect(() => {
    if (!userId) return;
    setBuscando(true);
    
    const timeout = setTimeout(async () => {
      try {
        const termoLimpo = termo.trim();
        if (aba === 'alimento') {
          const dados = termoLimpo ? await buscarAlimentos(termoLimpo, userId) : await listarAlimentosIniciais(userId);
          setResultados(dados);
        } else if (aba === 'prato') {
          const dados = termoLimpo ? await buscarPratos(termoLimpo, userId) : await listarPratos(userId);
          setResultados(dados);
        } else if (aba === 'receita') {
          const dados = termoLimpo ? await buscarReceitas(termoLimpo, userId) : await listarReceitas(userId);
          setReceitasResultados(dados);
        }
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
      } finally {
        setBuscando(false);
      }
    }, termo.trim() ? 350 : 0);

    return () => clearTimeout(timeout);
  }, [termo, aba, userId]);

  function irParaCadastro() {
    navigation.navigate('NovoAlimentoOrigem', { tipo: params.tipo, nomeRefeicao: params.nomeRefeicao });
  }

  async function handleRegistrar() {
    try {
      const resultado = await registrarCarrinho(params.tipo);
      if (!resultado) return;
      setSheetCarrinho(false);
      navigation.navigate('FeedbackRefeicao', {
        tipo: params.tipo,
        nomeRefeicao: params.nomeRefeicao,
        nivelQualidade: resultado.nivelQualidade,
        intensidade: resultado.intensidade,
        processamento: resultado.processamento,
        nutricional: resultado.nutricional,
        melhoria: resultado.melhoria,
        missao: resultado.missao,
      });
    } catch (erro) {
      console.error('Erro ao registrar refeição:', erro);
      Alert.alert('Não deu pra registrar', 'Algo deu errado ao salvar essa refeição. Tenta de novo em instantes.');
    }
  }

  const adicionarReceitaAoCarrinho = useCallback((receita: ReceitaComAlimento) => {
    adicionarAoCarrinho(receita.alimento_resultante);
    setReceitaAberta(null);
    setSheetCarrinho(true);
  }, [adicionarAoCarrinho]);

  const mostrarSecaoMeusAlimentos = aba === 'alimento' && !termo.trim() && meusAlimentos.length > 0;

  // Renderizadores otimizados para FlatList evitando re-criação de funções
  const renderItemAlimentoPrato = useCallback(({ item }: { item: Alimento }) => (
    <Pressable style={styles.itemCard} onPress={() => adicionarAoCarrinho(item)}>
      <View style={{ flex: 1 }}>
        <AppText style={styles.itemNome} numberOfLines={2}>{item.nome}</AppText>
        <AppText style={styles.itemClassificacao}>{rotuloClassificacao(item.classificacao_nova)}</AppText>
      </View>
      <View style={styles.botaoAdicionarPequeno}>
        <Ionicons name="add" size={16} color="#fff" />
      </View>
    </Pressable>
  ), [adicionarAoCarrinho]);

  const renderItemReceita = useCallback(({ item }: { item: ReceitaComAlimento }) => (
    <Pressable style={styles.itemCard} onPress={() => setReceitaAberta(item)}>
      <View style={{ flex: 1 }}>
        <AppText style={styles.itemNome} numberOfLines={2}>{item.titulo}</AppText>
        <AppText style={styles.itemClassificacao}>
          {item.tempo_preparo_min ? `${item.tempo_preparo_min} min • ` : ''}
          {item.porcoes} porção(ões)
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8BC34A" />
    </Pressable>
  ), []);

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
              placeholder={aba === 'receita' ? 'Pesquisar receita...' : 'Pesquisar alimento...'}
              placeholderTextColor="#7A8B94"
              value={termo}
              onChangeText={setTermo}
            />
          </View>
          <Pressable style={styles.botaoInfo} accessibilityLabel="Informações">
            <Ionicons name="information" size={18} color="#fff" />
          </Pressable>
          {aba !== 'receita' && (
            <Pressable style={styles.botaoAdicionar} onPress={irParaCadastro} accessibilityLabel="Cadastrar novo alimento">
              <Ionicons name="add" size={20} color="#fff" />
            </Pressable>
          )}
        </View>

        <View style={styles.abasLinha}>
          <Pressable style={styles.aba} onPress={() => setAba('alimento')}>
            <View style={[styles.abaIcone, { backgroundColor: aba === 'alimento' ? colors.primaryDark : colors.primary }]}>
              <MaterialCommunityIcons name="fruit-grapes" size={60} color="#fff" />
            </View>
            <AppText style={aba === 'alimento' ? styles.abaTextoAtivo : styles.abaTexto}>Alimento</AppText>
          </Pressable>

          <Pressable style={styles.aba} onPress={() => setAba('prato')}>
            <View style={[styles.abaIcone, { backgroundColor: aba === 'prato' ? colors.primaryDark : colors.primary }]}>
              <MaterialCommunityIcons name="pot-steam" size={60} color="#fff" />
            </View>
            <AppText style={aba === 'prato' ? styles.abaTextoAtivo : styles.abaTexto}>Prato</AppText>
          </Pressable>

          <Pressable style={styles.aba} onPress={() => setAba('receita')}>
            <View style={[styles.abaIcone, { backgroundColor: aba === 'receita' ? colors.primaryDark : colors.primary }]}>
              <MaterialCommunityIcons name="mortar-pestle" size={60} color="#fff" />
            </View>
            <AppText style={aba === 'receita' ? styles.abaTextoAtivo : styles.abaTexto}>Receitas</AppText>
          </Pressable>
        </View>

        {buscando && <ActivityIndicator color="#8BC34A" style={{ marginTop: 20 }} />}

        {!buscando && aba !== 'receita' && (
          <FlatList
            data={resultados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingTop: 4, paddingBottom: carrinho.length > 0 ? 100 : 20 }}
            ListHeaderComponent={
              mostrarSecaoMeusAlimentos ? (
                <View style={{ marginBottom: 12 }}>
                  <AppText style={styles.secaoLabel}>Cadastrados por você</AppText>
                  {meusAlimentos.map((item) => (
                    <Pressable key={`meu-${item.id}`} style={styles.itemCard} onPress={() => adicionarAoCarrinho(item)}>
                      <View style={{ flex: 1 }}>
                        <AppText style={styles.itemNome} numberOfLines={2}>
                          {item.nome}
                        </AppText>
                        <AppText style={styles.itemClassificacao}>
                          {rotuloClassificacao(item.classificacao_nova)}
                        </AppText>
                      </View>
                      <View style={styles.botaoAdicionarPequeno}>
                        <Ionicons name="add" size={16} color="#fff" />
                      </View>
                    </Pressable>
                  ))}
                  <AppText style={[styles.secaoLabel, { marginTop: 16 }]}>Opções</AppText>
                </View>
              ) : null
            }
            ListEmptyComponent={
              termo.trim().length > 0 ? (
                <AppText style={styles.vazioTexto}>
                  {aba === 'prato'
                    ? 'Nenhum prato encontrado.'
                    : 'Nenhum alimento encontrado. Toque no "+" pra cadastrar.'}
                </AppText>
              ) : null
            }
            renderItem={renderItemAlimentoPrato}
          />
        )}

        {!buscando && aba === 'receita' && (
          <FlatList
            data={receitasResultados}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingTop: 4, paddingBottom: carrinho.length > 0 ? 100 : 20 }}
            ListEmptyComponent={
              <AppText style={styles.vazioTexto}>Nenhuma receita encontrada.</AppText>
            }
            renderItem={renderItemReceita}
          />
        )}
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

      <ReceitaDetalheSheet
        receita={receitaAberta}
        onFechar={() => setReceitaAberta(null)}
        onAdicionarAoCarrinho={adicionarReceitaAoCarrinho}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  cabecalho: { flexDirection: 'row', marginTop: 30, alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  corpo: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  buscaLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  buscaCaixa: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 },
  buscaInput: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  botaoInfo: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  botaoAdicionar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  abasLinha: { flexDirection: 'row', gap: 50, marginBottom: 20, justifyContent: 'center' },
  aba: { alignItems: 'center', gap: 6, paddingVertical: 4 },
  abaTextoAtivo: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  secaoLabel: { fontFamily: typography.bold, fontSize: 12, color: '#7A8B94', marginBottom: 8, textTransform: 'uppercase' },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', textAlign: 'center', marginTop: 20, paddingHorizontal: 12 },
  itemCard: {
    marginBottom: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  itemNome: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark, flex: 1 },
  itemClassificacao: { fontFamily: typography.regular, fontSize: 11, color: '#7A8B94', marginTop: 2 },
  botaoAdicionarPequeno: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  abaIcone: { width: 72, height: 72, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  abaTexto: { fontFamily: typography.medium, fontSize: 12, color: '#7A8B94' },
});