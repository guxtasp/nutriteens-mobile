// src/features/adolescente/screens/NovoAlimentoOrigemScreen.tsx
// Cadastro de alimento, passo 1: de onde vem o alimento (natural, feito em casa, industrializado).
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { InfoButton } from '../../../../shared/ui/InfoButton';
import { InfoSheet } from '../../../../shared/ui/InfoSheet';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { ProgressoCadastro } from '../components/ProgressoCadastro';
import type { OrigemAlimento } from '../utils/categoriasAlimento';

// o tipo mora em utils/categoriasAlimento (sem React, testável); reexportado porque o navegador importa daqui
export type { OrigemAlimento } from '../utils/categoriasAlimento';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'NovoAlimentoOrigem'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'NovoAlimentoOrigem'>;

type InfoOrigem = {
  titulo: string;
  exemplo: string;
  /** o que a pessoa vai fazer no passo 2, para não ser surpresa */
  regra: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** cor de fundo e do ícone da "fichinha" de cada origem */
  fundo: string;
  cor: string;
};

/** Visual de cada origem; o formulário (passo 2) reaproveita para mostrar a origem escolhida. */
export const INFO_ORIGEM: Record<OrigemAlimento, InfoOrigem> = {
  NATURAL: { titulo: 'Alimento natural', exemplo: 'Por exemplo: maçã, banana, alface', regra: 'Você escolhe 1 grupo', icone: 'leaf', fundo: '#E2F3D3', cor: '#2E7D4F' },
  PREPARADO_EM_CASA: { titulo: 'Preparado em casa', exemplo: 'Por exemplo: bolo de cenoura, sopa, geleia caseira', regra: 'Você marca os grupos dos ingredientes', icone: 'home', fundo: '#FFEFCF', cor: '#B7791F' },
  INDUSTRIALIZADO: { titulo: 'Produto industrializado', exemplo: 'Por exemplo: refrigerante, biscoito recheado, salgadinho', regra: 'Você marca os grupos que aparecem no rótulo', icone: 'cube', fundo: '#FFE1DD', cor: '#C0392B' },
};

// do mais natural para o mais processado
const ORDEM: OrigemAlimento[] = ['NATURAL', 'PREPARADO_EM_CASA', 'INDUSTRIALIZADO'];

export default function NovoAlimentoOrigemScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const [infoVisivel, setInfoVisivel] = useState(false);

  function selecionar(origem: OrigemAlimento) {
    navigation.navigate('NovoAlimentoForm', { tipo: params.tipo, nomeRefeicao: params.nomeRefeicao, origem });
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScreenHeader
        titulo="Novo alimento"
        subtitulo="Passo 1 de 2"
        onVoltar={() => navigation.goBack()}
        direita={<InfoButton onPress={() => setInfoVisivel(true)} accessibilityLabel="Entender a origem" />}
      />
      <ProgressoCadastro passo={1} />

      <View style={styles.corpo}>
        <AppText style={styles.titulo}>De onde vem esse alimento?</AppText>
        <AppText style={styles.dica}>Escolha o que mais combina com ele.</AppText>

        <View style={styles.lista}>
          {ORDEM.map((origem) => {
            const o = INFO_ORIGEM[origem];
            return (
              <Pressable
                key={origem}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressionado]}
                onPress={() => selecionar(origem)}
                accessibilityRole="button"
                accessibilityLabel={`${o.titulo}. ${o.exemplo}. ${o.regra}`}
              >
                <View style={[styles.ficha, { backgroundColor: o.fundo }]}>
                  <Ionicons name={o.icone} size={26} color={o.cor} />
                </View>
                <View style={styles.cardTextos}>
                  <AppText style={styles.cardTitulo}>{o.titulo}</AppText>
                  <AppText style={styles.cardExemplo}>{o.exemplo}</AppText>
                  <View style={styles.cardRegra}>
                    <Ionicons name="checkbox-outline" size={13} color={o.cor} />
                    <AppText style={[styles.cardRegraTexto, { color: o.cor }]}>{o.regra}</AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <InfoSheet
        visivel={infoVisivel}
        onFechar={() => setInfoVisivel(false)}
        titulo="Qual a origem do alimento?"
        icone="restaurant-outline"
        explicacao="A origem ajuda a gente a entender o quanto o alimento foi processado antes de chegar até você. No próximo passo você diz o nome e em quais grupos alimentares ele entra."
        exemplo="Natural = veio direto da natureza (fruta, legume, ovo). Preparado em casa = você ou sua família cozinhou (bolo, sopa). Industrializado = veio pronto de fábrica, com embalagem e rótulo."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F6FAF1' },
  corpo: { flex: 1, paddingHorizontal: 20 },
  titulo: { fontFamily: typography.bold, fontSize: 24, lineHeight: 30, color: colors.primaryDark },
  dica: { fontFamily: typography.regular, fontSize: 14, color: '#5B6B75', marginTop: 4, marginBottom: 20 },
  lista: { gap: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.white, borderRadius: 20, padding: 14,
    borderWidth: 1.5, borderColor: '#DDE8D2', borderBottomWidth: 4,
  },
  cardPressionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  ficha: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardTextos: { flex: 1, gap: 2 },
  cardTitulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  cardExemplo: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: '#5B6B75' },
  cardRegra: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  cardRegraTexto: { flex: 1, fontFamily: typography.bold, fontSize: 11 },
});
