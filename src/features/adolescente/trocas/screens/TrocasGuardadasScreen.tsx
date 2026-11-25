// src/features/adolescente/trocas/screens/TrocasGuardadasScreen.tsx
//
// "Minhas ideias pra testar": trocas com "QUERO TESTAR" que ainda não tiveram resposta. Tocar abre
// o "Testei?" daquela troca (dá para contar antes dos 2 dias, se já testou).
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useTrocasGuardadas } from '../hooks/useTrocasGuardadas';
import { iconeDoDestino } from '../utils/iconesTrocas';
import { noLugarDe } from '../utils/trocas';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'TrocasGuardadas'>;

function quando(dias: number): string {
  if (dias === 0) return 'Guardada hoje';
  if (dias === 1) return 'Guardada ontem';
  return `Guardada há ${dias} dias`;
}

export default function TrocasGuardadasScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { guardadas, carregado } = useTrocasGuardadas();

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScreenHeader titulo="Minhas ideias" subtitulo="Pra testar quando der" onVoltar={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={[styles.conteudo, { paddingBottom: 16 + insets.bottom }]}>
        {!carregado && <ActivityIndicator color={colors.primary} style={styles.carregando} />}
        {carregado && guardadas.length === 0 && (
          <View style={styles.vazio}>
            <AppText style={styles.vazioTexto}>
              Nenhuma ideia guardada ainda. Nas cartas de trocas, toque em "QUERO TESTAR" pra guardar.
            </AppText>
            <AppButton label="VER IDEIAS" onPress={() => navigation.goBack()} />
          </View>
        )}
        {guardadas.map((g) => (
          <Pressable
            key={g.troca.id}
            onPress={() => navigation.navigate('TrocaTestei', { trocaId: g.troca.id })}
            style={({ pressed }) => [styles.linha, pressed && styles.linhaPressionada]}
            accessibilityRole="button"
            accessibilityLabel={`${g.troca.destinoNome}. ${quando(g.dias)}. Contar como foi`}
          >
            <View style={styles.icone}>
              <MaterialCommunityIcons name={iconeDoDestino(g.troca.destinoNome) as any} size={22} color={colors.primaryDark} />
            </View>
            <View style={styles.flex}>
              <AppText style={styles.nome}>{g.troca.destinoNome}</AppText>
              <AppText style={styles.meta}>
                {noLugarDe(g.troca.categoria)} · {quando(g.dias)}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  carregando: { marginTop: 40 },
  vazio: { gap: 16, marginTop: 24 },
  vazioTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: colors.textoSuave, textAlign: 'center' },
  linha: {
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
  linhaPressionada: { backgroundColor: colors.superficieSuave },
  icone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.exercicioAcertoFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  meta: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave, marginTop: 2 },
});
