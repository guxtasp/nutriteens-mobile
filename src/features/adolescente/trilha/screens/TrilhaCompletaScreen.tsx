// src/features/adolescente/trilha/screens/TrilhaCompletaScreen.tsx
//
// "Trilha completa!" — fecha o capítulo inteiro do Guia Alimentar. XP
// ganho (lição + bônus de módulo + bônus de trilha, já somados pelo
// service) + % de ACERTOS do "Fechamento do Capítulo" (a Revisão densa do
// módulo 3, ver seção 3 do modelo-pedagogico-trilha.md).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'TrilhaCompleta'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'TrilhaCompleta'>;

export default function TrilhaCompletaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.corpo}>
        <View style={styles.cabecalho}>
          <AppText style={styles.titulo}>Trilha{'\n'}completa!</AppText>
          <Ionicons name="ribbon" size={48} color={colors.primary} />
        </View>

        <View style={styles.boostPill}>
          <AppText style={styles.boostTexto}>CAPÍTULO CONCLUÍDO</AppText>
        </View>

        <View style={styles.linhas}>
          <View style={styles.linha}>
            <AppText style={styles.linhaLabel}>XP GANHO</AppText>
            <View style={styles.linhaValor}>
              <Ionicons name="gift" size={16} color={colors.primary} />
              <AppText style={styles.linhaNumero}>{params.xpGanho}</AppText>
            </View>
          </View>

          <View style={styles.linha}>
            <AppText style={styles.linhaLabel}>ACERTOS</AppText>
            <View style={styles.linhaValor}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <AppText style={styles.linhaNumero}>{params.acertosPercentual}%</AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.rodape}>
        <AppButton
          label="CONTINUAR"
          backgroundColor={colors.primary}
          textColor={colors.white}
          shadowColor={colors.primaryShadow}
          fullWidth
          onPress={() => navigation.navigate('Trilha')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white, justifyContent: 'space-between' },
  corpo: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 24 },
  cabecalho: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 34, lineHeight: 38, color: colors.primary },
  boostPill: {
    alignSelf: 'flex-end',
    backgroundColor: '#E8F8E0',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  boostTexto: { fontFamily: typography.bold, fontSize: 11, color: colors.primaryShadow },
  linhas: { gap: 12 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E2E8DD',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  linhaLabel: { fontFamily: typography.semiBold, fontSize: 13, color: colors.placeholder },
  linhaValor: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linhaNumero: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  rodape: { paddingHorizontal: 24, paddingBottom: 32 },
});
