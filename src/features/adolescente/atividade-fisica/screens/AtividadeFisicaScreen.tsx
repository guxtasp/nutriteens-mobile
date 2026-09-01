// src/features/adolescente/screens/AtividadeFisicaScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { buscarAtividades, registrarAtividades, AtividadeCatalogo } from '../services/atividadeService';
import { formatarDataISO } from '../../../../shared/utils/data';
import RegistroRapidoSheet from '../components/RegistroRapidoSheet';
import CarrinhoAtividadesSheet from '../components/CarrinhoAtividadesSheet';
import CarrinhoBar from '../components/CarrinhoBar';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { useAtividadeFisica } from '../contexts/AtividadeFisicaContext';
import { BackButton } from '../../../../shared/ui/BackButton';
import GuiaAtividadeSheet from '../components/GuiaAtividadeSheet';
import SucessoRegistroModal from '../../_shared/components/SucessoRegistroModal';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'AtividadeFisica'>;

export default function AtividadeFisicaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const onVoltar = useCallback(() => navigation.goBack(), [navigation]);
  const { userId } = useAuth();
  const { carrinho, adicionarAoCarrinho, removerDoCarrinho, registrarCarrinho, enviando } = useAtividadeFisica();

  const [catalogo, setCatalogo] = useState<AtividadeCatalogo[]>([]);
  const [sheetRegistroRapido, setSheetRegistroRapido] = useState(false);
  const [sheetCarrinho, setSheetCarrinho] = useState(false);
  const [sheetGuia, setSheetGuia] = useState(false);
  const [sucessoVisivel, setSucessoVisivel] = useState(false);
  const [quantidadeRegistrada, setQuantidadeRegistrada] = useState(0);
  
  // busca com termo virou a BuscaAtividadeScreen — aqui carrega o catálogo completo uma vez
  useEffect(() => {
    buscarAtividades('')
      .then(setCatalogo)
      .catch(() => setCatalogo([]));
  }, []);


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
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>Atividade Física</AppText>
          <AppText style={styles.subtitulo}>Qual atividade física você praticou hoje?</AppText>
        </View>
      </View>

      <View style={styles.acoesLinha}>
        <Pressable style={styles.botaoAcaoVerde} onPress={() => setSheetRegistroRapido(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.botaoAcaoVerde} onPress={() => setSheetGuia(true)}>
          <Ionicons name="information" size={22} color="#fff" />
        </Pressable>
      </View>

      <Pressable style={styles.buscaLinha} onPress={() => navigation.navigate('BuscaAtividade')}>
        <View style={styles.buscaInput} pointerEvents="none">
          <Ionicons name="search" size={22} color="#7A8B94" />
          <AppText style={styles.buscaPlaceholder}>Pesquisar atividade...</AppText>
        </View>
      </Pressable>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {catalogo.map((atividade) => (
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

      <CarrinhoBar quantidade={carrinho.length} onPress={() => setSheetCarrinho(true)} />

      <RegistroRapidoSheet
        visivel={sheetRegistroRapido}
        onFechar={() => setSheetRegistroRapido(false)}
        onAdicionar={adicionarAoCarrinho}
      />

      <CarrinhoAtividadesSheet
        visivel={sheetCarrinho}
        itens={carrinho}
        onFechar={() => setSheetCarrinho(false)}
        onRemover={removerDoCarrinho}
        onRegistrar={handleRegistrar}
      />
      <GuiaAtividadeSheet visivel={sheetGuia} onFechar={() => setSheetGuia(false)} />
        <SucessoRegistroModal
                visivel={sucessoVisivel}
                quantidade={quantidadeRegistrada}
                onFechar={() => {
                    setSucessoVisivel(false);
                    onVoltar();
                }}
/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white ?? '#fff' },
  cabecalho: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 20,
  },
  tituloBloco: { flex: 1, alignItems: 'center', marginRight: 36 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 4 },
  buscaLinha: { paddingHorizontal: 20, marginBottom: 12 },
  buscaInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buscaPlaceholder: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: '#9AA5A0' },
  acoesLinha: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  botaoAcaoVerde: {
    width: 30,
    height: 30,
    borderRadius: 14,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
});