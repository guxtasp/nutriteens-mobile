// src/features/adolescente/social/screens/ReceitaCompartilhadaScreen.tsx
//
// Abre uma receita que um amigo mandou (vinda da Central de Notificações).
// Só leitura: ver os detalhes e o passo a passo, sem adicionar ao registro.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import ReceitaDetalheSheet from '../../alimentacao/components/ReceitaDetalheSheet';
import { buscarReceitaPorId, type ReceitaComAlimento } from '../../alimentacao/services/receitasService';

export default function ReceitaCompartilhadaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdolescenteStackParamList>>();
  const { params } = useRoute<RouteProp<AdolescenteStackParamList, 'ReceitaCompartilhada'>>();
  const [receita, setReceita] = useState<ReceitaComAlimento | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando');

  useEffect(() => {
    let ativo = true;
    buscarReceitaPorId(params.receitaId)
      .then((r) => {
        if (!ativo) return;
        setReceita(r);
        setEstado(r ? 'ok' : 'erro');
      })
      .catch(() => ativo && setEstado('erro'));
    return () => {
      ativo = false;
    };
  }, [params.receitaId]);

  return (
    <SafeAreaView style={styles.tela}>
      {estado === 'carregando' && <ActivityIndicator size="large" color={colors.primaryDark} />}
      {estado === 'erro' && (
        <View style={styles.centro}>
          <AppText style={styles.texto}>Não encontramos essa receita agora.</AppText>
          <TouchableOpacity style={styles.botao} onPress={() => navigation.goBack()} accessibilityRole="button">
            <AppText style={styles.botaoTexto}>Voltar</AppText>
          </TouchableOpacity>
        </View>
      )}
      {estado === 'ok' && <ReceitaDetalheSheet receita={receita} onFechar={() => navigation.goBack()} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F3F8EE', justifyContent: 'center' },
  centro: { alignItems: 'center', gap: 16, padding: 24 },
  texto: { fontSize: 15, color: colors.primaryDark, textAlign: 'center' },
  botao: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
});
