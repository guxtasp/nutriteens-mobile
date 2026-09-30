// src/features/adolescente/trilha/screens/LicaoCompletaScreen.tsx
//
// Corresponde à tela "Lição completa!" do Figma — só XP, sem acertos (isso
// só aparece nas telas de conclusão de Módulo/Trilha, ver
// ModuloCompletaScreen.tsx e TrilhaCompletaScreen.tsx).
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

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'LicaoCompleta'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'LicaoCompleta'>;

export default function LicaoCompletaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.corpo}>
        <View style={styles.cabecalho}>
          <AppText style={styles.titulo}>Lição{'\n'}completa!</AppText>
          <Ionicons name="gift" size={48} color={colors.primary} />
        </View>

        {/* Decorativo por enquanto — não existe lógica de boost de XP no
            app ainda (nem tabela, nem regra). Fica aqui só pra bater com o
            visual do Figma; vale decidir se essa mecânica entra de vez. */}
        <View style={styles.boostPill}>
          <AppText style={styles.boostTexto}>BOOST DA LIÇÃO</AppText>
        </View>

        <View style={styles.linha}>
          <AppText style={styles.linhaLabel}>XP GANHO</AppText>
          <View style={styles.linhaValor}>
            <Ionicons name="gift" size={16} color={colors.primary} />
            <AppText style={styles.linhaNumero}>{params.xpGanho}</AppText>
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
