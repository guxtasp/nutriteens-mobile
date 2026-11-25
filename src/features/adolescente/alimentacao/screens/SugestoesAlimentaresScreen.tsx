// src/features/adolescente/alimentacao/screens/SugestoesAlimentaresScreen.tsx
// Hub de trocas "Bateu vontade de quê?" (RF015 + HANDOFF_REBRAND fase 3.1): ideia do dia,
// grade de categorias e "Minhas ideias pra testar". Tocar numa categoria abre o baralho de cartas.
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import HomeBottomBar, { useAlturaBarraAbas } from '../../_shared/components/HomeBottomBar';
import QuickActionsMenu from '../../_shared/components/QuickActionsMenu';
import CartaoHub from '../components/CartaoHub';
import TileCategoria from '../../trocas/components/TileCategoria';
import { useTrocasGuardadas } from '../../trocas/hooks/useTrocasGuardadas';
import { ICONE_CATEGORIA, iconeDoDestino } from '../../trocas/utils/iconesTrocas';
import { escolherIdeiaDoDia } from '../../trocas/utils/avaliacaoTrocas';
import {
  CATEGORIAS_TROCA,
  CategoriaTroca,
  noLugarDe,
  ROTULO_CATEGORIA,
  semDestinoRepetido,
} from '../../trocas/utils/trocas';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'SugestoesAlimentares'>;
type Rota = RouteProp<AdolescenteStackParamList, 'SugestoesAlimentares'>;

// giro leve alternado dos tiles (graus), na ordem de CATEGORIAS_TROCA
const GIROS = [-2, 2, 1.5, -1.5, -1, 1, 0];

function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SugestoesAlimentaresScreen() {
  const alturaBarra = useAlturaBarraAbas();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rota>();
  const reduzirMovimento = useReduzirMovimento();
  const [menuAberto, setMenuAberto] = useState(false);
  const { trocas, guardadas, carregado } = useTrocasGuardadas();

  // vindo do retorno da refeição ou do scanner: abre direto o baralho daquela categoria
  useEffect(() => {
    if (params?.categoria) {
      const categoria = params.categoria;
      navigation.setParams({ categoria: undefined });
      navigation.navigate('TrocaBaralho', { categoria });
    }
  }, [params?.categoria, navigation]);

  const ideia = useMemo(() => escolherIdeiaDoDia(trocas, hojeLocal()), [trocas]);

  function quantidade(c: CategoriaTroca): number | null {
    if (!carregado) return null;
    return semDestinoRepetido(trocas.filter((t) => t.categoria === c)).length;
  }

  function handleSelecionarAcao(opcao: 'alimentacao' | 'agua' | 'atividade') {
    setMenuAberto(false);
    if (opcao === 'atividade') navigation.navigate('AtividadeFisica');
    else if (opcao === 'agua') navigation.navigate('ConsumoAgua');
    else navigation.navigate('TipoRefeicao');
  }

  const nomesGuardadas = guardadas.slice(0, 3).map((g) => g.troca.destinoNome).join(', ');

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScreenHeader titulo="Trocas" subtitulo="Ideias pra variar o lanche" onVoltar={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.conteudo, { paddingBottom: alturaBarra + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: reduzirMovimento ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 220 }}
        >
          <AppText style={styles.titulo} accessibilityRole="header">
            Bateu vontade de quê?
          </AppText>
          <AppText style={styles.apoio}>Toca numa vontade e eu te mostro ideias pra trocar.</AppText>
        </MotiView>

        {ideia && (
          <MotiView
            from={{ opacity: reduzirMovimento ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 240, delay: 80 }}
          >
          <CartaoHub
            tags={['IDEIA DO DIA']}
            corTag={colors.amareloDestaque}
            titulo={ideia.destinoNome}
            tituloNatural
            subtitulo={`${noLugarDe(ideia.categoria)}. ${ideia.frase}`}
            icone={iconeDoDestino(ideia.destinoNome)}
            onPress={() => navigation.navigate('TrocaBaralho', { categoria: ideia.categoria, trocaInicialId: ideia.id })}
          />
          </MotiView>
        )}

        <View style={styles.grade}>
          {CATEGORIAS_TROCA.map((c, i) => (
            <TileCategoria
              key={c}
              nome={ROTULO_CATEGORIA[c]}
              icone={ICONE_CATEGORIA[c]}
              quantidade={quantidade(c)}
              giro={reduzirMovimento ? 0 : GIROS[i] ?? 0}
              // número ímpar de categorias: a última ocupa a linha inteira
              larguraInteira={CATEGORIAS_TROCA.length % 2 === 1 && i === CATEGORIAS_TROCA.length - 1}
              atraso={120 + i * 40}
              reduzirMovimento={reduzirMovimento}
              onPress={() => navigation.navigate('TrocaBaralho', { categoria: c })}
            />
          ))}
        </View>

        <Pressable
          onPress={() => navigation.navigate('TrocasGuardadas')}
          style={({ pressed }) => [styles.guardadas, pressed && styles.guardadasPressionada]}
          accessibilityRole="button"
          accessibilityLabel={`Minhas ideias pra testar, ${guardadas.length} guardadas`}
        >
          <View style={styles.guardadasIcone}>
            <Ionicons name="bookmark-outline" size={20} color={colors.destaqueTexto} />
          </View>
          <View style={styles.flex}>
            <AppText style={styles.guardadasTitulo}>Minhas ideias pra testar</AppText>
            <AppText style={styles.guardadasTexto} numberOfLines={1}>
              {guardadas.length === 0
                ? 'Nenhuma guardada ainda'
                : `${guardadas.length} ${guardadas.length === 1 ? 'guardada' : 'guardadas'} · ${nomesGuardadas}`}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
        </Pressable>
      </ScrollView>

      <QuickActionsMenu aberto={menuAberto} onFechar={() => setMenuAberto(false)} onSelecionar={handleSelecionarAcao} />
      <HomeBottomBar activeTab="alimentacao" menuAberto={menuAberto} onAbrirMenu={() => setMenuAberto((v) => !v)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  conteudo: { paddingHorizontal: 20, paddingTop: 6, gap: 16 },
  titulo: { fontFamily: typography.bold, fontSize: 28, lineHeight: 32, color: colors.primaryDark },
  apoio: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: colors.textoSuave, marginTop: 4 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  guardadas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: colors.bordaSuave,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  guardadasPressionada: { backgroundColor: colors.superficieSuave },
  guardadasIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.exercicioAcertoFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardadasTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  guardadasTexto: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave, marginTop: 1 },
});
