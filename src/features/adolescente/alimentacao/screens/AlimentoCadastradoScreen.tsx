// src/features/adolescente/screens/AlimentoCadastradoScreen.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { typography } from '../../../../shared/theme/typography';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'AlimentoCadastrado'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'AlimentoCadastrado'>;

export default function AlimentoCadastradoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      // volta pra tela de busca já com o alimento recém-criado disponível
      navigation.navigate('BuscaAlimento', {
        tipo: params.tipo,
        nomeRefeicao: params.nomeRefeicao,
        alimentoRecemCriado: params.alimento,
      });
    }, 1400);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.conteudo}>
        <AppText style={styles.titulo}>Alimento</AppText>
        <AppText style={styles.subtitulo}>Cadastrado</AppText>
        <View style={styles.iconeCirculo}>
          <AppText style={{ fontSize: 32 }}>🥦</AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#1F5138', justifyContent: 'center', alignItems: 'center' },
  conteudo: { alignItems: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 26, color: '#8BC34A' },
  subtitulo: { fontFamily: typography.regular, fontSize: 26, color: '#3F7A5A', marginBottom: 24 },
  iconeCirculo: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
});