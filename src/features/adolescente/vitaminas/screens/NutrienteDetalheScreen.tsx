// src/features/adolescente/vitaminas/screens/NutrienteDetalheScreen.tsx
// RF016 — página de UM nutriente: para que serve, uma dica e onde encontrar (do catálogo).
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAcoesRapidas, AcaoRapida } from '../../_shared/hooks/useAcoesRapidas';
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { infoDoNutriente } from '../data/nutrientesInfo';
import { buscarFontes } from '../services/fontesService';
import { detalheDoNutriente, AlimentoCatalogo } from '../utils/fontesNutriente';
import FontesGrade, { ItemFonte } from '../components/FontesGrade';
import { vit } from '../ui/tokens';
import { HeroNutriente } from '../components/SimboloAnimado';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'NutrienteDetalhe'>;
type Rota = RouteProp<AdolescenteStackParamList, 'NutrienteDetalhe'>;

export default function NutrienteDetalheScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rota>();
  const { userId } = useAuth();
  const info = infoDoNutriente(params.nutriente);
  const [fontes, setFontes] = useState<AlimentoCatalogo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [menuAberto, setMenuAberto] = useState(false);
  const navegarAcaoRapida = useAcoesRapidas();

  useEffect(() => {
    if (!userId) return;
    let ativo = true;
    setErro(false);
    setFontes(null);
    buscarFontes(userId, params.nutriente)
      .then((l) => { if (ativo) setFontes(l); })
      .catch((e) => { console.error('Erro ao buscar fontes:', e); if (ativo) setErro(true); });
    return () => { ativo = false; };
  }, [userId, params.nutriente, tentativa]);

  const itens: ItemFonte[] = useMemo(() => (fontes ?? []).flatMap((f) => {
    const d = detalheDoNutriente(f, params.nutriente);
    return d ? [{ id: f.id, nome: f.nome, nivel: d.nivel, origem: d.origem }] : [];
  }), [fontes, params.nutriente]);

  function handleSelecionarAcao(opcao: AcaoRapida) {
    setMenuAberto(false);
    navegarAcaoRapida(opcao);
  }

  // chave desconhecida: em vez de tela em branco, explica e deixa voltar
  if (!info) {
    return (
      <SafeAreaView style={styles.tela}>
        <View style={styles.cabecalho}>
          <BackButton onPress={() => navigation.goBack()} />
          <View style={styles.tituloBloco}><AppText style={styles.titulo}>Nutriente</AppText></View>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.estado}>
          <AppText style={styles.estadoTitulo}>Não encontramos esse nutriente</AppText>
          <AppText style={styles.estadoTexto}>Volte para a lista e escolha outro.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo} accessibilityRole="header">{info.nome}</AppText>
          <AppText style={styles.subtitulo}>{info.tipo === 'VITAMINA' ? 'Vitamina' : 'Mineral'}</AppText>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <HeroNutriente simbolo={info.simbolo} />

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 320, delay: 120 }}>
          <AppText style={styles.secaoTitulo} accessibilityRole="header">Para que serve</AppText>
          <View style={styles.card}>
            <AppText style={styles.texto}>{info.paraQueServe}</AppText>
          </View>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 320, delay: 220 }}>
          <View style={styles.dica}>
            <Ionicons name="bulb-outline" size={22} color={vit.texto} />
            <AppText style={styles.dicaTexto}>{info.dica}</AppText>
          </View>
        </MotiView>

        <View>
          <AppText style={styles.secaoTitulo} accessibilityRole="header">Onde encontrar</AppText>

          {fontes === null && !erro && (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} accessibilityLabel="Carregando alimentos" />
          )}

          {erro && (
            <View style={styles.estadoCard}>
              <AppText style={styles.estadoTexto}>Não deu pra carregar os alimentos agora.</AppText>
              <Pressable
                onPress={() => setTentativa((t) => t + 1)}
                style={({ pressed }) => [styles.botao, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Tentar carregar os alimentos de novo"
              >
                <AppText style={styles.botaoTexto}>Tentar de novo</AppText>
              </Pressable>
            </View>
          )}

          {fontes !== null && itens.length === 0 && (
            <View style={styles.estadoCard}>
              <Ionicons name="leaf-outline" size={28} color={vit.texto} />
              <AppText style={styles.estadoTitulo}>Estamos reunindo os alimentos</AppText>
              <AppText style={styles.estadoTexto}>
                Ainda não temos alimentos confirmados como fonte de {info.nome.toLowerCase()}. Enquanto isso, a dica acima já ajuda.
              </AppText>
              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => [styles.botao, pressed && { opacity: 0.85 }]}
                accessibilityRole="button"
                accessibilityLabel="Voltar e ver outros nutrientes"
              >
                <AppText style={styles.botaoTexto}>Ver outros nutrientes</AppText>
              </Pressable>
            </View>
          )}

          {itens.length > 0 && <FontesGrade itens={itens} nutrienteNome={info.nome} />}
        </View>
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
  titulo: { fontFamily: typography.bold, fontSize: 20, color: vit.texto, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, color: vit.textoSuave, textAlign: 'center', marginTop: 2 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 16, color: vit.texto, marginBottom: 10 },
  card: { borderWidth: 1.5, borderColor: vit.borda, borderRadius: 16, padding: 16 },
  texto: { fontFamily: typography.regular, fontSize: 14, color: vit.textoSuave, lineHeight: 21 },
  dica: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: vit.fundoSuave, borderRadius: 16, padding: 16 },
  dicaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: vit.texto, lineHeight: 20 },
  estado: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  estadoCard: { borderWidth: 1.5, borderColor: vit.borda, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  estadoTitulo: { fontFamily: typography.bold, fontSize: 15, color: vit.texto, textAlign: 'center' },
  estadoTexto: { fontFamily: typography.regular, fontSize: 14, color: vit.textoSuave, textAlign: 'center', lineHeight: 20 },
  botao: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 22, backgroundColor: vit.texto },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
});
