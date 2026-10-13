// src/features/adolescente/vitaminas/screens/NutrienteDetalheScreen.tsx
// RF016 — página de UM nutriente: para que serve, uma dica e onde encontrar (do catálogo).
import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
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
import HomeBottomBar from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { AlternativasGrade } from '../../trocas/components/TrocaLista';
import { infoDoNutriente } from '../data/nutrientesInfo';
import { buscarFontes } from '../services/fontesService';
import type { AlimentoCatalogo } from '../utils/fontesNutriente';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'NutrienteDetalhe'>;
type Rota = RouteProp<AdolescenteStackParamList, 'NutrienteDetalhe'>;

export default function NutrienteDetalheScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rota>();
  const { userId } = useAuth();
  const info = infoDoNutriente(params.nutriente);
  const [fontes, setFontes] = useState<AlimentoCatalogo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let ativo = true;
    buscarFontes(userId, params.nutriente)
      .then((l) => { if (ativo) setFontes(l); })
      .catch((e) => { console.error('Erro ao buscar fontes:', e); if (ativo) setErro(true); });
    return () => { ativo = false; };
  }, [userId, params.nutriente]);

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else navigation.navigate('TipoRefeicao');
  }

  if (!info) return null;

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.cabecalho}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.tituloBloco}>
          <AppText style={styles.titulo}>{info.nome}</AppText>
          <AppText style={styles.subtitulo}>{info.tipo === 'VITAMINA' ? 'Vitamina' : 'Mineral'}</AppText>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 140 }}
          style={styles.heroBox}
        >
          <View style={styles.hero}><AppText style={styles.heroTexto}>{info.simbolo}</AppText></View>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 320, delay: 120 }}>
          <AppText style={styles.secaoTitulo}>Para que serve</AppText>
          <View style={styles.card}>
            <AppText style={styles.texto}>{info.paraQueServe}</AppText>
          </View>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 320, delay: 220 }}>
          <View style={styles.dica}>
            <Ionicons name="bulb-outline" size={22} color="#8BC34A" />
            <AppText style={styles.dicaTexto}>{info.dica}</AppText>
          </View>
        </MotiView>

        <View>
          <AppText style={styles.secaoTitulo}>Onde encontrar</AppText>
          {fontes === null && !erro && <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />}
          {erro && <AppText style={styles.aviso}>Não deu pra carregar os alimentos agora. Tenta de novo daqui a pouco.</AppText>}
          {fontes !== null && fontes.length === 0 && (
            <AppText style={styles.aviso}>Ainda não temos alimentos marcados como fonte desse nutriente.</AppText>
          )}
          {fontes !== null && fontes.length > 0 && (
            <AlternativasGrade itens={fontes.map((f) => ({ id: f.id, nome: f.nome }))} atrasoInicial={300} />
          )}
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
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, textAlign: 'center' },
  subtitulo: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', textAlign: 'center', marginTop: 2 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },
  heroBox: { alignItems: 'center' },
  hero: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  heroTexto: { fontFamily: typography.bold, fontSize: 30, color: '#fff' },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, marginBottom: 10 },
  card: { borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16, padding: 16 },
  texto: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', lineHeight: 21 },
  dica: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: '#F0F5F1', borderRadius: 16, padding: 16 },
  dicaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, color: colors.primaryDark, lineHeight: 19 },
  aviso: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', textAlign: 'center', marginTop: 12 },
});
