// src/features/adolescente/vitaminas/screens/NutrienteDetalheScreen.tsx
// RF016 — página de UM nutriente: para que serve, uma dica e onde encontrar (do catálogo).
// Rebrand: selo "SUPERPODER" abaixo do herói, "Combo que funciona" quando houver `combo` e o
// cartão do teste rápido no fim (atrás de TESTE_RAPIDO_ATIVO).
// Animação calma: selo, superpoder e combo aparecem com fade curto, um depois do outro (sem mola,
// sem loop). "Reduzir movimento" mostra tudo parado.
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAcoesRapidas, AcaoRapida } from '../../_shared/hooks/useAcoesRapidas';
import HomeBottomBar, { useAlturaBarraAbas } from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import { infoDoNutriente } from '../data/nutrientesInfo';
import { buscarFontes } from '../services/fontesService';
import { detalheDoNutriente, AlimentoCatalogo } from '../utils/fontesNutriente';
import FontesGrade, { ItemFonte } from '../components/FontesGrade';
import { vit } from '../ui/tokens';
import { HeroNutriente } from '../components/SimboloAnimado';
import CartaoHub from '../../alimentacao/components/CartaoHub';
import { TESTE_RAPIDO_ATIVO } from '../data/perguntasNutriente';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'NutrienteDetalhe'>;
type Rota = RouteProp<AdolescenteStackParamList, 'NutrienteDetalhe'>;

export default function NutrienteDetalheScreen() {
  const alturaBarra = useAlturaBarraAbas();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rota>();
  const { userId } = useAuth();
  const info = infoDoNutriente(params.nutriente);
  const [fontes, setFontes] = useState<AlimentoCatalogo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [menuAberto, setMenuAberto] = useState(false);
  const navegarAcaoRapida = useAcoesRapidas();
  const reduzir = useReduzirMovimento();
  const parado = { type: 'timing' as const, duration: 0 };

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
      <SafeAreaView style={styles.tela} edges={['top']}>
        <ScreenHeader titulo="Nutriente" onVoltar={() => navigation.goBack()} />
        <View style={styles.estado}>
          <AppText style={styles.estadoTitulo}>Não encontramos esse nutriente</AppText>
          <AppText style={styles.estadoTexto}>Volte para a lista e escolha outro.</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScreenHeader titulo={info.nome} subtitulo={info.tipo === 'VITAMINA' ? 'Vitamina' : 'Mineral'} onVoltar={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: alturaBarra + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroBloco}>
          <HeroNutriente simbolo={info.simbolo} />
          <MotiView
            from={{ opacity: reduzir ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={reduzir ? parado : { type: 'timing', duration: 260, delay: 150 }}
            style={styles.selo}
          >
            <AppText style={styles.seloTexto}>SUPERPODER</AppText>
          </MotiView>
          <MotiView
            from={reduzir ? { opacity: 1 } : { opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={reduzir ? parado : { type: 'timing', duration: 280, delay: 250 }}
          >
            <AppText style={styles.superpoder} accessibilityRole="header">
              {info.superpoder}
            </AppText>
          </MotiView>
        </View>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 320, delay: 120 }}>
          <AppText style={styles.secaoTitulo} accessibilityRole="header">Para que serve</AppText>
          <View style={styles.card}>
            <AppText style={styles.texto}>{info.paraQueServe}</AppText>
          </View>
        </MotiView>

        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 320, delay: 220 }}>
          {info.combo ? (
            <View style={styles.combo} accessible accessibilityLabel={`Combo que funciona: ${info.combo[0]} mais ${info.combo[1]}. ${info.dica}`}>
              <View style={styles.comboTopo}>
                <Ionicons name="bulb-outline" size={20} color={vit.texto} />
                <AppText style={styles.comboTitulo}>Combo que funciona</AppText>
              </View>
              <View style={styles.comboLinha}>
                <View style={styles.comboChip}>
                  <AppText style={styles.comboChipTexto}>{info.combo[0]}</AppText>
                </View>
                <AppText style={styles.comboMais}>+</AppText>
                <View style={styles.comboChip}>
                  <AppText style={styles.comboChipTexto}>{info.combo[1]}</AppText>
                </View>
              </View>
              <AppText style={styles.dicaTexto}>{info.dica}</AppText>
            </View>
          ) : (
            <View style={styles.dica}>
              <Ionicons name="bulb-outline" size={22} color={vit.texto} />
              <AppText style={styles.dicaTexto}>{info.dica}</AppText>
            </View>
          )}
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

        {TESTE_RAPIDO_ATIVO && (
          <CartaoHub
            tags={['TESTE RÁPIDO', '+10 XP']}
            corTag={[undefined, colors.amareloDestaque]}
            titulo="Bora ver se ficou?"
            tituloNatural
            subtitulo="3 perguntas rápidas, sem nota."
            icone="lightning-bolt-outline"
            onPress={() => navigation.navigate('TesteNutriente', { nutriente: params.nutriente })}
          />
        )}
      </ScrollView>

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="alimentacao" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, gap: 20 },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 16, color: vit.texto, marginBottom: 10 },
  card: { borderWidth: 1.5, borderColor: vit.borda, borderRadius: 16, padding: 16 },
  texto: { fontFamily: typography.regular, fontSize: 14, color: vit.textoSuave, lineHeight: 21 },
  heroBloco: { alignItems: 'center', gap: 10 },
  selo: { backgroundColor: vit.fundoDestaque, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  seloTexto: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 1.1, color: colors.destaqueTexto },
  superpoder: { fontFamily: typography.bold, fontSize: 20, lineHeight: 26, color: vit.texto, textAlign: 'center' },
  combo: { backgroundColor: vit.fundoSuave, borderRadius: 16, padding: 16, gap: 10 },
  comboTopo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  comboTitulo: { fontFamily: typography.bold, fontSize: 14, color: vit.texto },
  comboLinha: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  comboChip: { backgroundColor: colors.white, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  comboChipTexto: { fontFamily: typography.bold, fontSize: 14, color: vit.texto },
  comboMais: { fontFamily: typography.bold, fontSize: 18, color: colors.destaqueTexto },
  dica: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: vit.fundoSuave, borderRadius: 16, padding: 16 },
  dicaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: vit.texto, lineHeight: 20 },
  estado: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  estadoCard: { borderWidth: 1.5, borderColor: vit.borda, borderRadius: 16, padding: 20, alignItems: 'center', gap: 8 },
  estadoTitulo: { fontFamily: typography.bold, fontSize: 15, color: vit.texto, textAlign: 'center' },
  estadoTexto: { fontFamily: typography.regular, fontSize: 14, color: vit.textoSuave, textAlign: 'center', lineHeight: 20 },
  botao: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 22, backgroundColor: vit.texto },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
});
