// src/features/adolescente/trilha/screens/LicaoCompletaScreen.tsx
//
// Corresponde à tela "Lição completa!" do Figma — só XP, sem acertos (isso
// só aparece nas telas de conclusão de Módulo/Trilha, ver
// ModuloCompletaScreen.tsx e TrilhaCompletaScreen.tsx).
import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BroxisPose } from '../../../../shared/ui/BroxisPose';
import { TelaBase } from '../../../../shared/ui/TelaBase';
import { RodapeAcoes } from '../../../../shared/ui/RodapeAcoes';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'LicaoCompleta'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'LicaoCompleta'>;

export default function LicaoCompletaScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();
  const { height } = useWindowDimensions();
  // o Bróxis ocupa o espaço livre acima dos números, encolhendo em tela baixa
  const tamanhoBroxis = Math.max(140, Math.min(height * 0.32, 260));

  return (
    // Tela de celebração: sem cabeçalho nem voltar de propósito (o único caminho é CONTINUAR).
    // Rolável só para fonte grande/tela baixa; o palco do Bróxis continua ocupando o espaço livre.
    <TelaBase
      rolavel
      conteudoStyle={styles.corpo}
      rodape={
        <RodapeAcoes semDivisoria espacoMin={32} style={styles.rodape}>
          <AppButton
            label="CONTINUAR"
            backgroundColor={colors.primary}
            textColor={colors.white}
            shadowColor={colors.primaryShadow}
            fullWidth
            onPress={() => navigation.navigate('Trilha')}
          />
        </RodapeAcoes>
      }
    >
      <View style={styles.palco}>
        <BroxisPose pose="comemorando" tamanho={tamanhoBroxis} rotulo="Bróxis pulando de alegria" />
      </View>

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
        <AppText style={styles.linhaLabel}>{params.pendente ? 'XP' : 'XP GANHO'}</AppText>
        <View style={styles.linhaValor}>
          <Ionicons name="gift" size={16} color={colors.primary} />
          <AppText style={styles.linhaNumero}>{params.pendente ? 'a caminho' : params.xpGanho}</AppText>
        </View>
      </View>
    </TelaBase>
  );
}

const styles = StyleSheet.create({
  // flexGrow: o palco (flex: 1) ocupa a sobra; o fim da rolagem (24) vem da TelaBase
  corpo: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 24 },
  palco: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 140 },
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
  rodape: { paddingHorizontal: 24 },
});
