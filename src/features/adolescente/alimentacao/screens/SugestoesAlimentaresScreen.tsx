// src/features/adolescente/alimentacao/screens/SugestoesAlimentaresScreen.tsx
// "Sugestões alimentares — Escolha a categoria" (RF015). Tocar numa categoria mostra as alternativas
// (ícone + nome).
import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import CartaoHub from '../components/CartaoHub';
import { AlternativasLista } from '../../trocas/components/TrocaLista';
import { listarTrocas } from '../../trocas/services/trocasService';
import { ICONE_CATEGORIA } from '../../trocas/utils/iconesTrocas';
import { CATEGORIAS_TROCA, CategoriaTroca, CHAMADA_CATEGORIA, ROTULO_CATEGORIA, ordenarTrocas, semDestinoRepetido, Troca } from '../../trocas/utils/trocas';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'SugestoesAlimentares'>;
type Rota = RouteProp<AdolescenteStackParamList, 'SugestoesAlimentares'>;

function contarOpcoes(trocas: Troca[] | null, c: CategoriaTroca): number {
  return trocas ? semDestinoRepetido(trocas.filter((t) => t.categoria === c)).length : 0;
}

export default function SugestoesAlimentaresScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rota>();
  const [categoria, setCategoria] = useState<CategoriaTroca | null>(params?.categoria ?? null);
  const [trocas, setTrocas] = useState<Troca[] | null>(null);
  const [erro, setErro] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  // vindo do retorno da refeição: já abre a categoria daquele item
  React.useEffect(() => { if (params?.categoria) setCategoria(params.categoria); }, [params?.categoria]);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarTrocas()
        .then((l) => { if (ativo) { setTrocas(l); setErro(false); } })
        .catch((e) => { console.error('Erro ao carregar sugestões:', e); if (ativo) setErro(true); });
      return () => { ativo = false; };
    }, [])
  );

  function voltar() {
    if (categoria) setCategoria(null);
    else navigation.goBack();
  }

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else navigation.navigate('TipoRefeicao');
  }

  const opcoes = categoria
    ? semDestinoRepetido(ordenarTrocas((trocas ?? []).filter((t) => t.categoria === categoria)))
    : [];

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={voltar} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>{categoria ? ROTULO_CATEGORIA[categoria] : 'Sugestões alimentares'}</AppText>
          <AppText style={styles.subtitulo}>{categoria ? 'Que tal estas opções?' : 'Escolha a categoria'}</AppText>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {!categoria ? (
          CATEGORIAS_TROCA.map((c, i) => {
            const n = contarOpcoes(trocas, c);
            return (
              <CartaoHub
                key={c}
                tags={n > 0 ? ['TROCAS', `${n} ${n === 1 ? 'OPÇÃO' : 'OPÇÕES'}`] : ['TROCAS']}
                titulo={ROTULO_CATEGORIA[c]}
                subtitulo={CHAMADA_CATEGORIA[c]}
                icone={ICONE_CATEGORIA[c]}
                onPress={() => setCategoria(c)}
                atraso={i * 70}
              />
            );
          })
        ) : (
          <MotiView key={categoria} from={{ opacity: 0, translateX: 24 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: 'timing', duration: 280 }}>
            <AppText style={styles.chamadaDetalhe}>{CHAMADA_CATEGORIA[categoria]}</AppText>
            {trocas === null && !erro && <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />}
            {erro && <AppText style={styles.aviso}>Não deu pra carregar as sugestões agora. Tenta de novo daqui a pouco.</AppText>}
            {trocas !== null && !erro && opcoes.length === 0 && (
              <AppText style={styles.aviso}>Ainda não temos sugestões nessa categoria. Em breve tem novidade!</AppText>
            )}
            {opcoes.length > 0 && (
              <AlternativasLista
                categoria={categoria}
                itens={opcoes.map((t) => ({ id: t.id, nome: t.destinoNome, explicacao: t.frase, dica: t.dica, nutrientes: t.nutrientes, rapida: t.rapida }))}
              />
            )}
          </MotiView>
        )}
      </ScrollView>

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="alimentacao" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  cabecalho: { marginTop: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  tituloBloco: { flex: 1, alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 14 },
  chamadaDetalhe: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', lineHeight: 20, marginBottom: 14 },
  aviso: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', textAlign: 'center', marginTop: 32 },
});
